import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

function isDeadlinePassed(deadline: Date) {
  return new Date(deadline) < new Date()
}

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: session!.user.id },
    include: {
      _count: {
        select: { submissions: true, assignedStudents: true },
      },
      submissions: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои задания</h1>
          <p className="text-gray-500 mt-1">Управление учебными заданиями</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать задание
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-purple-600">{assignments.length}</div>
          <div className="text-gray-500 text-sm mt-1">Всего заданий</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-purple-600">
            {assignments.reduce((sum, a) => sum + a._count.assignedStudents, 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">Назначено</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-3xl font-bold text-purple-600">
            {assignments.reduce((sum, a) => sum + a._count.submissions, 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">Сдано работ</div>
        </div>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Заданий пока нет</h3>
          <p className="text-gray-500 mb-6">Создайте первое задание для студентов</p>
          <Link
            href="/teacher/assignments/new"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            Создать задание
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-purple-900">Название</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-purple-900">Тип</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-purple-900">Дедлайн</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-purple-900">Сдано</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-purple-900">Проверено</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment) => {
                const gradedCount = assignment.submissions.filter(s => s.status === 'GRADED').length
                const submittedCount = assignment._count.submissions
                const assignedCount = assignment._count.assignedStudents
                const passed = isDeadlinePassed(assignment.deadline)

                return (
                  <tr key={assignment.id} className="hover:bg-purple-50/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{assignment.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.type === 'TEST'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {assignment.type === 'TEST' ? 'Тест' : 'Текст'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${passed ? 'text-red-500' : 'text-gray-600'}`}>
                        {formatDate(assignment.deadline)}
                        {passed && <span className="ml-1 text-xs">(истёк)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full"
                            style={{ width: `${assignedCount > 0 ? (submittedCount / assignedCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{submittedCount}/{assignedCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{gradedCount}/{submittedCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/teacher/assignments/${assignment.id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Просмотр →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
