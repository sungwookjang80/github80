import { createClient } from '@/lib/supabase/server'
import { createOpenAIClient, buildMessages, TUTOR_SYSTEM_PROMPT } from '@/lib/openai'
import { extractTopics } from '@/lib/topics'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, content } = await request.json()

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: 'conversationId and content are required' }, { status: 400 })
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: content.trim(),
  })

  const { data: history } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const openai = createOpenAIClient()
  const messages = buildMessages(history || [])

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: TUTOR_SYSTEM_PROMPT },
      ...messages,
    ],
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

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: fullText,
      })

      const topics = extractTopics(content + ' ' + fullText)
      for (const tag of topics) {
        await supabase.rpc('upsert_topic', { p_user_id: user.id, p_tag: tag })
      }

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
