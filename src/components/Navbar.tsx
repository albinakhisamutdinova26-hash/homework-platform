'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isTeacher = session?.user?.role === 'TEACHER'

  const teacherLinks = [
    { href: '/teacher/dashboard', label: 'Задания' },
    { href: '/teacher/assignments/new', label: 'Создать задание' },
    { href: '/teacher/students', label: 'Студенты' },
  ]

  const studentLinks = [
    { href: '/student/dashboard', label: 'Мои задания' },
    { href: '/student/profile', label: 'Профиль' },
  ]

  const links = isTeacher ? teacherLinks : studentLinks
  const firstName = session?.user?.name?.split(' ')[0] || ''
  const lastName = session?.user?.name?.split(' ')[1]?.[0] || ''
  const initials = session?.user?.name?.[0] || '?'

  return (
    <nav
      className="h-[66px] flex items-center justify-between px-[30px]"
      style={{
        background: 'linear-gradient(120deg,#6D3BEB 0%,#8B5CF6 60%,#A472F0 100%)',
        boxShadow: '0 8px 26px rgba(109,59,235,.20)',
      }}
    >
      {/* Left: logo + links */}
      <div className="flex items-center gap-[34px]">
        <Link
          href={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
          className="flex items-center gap-[11px]"
        >
          <div
            className="w-[38px] h-[38px] rounded-[13px] flex items-center justify-center font-display font-extrabold text-[17px] text-white"
            style={{ background: 'rgba(255,255,255,.18)' }}
          >
            Aa
          </div>
          <span className="font-display font-bold text-[19px] text-white tracking-[.01em]">
            English&nbsp;Class
          </span>
        </Link>

        <div className="flex gap-[6px]">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-[16px] py-[8px] rounded-[11px] font-sans text-[14px] transition"
                style={
                  isActive
                    ? { background: 'rgba(255,255,255,.22)', color: '#fff', fontWeight: 700 }
                    : { color: '#E4D8FB', fontWeight: 600 }
                }
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-[12px]">
        {!isTeacher && (
          <div
            className="flex items-center gap-[7px] px-[12px] py-[6px] rounded-full"
            style={{ background: 'rgba(255,255,255,.16)' }}
          >
            <span className="text-[15px]">🔥</span>
            <span className="font-sans font-extrabold text-[13px] text-white">7 дней</span>
          </div>
        )}

        <div className="text-right leading-[1.15]">
          <div className="font-sans font-extrabold text-[14px] text-white">
            {firstName}{lastName ? ` ${lastName}.` : ''}
          </div>
          <div className="font-sans font-semibold text-[12px] text-[#D8C9F8]">
            {isTeacher ? 'Преподаватель' : 'Студент'}
          </div>
        </div>

        {!isTeacher ? (
          <Link href="/student/profile">
            <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-sans font-extrabold text-[16px] cursor-pointer"
              style={{ background: '#FFD9E6', color: '#C2477E' }}>
              {initials}
            </div>
          </Link>
        ) : (
          <div
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-sans font-extrabold text-[16px] text-white"
            style={{ background: 'rgba(255,255,255,.20)' }}
          >
            {initials}
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-[6px] px-[12px] py-[7px] rounded-[10px] font-sans text-[13px] font-semibold text-white transition"
          style={{ background: 'rgba(255,255,255,.12)' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.22)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Выйти
        </button>
      </div>
    </nav>
  )
}
