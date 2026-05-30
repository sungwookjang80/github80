'use client'

import { useEffect, useState } from 'react'

export default function LearningInsight() {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile/insight')
      .then(r => r.json())
      .then(d => setInsight(d.insight))
      .catch(() => setInsight(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border border-ocean-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="font-semibold text-gray-900">AI 학습 인사이트</h3>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-blue-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-blue-100 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-blue-100 rounded animate-pulse w-3/4" />
        </div>
      </div>
    )
  }

  if (!insight) {
    return (
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border border-ocean-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🧠</span>
          <h3 className="font-semibold text-gray-900">AI 학습 인사이트</h3>
        </div>
        <p className="text-sm text-gray-500">AI 튜터와 대화를 나누면 학습 인사이트가 자동으로 생성됩니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border border-ocean-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <h3 className="font-semibold text-gray-900">AI 학습 인사이트</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
    </div>
  )
}
