'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  phone: string
  createdAt: string
}

function scoreChip(score: number | null) {
  if (score === null) return { bg: '#F4F2F9', color: '#928AAC' }
  if (score >= 85) return { bg: '#E3F7EE', color: '#1F9D63' }
  if (score >= 70) return { bg: '#FBF1DF', color: '#B5791B' }
  return { bg: '#FCEAEA', color: '#D14343' }
}

const AVATAR_COLORS = [
  { bg: '#FFD9E6', color: '#C2477E' },
  { bg: '#D8E4FF', color: '#3E63DD' },
  { bg: '#D6F0E2', color: '#1F9D63' },
  { bg: '#E7DBFB', color: '#7C4DD6' },
  { bg: '#FFE0C2', color: '#C77B3E' },
  { bg: '#FCE3D2', color: '#C77B3E' },
]

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { loadStudents() }, [])

  async function loadStudents() {
    const res = await fetch('/api/students')
    const data = await res.json()
    setStudents(data)
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка при добавлении студента')
        return
      }
      setStudents(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
      setName('')
      setPhone('')
      setPassword('')
      setShowForm(false)
    } catch {
      setError('Не удалось соединиться с сервером. Попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, studentName: string) {
    if (!confirm(`Удалить студента "${studentName}"? Все его задания и ответы тоже удалятся.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Не удалось удалить студента')
        return
      }
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Не удалось соединиться с сервером. Попробуйте снова.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '30px 28px 70px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="font-display font-bold text-[26px] text-[#2E2350]">Студенты 👭</h1>
          <p className="font-sans font-semibold text-[14px] text-[#867DA0] mt-[3px]">{students.length} студентов</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="inline-flex items-center gap-[8px] font-sans font-extrabold text-[14.5px] text-white rounded-[14px] px-[20px] py-[12px] transition"
          style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', boxShadow: '0 10px 22px rgba(109,59,235,.28)', border: 'none', cursor: 'pointer' }}
        >
          ＋ Добавить студента
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div
          className="bg-white rounded-[24px] mb-[18px]"
          style={{ border: '1px solid #EFEAFB', padding: 24, boxShadow: '0 8px 26px rgba(89,54,177,.06)' }}
        >
          <h2 className="font-display font-bold text-[17px] text-[#2E2350] mb-[16px]">Новый студент</h2>
          {error && (
            <div className="mb-4 p-3 rounded-[12px] font-sans text-[13px] text-[#D14343]" style={{ background: '#FCEAEA' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-3 gap-[14px]">
            {[
              { label: 'Имя *', value: name, onChange: setName, placeholder: 'Иванова Анна' },
              { label: 'Телефон / логин *', value: phone, onChange: setPhone, placeholder: '79991234567' },
              { label: 'Пароль *', value: password, onChange: setPassword, placeholder: 'Минимум 6 символов' },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <label className="block font-sans font-bold text-[13px] text-[#5E5675] mb-[7px]">{label}</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full font-sans font-semibold text-[14px] text-[#241B3A] outline-none rounded-[13px] transition"
                  style={{ padding: '13px 15px', border: '1.5px solid #E6DFF6', background: '#FBFAFE' }}
                  onFocus={e => (e.target.style.borderColor = '#6D3BEB')}
                  onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
                />
              </div>
            ))}
            <div className="col-span-3 flex gap-3 justify-end pt-[4px]">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                className="font-sans font-bold text-[14px] text-[#7A7193] rounded-[13px] px-[20px] py-[11px] transition"
                style={{ border: '1.5px solid #E2DAF2', background: '#fff', cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="font-sans font-bold text-[14px] text-white rounded-[13px] px-[20px] py-[11px] transition disabled:opacity-60"
                style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', border: 'none', cursor: 'pointer' }}
              >
                {saving ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students table */}
      <div className="bg-white rounded-[22px] overflow-hidden" style={{ border: '1px solid #EFEAFB', boxShadow: '0 6px 22px rgba(89,54,177,.06)' }}>
        {loading ? (
          <div className="p-10 text-center font-sans text-[#928AAC]">Загрузка...</div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: '#F1ECFE' }}>
              👭
            </div>
            <p className="font-sans font-semibold text-[14px] text-[#928AAC] mb-2">Студентов пока нет</p>
            <p className="font-sans text-[13px] text-[#B3AAC8]">Нажмите «Добавить студента», чтобы создать первый аккаунт</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid gap-[14px] font-sans font-extrabold text-[12px] text-[#6D3BEB] uppercase tracking-[.04em]"
              style={{ gridTemplateColumns: '2.4fr 1.6fr 1.8fr 0.8fr 0.5fr', padding: '15px 24px', background: '#F6F1FE' }}
            >
              <span>Студент</span>
              <span>Телефон</span>
              <span>Прогресс</span>
              <span className="text-right">Балл</span>
              <span></span>
            </div>

            {students.map((student, idx) => {
              const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const scoreVal: number | null = null
              const chip = scoreChip(scoreVal)

              return (
                <div
                  key={student.id}
                  className="grid gap-[14px] items-center"
                  style={{
                    gridTemplateColumns: '2.4fr 1.6fr 1.8fr 0.8fr 0.5fr',
                    padding: '14px 24px',
                    borderTop: idx === 0 ? 'none' : '1px solid #F2EEFA',
                  }}
                >
                  <span className="flex items-center gap-[11px]">
                    <span
                      className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-sans font-extrabold text-[14px] flex-shrink-0"
                      style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                    >
                      {student.name[0]}
                    </span>
                    <span className="font-sans font-bold text-[14px] text-[#241B3A]">{student.name}</span>
                  </span>

                  <span className="font-sans font-semibold text-[13px] text-[#928AAC]">{student.phone}</span>

                  <span className="flex items-center gap-[8px]">
                    <span className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: '#EDE6FB' }}>
                      <span className="block h-full rounded-full" style={{ width: '50%', background: '#6D3BEB' }} />
                    </span>
                    <span className="font-sans font-bold text-[12px] text-[#867DA0] flex-shrink-0">–</span>
                  </span>

                  <span className="text-right">
                    <span
                      className="font-sans font-extrabold text-[12px] rounded-[8px] px-[9px] py-[4px]"
                      style={{ background: chip.bg, color: chip.color }}
                    >
                      –
                    </span>
                  </span>

                  <span className="text-right">
                    <button
                      onClick={() => handleDelete(student.id, student.name)}
                      disabled={deletingId === student.id}
                      className="p-[7px] rounded-[8px] transition disabled:opacity-50"
                      style={{ color: '#D14343', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#FCEAEA')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      title="Удалить студента"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      {students.length > 0 && (
        <p className="text-center font-sans font-semibold text-[13px] text-[#B3AAC8] mt-4">
          Студенты входят с указанным телефоном и паролем
        </p>
      )}
    </div>
  )
}
