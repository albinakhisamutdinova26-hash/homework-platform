import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

const TYPE_LABELS: Record<string, string> = { TEXT: 'Текст', TEST: 'Тест', VOICE: 'Голос' }
const TYPE_COLORS: Record<string, string> = {
  TEXT: 'bg-green-100 text-green-700',
  TEST: 'bg-blue-100 text-blue-700',
  VOICE: 'bg-orange-100 text-orange-700',
}

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id, teacherId: session!.user.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { orderIndex: 'asc' },
      },
      media: { orderBy: { orderIndex: 'asc' } },
      submissions: {
        include: {
          student: { select: { id: true, name: true } },
        },
        orderBy: { submittedAt: 'desc' },
      },
      assignedStudents: {
        include: {
          student: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!assignment) notFound()

  const deadlinePassed = new Date(assignment.deadline) < new Date()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/teacher/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition mt-1">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              {assignment.description && <p className="text-gray-500 mt-1">{assignment.description}</p>}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${TYPE_COLORS[assignment.type] || 'bg-gray-100 text-gray-700'}`}>
              {TYPE_LABELS[assignment.type] || assignment.type}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={deadlinePassed ? 'text-red-500' : ''}>
                Дедлайн: {formatDate(assignment.deadline)}{deadlinePassed && ' (истёк)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-purple-600">{assignment.assignedStudents.length}</div>
          <div className="text-gray-500 text-sm mt-1">Назначено</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-blue-600">{assignment.submissions.length}</div>
          <div className="text-gray-500 text-sm mt-1">Сдали</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-green-600">
            {assignment.submissions.filter(s => s.status === 'GRADED').length}
          </div>
          <div className="text-gray-500 text-sm mt-1">Проверено</div>
        </div>
      </div>

      {/* Media */}
      {assignment.media.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Медиаматериалы</h2>
          <div className="space-y-4">
            {assignment.media.map((item) => {
              if (item.type === 'IMAGE') {
                return (
                  <div key={item.id}>
                    {item.title && <p className="text-sm font-medium text-gray-700 mb-2">{item.title}</p>}
                    <img src={item.url} alt={item.title || 'Изображение'} className="rounded-lg max-h-64 object-contain border border-gray-200" />
                  </div>
                )
              }
              if (item.type === 'VIDEO') {
                const embedUrl = getVideoEmbedUrl(item.url)
                return (
                  <div key={item.id}>
                    {item.title && <p className="text-sm font-medium text-gray-700 mb-2">{item.title}</p>}
                    {embedUrl ? (
                      <iframe src={embedUrl} className="w-full rounded-lg border border-gray-200" style={{ aspectRatio: '16/9' }} allowFullScreen />
                    ) : (
                      <video src={item.url} controls className="w-full rounded-lg border border-gray-200" />
                    )}
                  </div>
                )
              }
              return (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-blue-700 font-medium text-sm">{item.title || item.url}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Questions (TEST type) */}
      {assignment.type === 'TEST' && assignment.questions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Вопросы теста ({assignment.questions.length})</h2>
          <div className="space-y-3">
            {assignment.questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-gray-800 text-sm">{q.text}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{q.options.length} вариантов ответа</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Список сдавших</h2>
          <span className="text-sm text-gray-500">
            {assignment.submissions.length} сдали из {assignment.assignedStudents.length} назначенных
          </span>
        </div>

        {assignment.submissions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Пока никто не сдал задание</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Студент</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Время сдачи</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Оценка</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignment.submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                        {submission.student.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{submission.student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(submission.submittedAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {submission.status === 'GRADED' ? 'Проверено' : 'Сдано'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {submission.grade !== null ? (
                      <span className="font-semibold text-gray-900">{submission.grade}/100</span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/teacher/assignments/${assignment.id}/grade/${submission.id}`}
                      className={`text-sm font-medium ${submission.status === 'GRADED' ? 'text-gray-500 hover:text-gray-700' : 'text-purple-600 hover:text-purple-800'}`}
                    >
                      {submission.status === 'GRADED' ? 'Просмотр' : 'Проверить'} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
