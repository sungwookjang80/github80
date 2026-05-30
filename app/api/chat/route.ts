import { createOpenAIClient, TUTOR_SYSTEM_PROMPT } from '@/lib/openai'
import { extractTopics } from '@/lib/topics'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo-user')?.value === 'true'
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!isDemo && !hasSupabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, content, messages: clientMessages } = await request.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  // Real Supabase mode: persist messages and extract topics
  if (!isDemo && hasSupabase && conversationId) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Save user message (best-effort)
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: content.trim(),
        })

        // Load full history from DB
        const { data: history } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        // Build history — ensure current user message is always included
        const historyMessages = (history || []).slice(-20).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
        const lastMsg = historyMessages[historyMessages.length - 1]
        if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== content.trim()) {
          historyMessages.push({ role: 'user', content: content.trim() })
        }

        const openai = createOpenAIClient()
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          stream: true,
          messages: [{ role: 'system', content: TUTOR_SYSTEM_PROMPT }, ...historyMessages],
        })

        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            let fullText = ''
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) {
                fullText += text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            }

            // Save AI response (best-effort)
            try {
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullText,
              })
            } catch { /* best-effort */ }

            // Extract and upsert topics (best-effort)
            try {
              const topics = extractTopics(content + ' ' + fullText)
              for (const tag of topics) {
                const { data: existing } = await supabase
                  .from('topics').select('count')
                  .eq('user_id', user.id).eq('tag', tag).single()
                if (existing) {
                  await supabase.from('topics')
                    .update({ count: existing.count + 1, last_seen_at: new Date().toISOString() })
                    .eq('user_id', user.id).eq('tag', tag)
                } else {
                  await supabase.from('topics')
                    .insert({ user_id: user.id, tag, count: 1, last_seen_at: new Date().toISOString() })
                }
              }
              await supabase.from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId)
            } catch { /* best-effort */ }

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
          },
        })

        return new Response(readable, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        })
      }
    } catch (e) {
      console.error('[Chat] Supabase error, falling back to stateless mode:', e)
      // fall through to stateless mode below
    }
  }

  // Demo mode (or Supabase auth failed): use client-side message history
  const chatMessages = [
    ...(clientMessages || []).slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: content.trim() },
  ]

  const openai = createOpenAIClient()
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [{ role: 'system', content: TUTOR_SYSTEM_PROMPT }, ...chatMessages],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
