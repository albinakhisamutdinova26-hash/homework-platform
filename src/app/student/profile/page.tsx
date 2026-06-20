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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Не удалось загрузить профиль</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/student/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мой профиль</h1>
          <p className="text-gray-500 mt-0.5">Настрой свой аккаунт и цель</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* Avatar & Name */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Фото профиля</h2>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-purple-200">
                <span className="text-purple-600 font-bold text-3xl">{profile.name[0]}</span>
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{profile.phone}</p>
            <div className="mt-3">
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {avatarUploading ? 'Загрузка...' : 'Изменить фото'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🎯
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Моя цель</h2>
            <p className="text-sm text-gray-500">Котик напомнит о ней после каждого выполненного задания</p>
          </div>
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Например: «Сдать экзамен на 5» или «Стать разработчиком к лету»..."
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{goal.length}/200</span>
          <button
            onClick={handleSaveGoal}
            disabled={saving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Сохранено!
              </>
            ) : saving ? 'Сохранение...' : 'Сохранить цель'}
          </button>
        </div>
      </div>

      {/* Cat preview */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">Твой помощник-котик</p>
        <div className="flex justify-center">
          <MotivationalCat size={100} />
        </div>
        <p className="text-gray-600 text-sm mt-4">
          {profile.goal
            ? `Цель установлена! Котик будет напоминать: «${profile.goal.slice(0, 40)}${profile.goal.length > 40 ? '...' : ''}»`
            : 'Установи цель выше, и я буду мотивировать тебя после каждого задания!'}
        </p>
      </div>
    </div>
  )
}
