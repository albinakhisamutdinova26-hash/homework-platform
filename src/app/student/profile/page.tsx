'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import MotivationalCat from '@/components/MotivationalCat'

interface Profile {
  id: string
  name: string
  phone: string
  avatar: string | null
  goal: string | null
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setGoal(data?.goal || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error()
      const { url } = await uploadRes.json()

      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      })
      if (!profileRes.ok) throw new Error()
      const updated = await profileRes.json()
      setProfile(updated)
    } catch {
      setError('Ошибка загрузки фото. Попробуйте снова.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSaveGoal = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Ошибка сохранения. Попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#6D3BEB' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="font-sans text-[#928AAC]">Не удалось загрузить профиль</p>
      </div>
    )
  }

  const initials = profile.name[0] || '?'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '30px 28px 70px' }}>

      {/* Page header */}
      <div className="flex items-center gap-[14px] mb-[24px]">
        <Link
          href="/student/dashboard"
          className="w-[42px] h-[42px] rounded-[13px] bg-white flex items-center justify-center text-[18px] text-[#6D3BEB] flex-shrink-0"
          style={{ border: '1px solid #EFEAFB', boxShadow: '0 4px 14px rgba(89,54,177,.06)' }}
        >
          ←
        </Link>
        <div>
          <h1 className="font-display font-bold text-[26px] text-[#2E2350]">Мой профиль ✨</h1>
          <p className="font-sans font-semibold text-[14px] text-[#867DA0] mt-[3px]">Настрой аккаунт и свою цель</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-[14px] font-sans text-[14px] text-[#D14343]" style={{ background: '#FCEAEA', border: '1px solid #F5C0C0' }}>
          {error}
        </div>
      )}

      {/* Avatar card */}
      <div
        className="bg-white rounded-[24px] flex items-center gap-[22px] mb-[18px]"
        style={{ border: '1px solid #EFEAFB', padding: 24, boxShadow: '0 8px 26px rgba(89,54,177,.06)' }}
      >
        <div className="relative flex-shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-[92px] h-[92px] rounded-full object-cover"
              style={{ border: '4px solid #FCE3EC' }}
            />
          ) : (
            <div
              className="w-[92px] h-[92px] rounded-full flex items-center justify-center font-display font-extrabold text-[38px]"
              style={{ background: '#FFD9E6', color: '#C2477E', border: '4px solid #FCE3EC' }}
            >
              {initials}
            </div>
          )}
          {avatarUploading ? (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-[2px] -right-[2px] w-[30px] h-[30px] rounded-full flex items-center justify-center text-[14px]"
              style={{ background: '#6D3BEB', border: '3px solid #fff' }}
              title="Изменить фото"
            >
              📷
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleAvatarUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-sans font-extrabold text-[21px] text-[#241B3A]">{profile.name}</h3>
          <p className="font-sans font-semibold text-[13.5px] text-[#928AAC] mt-[3px]">{profile.phone}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-[12px] font-sans font-bold text-[13px] text-[#6D3BEB] rounded-[11px] px-[16px] py-[8px]"
            style={{ border: '1.5px solid #DCCFF7', background: '#fff' }}
          >
            Изменить фото
          </button>
        </div>

        <div className="text-center rounded-[16px] flex-shrink-0" style={{ background: '#F6F1FE', padding: '14px 20px' }}>
          <div className="font-display font-extrabold text-[24px] text-[#6D3BEB] leading-none">Lv 4</div>
          <div className="font-sans font-bold text-[11px] text-[#9A82D9] mt-[2px]">Intermediate</div>
        </div>
      </div>

      {/* Goal card */}
      <div
        className="bg-white rounded-[24px] mb-[18px]"
        style={{ border: '1px solid #EFEAFB', padding: 24, boxShadow: '0 8px 26px rgba(89,54,177,.06)' }}
      >
        <div className="flex items-center gap-[12px] mb-[16px]">
          <div className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center text-[20px] flex-shrink-0" style={{ background: '#FCEAF1' }}>
            🎯
          </div>
          <div>
            <h2 className="font-display font-bold text-[17px] text-[#2E2350]">Моя цель</h2>
            <p className="font-sans font-semibold text-[12.5px] text-[#928AAC] mt-[2px]">
              Барсик напомнит о ней после каждого выполненного задания
            </p>
          </div>
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Например: «Сдать IELTS на 7.5 к декабрю»..."
          rows={3}
          maxLength={200}
          className="w-full font-sans font-semibold text-[15px] text-[#241B3A] rounded-[14px] outline-none resize-none transition"
          style={{ border: '1.5px solid #6D3BEB', background: '#FBFAFE', padding: '14px 16px' }}
        />

        <div className="flex items-center justify-between mt-[12px]">
          <span className="font-sans font-semibold text-[12px] text-[#B3AAC8]">{goal.length} / 200</span>
          <button
            onClick={handleSaveGoal}
            disabled={saving}
            className="inline-flex items-center gap-[7px] font-sans font-extrabold text-[14px] text-white rounded-[12px] px-[18px] py-[10px] transition disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', boxShadow: '0 8px 18px rgba(109,59,235,.26)' }}
          >
            {saved ? '✓ Сохранено!' : saving ? 'Сохранение...' : '💾 Сохранить цель'}
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div
        className="bg-white rounded-[24px] mb-[18px]"
        style={{ border: '1px solid #EFEAFB', padding: 24, boxShadow: '0 8px 26px rgba(89,54,177,.06)' }}
      >
        <h2 className="font-display font-bold text-[17px] text-[#2E2350] mb-[16px]">Достижения 🏆</h2>
        <div className="grid grid-cols-4 gap-[12px]">
          {[
            { emoji: '🔥', value: '7 дней', label: 'подряд',   bg: '#FBF1DF', valueColor: '#B5791B', labelColor: '#C49A4E' },
            { emoji: '📚', value: '12',      label: 'заданий',  bg: '#EEE8FE', valueColor: '#6D3BEB', labelColor: '#9A82D9' },
            { emoji: '⭐', value: '90',      label: 'ср. балл', bg: '#E3F7EE', valueColor: '#1F9D63', labelColor: '#4FB587' },
            { emoji: '🎧', value: '5',       label: 'аудио',    bg: '#EAF0FF', valueColor: '#3E63DD', labelColor: '#7491E3' },
          ].map(({ emoji, value, label, bg, valueColor, labelColor }) => (
            <div key={label} className="text-center rounded-[16px] py-[16px] px-[8px]" style={{ background: bg }}>
              <div className="text-[28px]">{emoji}</div>
              <div className="font-display font-extrabold text-[16px] mt-[4px]" style={{ color: valueColor }}>{value}</div>
              <div className="font-sans font-bold text-[10.5px] mt-[1px]" style={{ color: labelColor }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barsik helper card */}
      <div
        className="relative overflow-hidden rounded-[24px] flex items-center gap-[18px]"
        style={{ background: 'linear-gradient(130deg,#ECE4FF 0%,#FCE8F1 100%)', padding: 22, boxShadow: '0 8px 26px rgba(109,59,235,.08)' }}
      >
        <MotivationalCat size={108} celebrating={!!saved} />
        <div>
          <div className="font-display font-bold text-[15px] text-[#3A2A63] mb-[5px]">Барсик — твой помощник 🐱</div>
          <p className="font-sans font-bold text-[14.5px] text-[#2E2350] leading-[1.5]">
            {profile.goal
              ? <>Цель сохранена! 🎉 Я буду напоминать о ней после каждого задания: <b className="text-[#6D3BEB]">«{profile.goal.slice(0, 50)}{profile.goal.length > 50 ? '...' : ''}»</b>. Вперёд к мечте! 💜</>
              : 'Установи цель выше, и я буду мотивировать тебя после каждого задания! 🌟'}
          </p>
        </div>
      </div>
    </div>
  )
}
