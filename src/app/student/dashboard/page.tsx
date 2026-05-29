import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function getDeadlineStatus(deadline: Date) {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) return 'passed'
  if (diffHours <= 24) return 'soon'
  return 'ok'
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  const [assignedLinks, submissions] = await Promise.all([
    prisma.assignmentStudent.findMany({
      where: { studentId: session!.user.id },
      include: {
        assignment: true,
      },
      orderBy: {
        assignment: { deadline: 'asc' },
      },
    }),
    prisma.submission.findMany({
      where: { studentId: session!.user.id },
      select: {
        assignmentId: true,
        status: true,
        grade: true,
      },
    }),
  ])

  const assignments = assignedLinks.map(l => l.assignment)
  const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]))

  const pendingCount = assignments.filter(
    a => !submissionMap.has(a.id) && new Date(a.deadline) > new Date()
  ).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Мои задания</h1>
        <p className="text-gray-500 mt-1">Учебные задания от преподавателя</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-gray-500 text-sm mt-0.5">Не сдано</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {submissions.filter(s => s.status === 'SUBMITTED').length}
          </div>
          <div className="text-gray-500 text-sm mt-0.5">Ожидает проверки</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-green-600">
            {submissions.filter(s => s.status === 'GRADED').length}
          </div>
          <div className="text-gray-500 text-sm mt-0.5">Проверено</div>
        </div>
      </div>

      {/* Assignment Cards */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <p className="text-gray-500">Заданий пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const submission = submissionMap.get(assignment.id)
            const deadlineStatus = getDeadlineStatus(assignment.deadline)
            const isOverdue = deadlineStatus === 'passed'

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    assignment.type === 'TEST'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {assignment.type === 'TEST' ? 'Тест' : 'Текст'}
                  </span>

                  {submission ? (
                    submission.status === 'GRADED' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Оценка: {submission.grade}/100
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Сдано
                      </span>
                    )
                  ) : isOverdue ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      Срок истёк
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Не сдано
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{assignment.title}</h3>

                {assignment.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                )}

                <div className="flex items-center gap-1.5 mt-auto mb-4">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: deadlineStatus === 'passed' ? '#ef4444' : deadlineStatus === 'soon' ? '#eab308' : '#9ca3af' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-xs ${
                    deadlineStatus === 'passed' ? 'text-red-500' :
                    deadlineStatus === 'soon' ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {isOverdue ? 'Истёк: ' : 'До: '}{formatDate(assignment.deadline)}
                  </span>
                </div>

                <Link
                  href={`/student/assignments/${assignment.id}`}
                  className={`w-full text-center py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                    submission
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : isOverdue
                      ? 'bg-gray-100 text-gray-400 cursor-default pointer-events-none'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {submission ? 'Просмотреть' : isOverdue ? 'Срок сдачи истёк' : 'Выполнить'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
