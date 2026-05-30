import AssessmentQuiz from '@/components/assessment/AssessmentQuiz'
import Link from 'next/link'

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-nomad-bg">
      <header className="bg-white border-b border-sand-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">← 홈</Link>
        <h1 className="font-bold text-gray-900">레벨 테스트</h1>
        <div />
      </header>
      <AssessmentQuiz />
    </div>
  )
}
