import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MotivationalCat from '@/components/MotivationalCat'

function getDeadlineStatus(deadline: Date) {
  const now = new Date()
  const diffMs = new Date(deadline).getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffMs < 0) return 'passed'
  if (diffHours <= 24) return 'soon'
  return 'ok'
}

function formatDeadline(date: Date, status: string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (status === 'passed') {
    return `Истёк ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  }
  if (diffHours <= 24) {
    return `Сегодня, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Завтра, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  TEXT:  { icon: '✏️', label: 'Письмо',       bg: '#FCEAF1', color: '#C2477E' },
  TEST:  { icon: '📝', label: 'Тест',          bg: '#F1ECFE', color: '#6D3BEB' },
  VOICE: { icon: '🎤', label: 'Говорение',     bg: '#FCEAF1', color: '#C2477E' },
  AUDIO: { icon: '🎧', label: 'Аудирование',   bg: '#EAF0FF', color: '#3E63DD' },
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  const [assignedLinks, submissions, user] = await Promise.all([
    prisma.assignmentStudent.findMany({
      where: { studentId: session!.user.id },
      include: { assignment: true },
      orderBy: { assignment: { deadline: 'asc' } },
    }),
    prisma.submission.findMany({
      where: { studentId: session!.user.id },
      select: { assignmentId: true, status: true, grade: true },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { name: true, avatar: true, goal: true },
    }),
  ])

  const assignments = assignedLinks.map(l => l.assignment)
  const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]))

  const now = new Date()
  const pendingCount = assignments.filter(
    a => !submissionMap.has(a.id) && new Date(a.deadline) > now
  ).length
  const awaitingCount = submissions.filter(s => s.status === 'SUBMITTED').length
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length
  const totalCount = assignments.length

  const progressPct = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0

  const urgentAssignment = assignments.find(a => {
    const diffMs = new Date(a.deadline).getTime() - now.getTime()
    return diffMs > 0 && diffMs <= 24 * 3600 * 1000 && !submissionMap.has(a.id)
  })
  const isReminder = !!urgentAssignment

  const firstName = user?.name?.split(' ')[0] || 'студент'

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '30px 28px 70px' }}>

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[28px] mb-[22px] flex items-center gap-[26px]"
        style={{
          background: 'linear-gradient(130deg,#ECE4FF 0%,#F4ECFA 52%,#FCE8F1 100%)',
          padding: '26px 30px',
          boxShadow: '0 14px 40px rgba(109,59,235,.10)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute rounded-full animate-drift"
          style={{ width: 200, height: 200, background: 'rgba(164,114,240,.16)', top: -70, right: 120, filter: 'blur(6px)' }}
        />
        <div
          className="absolute rounded-full animate-drift-slow"
          style={{ width: 130, height: 130, background: 'rgba(255,143,177,.18)', bottom: -50, right: -20, filter: 'blur(6px)' }}
        />

        {/* Cat */}
        <div className="relative flex-shrink-0 animate-floaty" style={{ width: 204, height: 204 }}>
          <div
            className="absolute rounded-full"
            style={{ bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 128, height: 22, background: 'rgba(109,59,235,.20)', filter: 'blur(9px)' }}
          />
          <MotivationalCat size={204} celebrating={!isReminder} />
          {/* Barsik name badge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 font-display font-bold text-[12px] text-[#6D3BEB] whitespace-nowrap z-10"
            style={{ bottom: 0, background: '#fff', border: '1px solid #EADCF7', borderRadius: 999, padding: '3px 13px', boxShadow: '0 4px 12px rgba(109,59,235,.16)' }}
          >
            Барсик 🐾
          </div>
          {/* Reminder clock badge */}
          {isReminder && (
            <div
              className="absolute -bottom-2 -right-2 w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center text-[25px] animate-popin"
              style={{ boxShadow: '0 8px 20px rgba(232,155,45,.28)' }}
            >
              ⏰
            </div>
          )}
        </div>

        {/* Message */}
        <div className="relative z-[1] flex-1">
          <div className="font-display font-bold text-[22px] text-[#3A2A63] mb-[10px]">
            Привет, {firstName}! <span className="font-sans">🎀</span>
          </div>
          <div
            className="relative inline-block bg-white rounded-[8px_18px_18px_18px]"
            style={{ padding: '15px 19px', boxShadow: '0 6px 20px rgba(89,54,177,.10)', maxWidth: 480 }}
          >
            {/* speech bubble tail */}
            <div className="absolute bg-white rounded-[3px]" style={{ left: -7, top: 14, width: 16, height: 16, transform: 'rotate(45deg)' }} />
            <div className="font-sans font-bold text-[15.5px] text-[#2E2350] leading-[1.5]">
              {isReminder ? (
                <>Не забудь! ⏰ Дедлайн по <b className="text-[#6D3BEB]">«{urgentAssignment!.title}»</b> уже сегодня в {new Date(urgentAssignment!.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}. Давай сделаем — я в тебя верю! 💪</>
              ) : (
                <>Мур-р, какая ты молодец! 🎉 Уже <b className="text-[#6D3BEB]">{gradedCount} заданий</b> сдано — твой английский с каждым днём всё увереннее. Так держать! 💜</>
              )}
            </div>
          </div>

          <div className="flex items-center gap-[9px] mt-[14px] flex-wrap">
            <span
              className="inline-flex items-center gap-[7px] font-sans font-bold text-[13px] text-[#6D3BEB]"
              style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #E7DCFA', borderRadius: 999, padding: '6px 14px' }}
            >
              🎯 Моя цель: {user?.goal || 'не задана'}
            </span>
            <Link
              href="/student/profile"
              className="inline-flex items-center gap-[5px] font-sans font-bold text-[12px] text-[#9A82D9]"
              style={{ background: '#fff', border: '1px solid #E7DCFA', borderRadius: 999, padding: '6px 12px' }}
            >
              ✏️ изменить
            </Link>
          </div>
        </div>

        {/* Progress ring */}
        <div
          className="relative z-[1] flex-shrink-0 text-center rounded-[22px] bg-white"
          style={{ padding: '18px 22px', boxShadow: '0 8px 24px rgba(89,54,177,.10)' }}
        >
          <div
            className="w-[96px] h-[96px] rounded-full flex items-center justify-center mx-auto"
            style={{ background: `conic-gradient(#6D3BEB 0% ${progressPct}%,#EDE6FB ${progressPct}% 100%)` }}
          >
            <div className="w-[74px] h-[74px] rounded-full bg-white flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-[22px] text-[#6D3BEB] leading-none">{progressPct}%</span>
              <span className="font-sans font-bold text-[10px] text-[#9A90B5]">прогресс</span>
            </div>
          </div>
          <div className="font-sans font-bold text-[12.5px] text-[#7A7193] mt-[10px]">за этот месяц</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[16px] mb-[26px]">
        {[
          { icon: '📭', count: pendingCount,   label: 'Не сдано',          bg: '#FBF1DF' },
          { icon: '⏳', count: awaitingCount,  label: 'Ожидает проверки',  bg: '#EEE8FE' },
          { icon: '✅', count: gradedCount,    label: 'Проверено',          bg: '#E3F7EE' },
        ].map(({ icon, count, label, bg }) => (
          <div
            key={label}
            className="bg-white rounded-[20px] flex items-center gap-[14px]"
            style={{ border: '1px solid #EFEAFB', padding: '18px 20px', boxShadow: '0 6px 20px rgba(89,54,177,.05)' }}
          >
            <div className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0" style={{ background: bg }}>
              {icon}
            </div>
            <div>
              <div className="font-display font-extrabold text-[26px] text-[#241B3A] leading-none">{count}</div>
              <div className="font-sans font-semibold text-[13px] text-[#867DA0]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Assignments header */}
      <div className="flex items-center justify-between mb-[16px]">
        <h2 className="font-display font-bold text-[21px] text-[#2E2350]">Мои задания</h2>
      </div>

      {/* Assignment cards */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-[22px] text-center py-16" style={{ border: '1px solid #EFEAFB' }}>
          <p className="font-sans text-[#928AAC]">Заданий пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[18px]">
          {assignments.map((assignment) => {
            const submission = submissionMap.get(assignment.id)
            const deadlineStatus = getDeadlineStatus(assignment.deadline)
            const isOverdue = deadlineStatus === 'passed'
            const typeConf = TYPE_CONFIG[assignment.type] || TYPE_CONFIG.TEXT

            const statusChip = submission
              ? submission.status === 'GRADED'
                ? { label: `${submission.grade} / 100`, bg: '#E3F7EE', color: '#1F9D63' }
                : { label: 'Сдано', bg: '#EAF0FF', color: '#3E63DD' }
              : isOverdue
              ? { label: 'Срок истёк', bg: '#FCEAEA', color: '#D14343' }
              : { label: 'Не сдано', bg: '#FBF1DF', color: '#B5791B' }

            const deadlineColor = deadlineStatus === 'passed'
              ? '#D14343'
              : deadlineStatus === 'soon'
              ? '#D14343'
              : '#928AAC'

            const deadlineIcon = deadlineStatus === 'passed' ? '⛔' : deadlineStatus === 'soon' ? '⏰' : '📅'

            const cardBg = isOverdue ? '#FAF9FD' : '#fff'
            const cardOpacity = isOverdue ? 0.75 : 1

            return (
              <div
                key={assignment.id}
                className="rounded-[22px] flex flex-col"
                style={{
                  background: cardBg,
                  border: '1px solid #EFEAFB',
                  padding: 20,
                  boxShadow: '0 6px 22px rgba(89,54,177,.06)',
                  opacity: cardOpacity,
                }}
              >
                {/* Type chip + status */}
                <div className="flex items-center justify-between mb-[14px]">
                  <span
                    className="inline-flex items-center gap-[7px] font-sans font-bold text-[12px] rounded-[10px]"
                    style={{ background: typeConf.bg, color: typeConf.color, padding: '6px 11px' }}
                  >
                    {typeConf.icon} {typeConf.label}
                  </span>
                  <span
                    className="font-sans font-extrabold text-[11px] rounded-full"
                    style={{ background: statusChip.bg, color: statusChip.color, padding: '4px 11px' }}
                  >
                    {statusChip.label}
                  </span>
                </div>

                <h3 className="font-sans font-bold text-[16.5px] text-[#241B3A] mb-[7px] line-clamp-2">
                  {assignment.title}
                </h3>

                {assignment.description && (
                  <p className="font-sans font-semibold text-[13px] text-[#928AAC] mb-[16px] line-clamp-2 leading-[1.45]">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center gap-[7px] mt-auto mb-[14px]">
                  <span className="text-[14px]">{deadlineIcon}</span>
                  <span className="font-sans font-bold text-[12.5px]" style={{ color: deadlineColor }}>
                    {formatDeadline(assignment.deadline, deadlineStatus)}
                  </span>
                </div>

                <Link
                  href={isOverdue && !submission ? '#' : `/student/assignments/${assignment.id}`}
                  className="w-full text-center font-sans font-extrabold text-[14px] rounded-[13px] py-[11px] transition"
                  style={
                    submission
                      ? { background: '#F1ECFE', color: '#6D3BEB' }
                      : isOverdue
                      ? { background: '#EFEFF2', color: '#A59EB8', cursor: 'not-allowed', pointerEvents: 'none' }
                      : {
                          background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)',
                          color: '#fff',
                          boxShadow: '0 8px 18px rgba(109,59,235,.26)',
                        }
                  }
                  onClick={isOverdue && !submission ? (e) => e.preventDefault() : undefined}
                >
                  {submission ? 'Просмотреть' : isOverdue ? 'Срок сдачи истёк' : 'Выполнить →'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
