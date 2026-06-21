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

function getDeadlineStatus(deadline: Date) {
  const now = new Date()
  const diff = new Date(deadline).getTime() - now.getTime()
  if (diff < 0) return 'passed'
  if (diff <= 24 * 3600 * 1000) return 'soon'
  return 'ok'
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  TEXT:  { icon: '✏️', label: 'Текст',       bg: '#FCEAF1', color: '#C2477E' },
  TEST:  { icon: '📝', label: 'Тест',         bg: '#F1ECFE', color: '#6D3BEB' },
  VOICE: { icon: '🎤', label: 'Голос',        bg: '#FCEAF1', color: '#C2477E' },
  AUDIO: { icon: '🎧', label: 'Аудио',        bg: '#EAF0FF', color: '#3E63DD' },
}

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: session!.user.id },
    include: {
      _count: { select: { submissions: true, assignedStudents: true } },
      submissions: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAssigned = assignments.reduce((sum, a) => sum + a._count.assignedStudents, 0)
  const totalSubmitted = assignments.reduce((sum, a) => sum + a._count.submissions, 0)

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '30px 28px 70px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="font-display font-bold text-[26px] text-[#2E2350]">Мои задания</h1>
          <p className="font-sans font-semibold text-[14px] text-[#867DA0] mt-[3px]">Управление учебными заданиями</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-[8px] font-sans font-extrabold text-[14.5px] text-white rounded-[14px] px-[20px] py-[12px] transition"
          style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', boxShadow: '0 10px 22px rgba(109,59,235,.28)' }}
        >
          ＋ Создать задание
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[16px] mb-[24px]">
        {[
          { value: assignments.length, label: 'Всего заданий' },
          { value: totalAssigned,      label: 'Назначено студентам' },
          { value: totalSubmitted,     label: 'Сдано работ' },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="bg-white rounded-[20px]"
            style={{ border: '1px solid #EFEAFB', padding: 20, boxShadow: '0 6px 20px rgba(89,54,177,.05)' }}
          >
            <div className="font-display font-extrabold text-[30px] text-[#6D3BEB] leading-none">{value}</div>
            <div className="font-sans font-semibold text-[13px] text-[#867DA0] mt-[4px]">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {assignments.length === 0 ? (
        <div
          className="bg-white rounded-[22px] text-center py-16"
          style={{ border: '1px solid #EFEAFB', boxShadow: '0 6px 22px rgba(89,54,177,.06)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F1ECFE' }}>
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="font-display font-bold text-[18px] text-[#2E2350] mb-[8px]">Заданий пока нет</h3>
          <p className="font-sans font-semibold text-[14px] text-[#928AAC] mb-6">Создайте первое задание для студентов</p>
          <Link
            href="/teacher/assignments/new"
            className="inline-flex items-center gap-2 font-sans font-bold text-[14px] text-white rounded-[12px] px-5 py-3"
            style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)' }}
          >
            ＋ Создать задание
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[22px] overflow-hidden" style={{ border: '1px solid #EFEAFB', boxShadow: '0 6px 22px rgba(89,54,177,.06)' }}>
          {/* Table header */}
          <div
            className="grid gap-[14px] font-sans font-extrabold text-[12px] text-[#6D3BEB] uppercase tracking-[.04em]"
            style={{ gridTemplateColumns: '2.6fr 1fr 1.4fr 1.4fr 0.9fr', padding: '15px 24px', background: '#F6F1FE' }}
          >
            <span>Название</span>
            <span>Тип</span>
            <span>Дедлайн</span>
            <span>Сдано</span>
            <span></span>
          </div>

          {assignments.map((assignment, idx) => {
            const submittedCount = assignment._count.submissions
            const assignedCount = assignment._count.assignedStudents
            const pct = assignedCount > 0 ? (submittedCount / assignedCount) * 100 : 0
            const dlStatus = getDeadlineStatus(assignment.deadline)
            const typeConf = TYPE_CONFIG[assignment.type] || TYPE_CONFIG.TEXT

            const dlColor = dlStatus === 'passed' ? '#928AAC' : dlStatus === 'soon' ? '#D14343' : '#928AAC'

            return (
              <div
                key={assignment.id}
                className="grid gap-[14px] items-center"
                style={{
                  gridTemplateColumns: '2.6fr 1fr 1.4fr 1.4fr 0.9fr',
                  padding: '16px 24px',
                  borderTop: idx === 0 ? 'none' : '1px solid #F2EEFA',
                }}
              >
                <span className="font-sans font-bold text-[14.5px] text-[#241B3A]">{assignment.title}</span>

                <span>
                  <span
                    className="inline-flex items-center gap-[5px] font-sans font-bold text-[11px] rounded-[8px]"
                    style={{ background: typeConf.bg, color: typeConf.color, padding: '4px 9px' }}
                  >
                    {typeConf.icon} {typeConf.label}
                  </span>
                </span>

                <span className="font-sans font-bold text-[12.5px]" style={{ color: dlColor }}>
                  {formatDate(assignment.deadline)}
                  {dlStatus === 'passed' && (
                    <span className="ml-1 font-sans text-[11px] text-[#C99]">(истёк)</span>
                  )}
                </span>

                <span className="flex items-center gap-[8px]">
                  <span className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: '#EDE6FB' }}>
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${pct}%`, background: '#6D3BEB' }}
                    />
                  </span>
                  <span className="font-sans font-bold text-[12px] text-[#867DA0] flex-shrink-0">
                    {submittedCount}/{assignedCount}
                  </span>
                </span>

                <span className="text-right">
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="font-sans font-bold text-[13px] text-[#6D3BEB] hover:underline"
                  >
                    Просмотр →
                  </Link>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
