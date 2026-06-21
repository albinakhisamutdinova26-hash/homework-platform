'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  phone: string
}

interface AnswerOption {
  text: string
  isCorrect: boolean
}

interface Question {
  text: string
  options: AnswerOption[]
}

interface MediaItem {
  type: 'VIDEO' | 'IMAGE' | 'LINK'
  url: string
  title: string
}

const MEDIA_ICONS: Record<string, string> = { VIDEO: '🎬', IMAGE: '🖼️', LINK: '🔗' }
const MEDIA_LABELS: Record<string, string> = { VIDEO: 'Видео', IMAGE: 'Фото', LINK: 'Ссылка' }

export default function NewAssignmentPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [type, setType] = useState<'TEST' | 'TEXT' | 'VOICE'>('TEXT')
  const [questions, setQuestions] = useState<Question[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [media, setMedia] = useState<MediaItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [mediaTab, setMediaTab] = useState<'LINK' | 'VIDEO' | 'IMAGE' | 'AUDIO'>('LINK')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaTitle, setMediaTitle] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(setStudents)
  }, [])

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedStudents(new Set(students.map(s => s.id)))
  const deselectAll = () => setSelectedStudents(new Set())

  const addQuestion = () => setQuestions([...questions, { text: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }])
  const removeQuestion = (qi: number) => setQuestions(questions.filter((_, i) => i !== qi))
  const updateQuestion = (qi: number, text: string) => { const u = [...questions]; u[qi] = { ...u[qi], text }; setQuestions(u) }
  const addOption = (qi: number) => { if (questions[qi].options.length >= 5) return; const u = [...questions]; u[qi].options = [...u[qi].options, { text: '', isCorrect: false }]; setQuestions(u) }
  const removeOption = (qi: number, oi: number) => { if (questions[qi].options.length <= 2) return; const u = [...questions]; u[qi].options = u[qi].options.filter((_, i) => i !== oi); if (!u[qi].options.some(o => o.isCorrect)) u[qi].options[0].isCorrect = true; setQuestions(u) }
  const updateOption = (qi: number, oi: number, text: string) => { const u = [...questions]; u[qi].options[oi] = { ...u[qi].options[oi], text }; setQuestions(u) }
  const setCorrectOption = (qi: number, oi: number) => { const u = [...questions]; u[qi].options = u[qi].options.map((opt, i) => ({ ...opt, isCorrect: i === oi })); setQuestions(u) }

  const handleImageUpload = async (file: File) => {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMedia(prev => [...prev, { type: 'IMAGE', url: data.url, title: file.name }])
    } catch {
      setError('Ошибка загрузки изображения')
    } finally {
      setImageUploading(false)
    }
  }

  const addMediaItem = () => {
    if (!mediaUrl.trim()) { setError('Введите URL'); return }
    const t = mediaTab === 'AUDIO' ? 'LINK' : mediaTab
    setMedia(prev => [...prev, { type: t as 'VIDEO' | 'IMAGE' | 'LINK', url: mediaUrl.trim(), title: mediaTitle.trim() }])
    setMediaUrl('')
    setMediaTitle('')
    setError('')
  }

  const removeMedia = (index: number) => setMedia(media.filter((_, i) => i !== index))

  const validate = () => {
    if (!title.trim()) return 'Введите название задания'
    if (!deadline) return 'Укажите дедлайн'
    if (new Date(deadline) <= new Date()) return 'Дедлайн должен быть в будущем'
    if (selectedStudents.size === 0) return 'Выберите хотя бы одного студента'
    if (type === 'TEST') {
      if (questions.length === 0) return 'Добавьте хотя бы один вопрос'
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim()) return `Введите текст вопроса ${i + 1}`
        for (let j = 0; j < questions[i].options.length; j++) {
          if (!questions[i].options[j].text.trim()) return `Введите текст варианта ${j + 1} для вопроса ${i + 1}`
        }
        if (!questions[i].options.some(o => o.isCorrect)) return `Отметьте правильный ответ для вопроса ${i + 1}`
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, deadline, type, questions, studentIds: Array.from(selectedStudents), media }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при создании задания')
        setLoading(false)
        return
      }
      router.push('/teacher/dashboard')
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
      setLoading(false)
    }
  }

  const inputStyle = { border: '1.5px solid #E6DFF6', background: '#FBFAFE', borderRadius: 13, padding: '13px 15px' }
  const inputFocusStyle = { borderColor: '#6D3BEB' }

  const cardStyle = {
    background: '#fff',
    borderRadius: 24,
    border: '1px solid #EFEAFB',
    padding: 26,
    marginBottom: 18,
    boxShadow: '0 8px 26px rgba(89,54,177,.06)',
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '30px 28px 70px' }}>

      {/* Page header */}
      <div className="flex items-center gap-[14px] mb-[24px]">
        <Link
          href="/teacher/dashboard"
          className="w-[42px] h-[42px] rounded-[13px] bg-white flex items-center justify-center text-[18px] text-[#6D3BEB] flex-shrink-0"
          style={{ border: '1px solid #EFEAFB', boxShadow: '0 4px 14px rgba(89,54,177,.06)' }}
        >
          ←
        </Link>
        <div>
          <h1 className="font-display font-bold text-[26px] text-[#2E2350]">Новое задание ✏️</h1>
          <p className="font-sans font-semibold text-[14px] text-[#867DA0] mt-[3px]">Создайте задание для своих студентов</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">
        {error && (
          <div className="mb-[18px] p-4 rounded-[14px] font-sans text-[14px] text-[#D14343]" style={{ background: '#FCEAEA' }}>
            {error}
          </div>
        )}

        {/* Basic info */}
        <div style={cardStyle}>
          <div className="flex items-center gap-[9px] mb-[20px]">
            <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: '#F1ECFE' }}>📋</span>
            <h2 className="font-display font-bold text-[17px] text-[#2E2350]">Основная информация</h2>
          </div>

          <label className="block font-sans font-bold text-[13px] text-[#5E5675] mb-[7px]">
            Название <span style={{ color: '#E0608A' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Введите название задания"
            className="w-full font-sans font-semibold text-[14.5px] text-[#241B3A] outline-none mb-[18px]"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
          />

          <label className="block font-sans font-bold text-[13px] text-[#5E5675] mb-[7px]">Описание</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Опишите задание подробнее..."
            rows={3}
            className="w-full font-sans font-semibold text-[14px] text-[#5E5675] outline-none resize-none mb-[18px]"
            style={{ ...inputStyle, lineHeight: 1.5 }}
            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
          />

          <label className="block font-sans font-bold text-[13px] text-[#5E5675] mb-[7px]">
            Дедлайн <span style={{ color: '#E0608A' }}>*</span>
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full font-sans font-semibold text-[14px] text-[#241B3A] outline-none mb-[20px]"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
          />

          <label className="block font-sans font-bold text-[13px] text-[#5E5675] mb-[9px]">
            Тип задания <span style={{ color: '#E0608A' }}>*</span>
          </label>
          <div className="grid grid-cols-4 gap-[11px]">
            {([
              { value: 'TEXT',  icon: '✏️', label: 'Текст',  desc: 'Свободный ответ' },
              { value: 'TEST',  icon: '📝', label: 'Тест',   desc: 'Варианты ответов' },
              { value: 'VOICE', icon: '🎤', label: 'Голос',  desc: 'Запись аудио' },
            ] as const).map(({ value, icon, label, desc }) => {
              const isActive = type === value
              return (
                <label
                  key={value}
                  className="relative flex flex-col cursor-pointer rounded-[15px] p-[14px_12px] transition"
                  style={{
                    border: `2px solid ${isActive ? '#6D3BEB' : '#E6DFF6'}`,
                    background: isActive ? '#F6F1FE' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={isActive}
                    onChange={() => { setType(value); if (value !== 'TEST') setQuestions([]) }}
                    className="sr-only"
                  />
                  {isActive && (
                    <div className="absolute top-[9px] right-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] text-white" style={{ background: '#6D3BEB' }}>
                      ✓
                    </div>
                  )}
                  <div className="text-[22px] mb-[6px]">{icon}</div>
                  <div className="font-sans font-bold text-[13px]" style={{ color: isActive ? '#6D3BEB' : '#241B3A' }}>{label}</div>
                  <div className="font-sans font-semibold text-[11px] mt-[2px] leading-[1.3]" style={{ color: isActive ? '#9B83D6' : '#A59EB8' }}>{desc}</div>
                </label>
              )
            })}
            {/* Placeholder 4th tile for visual balance */}
            <div
              className="flex flex-col rounded-[15px] p-[14px_12px] opacity-40"
              style={{ border: '2px solid #E6DFF6', background: '#fff' }}
            >
              <div className="text-[22px] mb-[6px]">🎧</div>
              <div className="font-sans font-bold text-[13px] text-[#241B3A]">Аудио</div>
              <div className="font-sans font-semibold text-[11px] text-[#A59EB8] mt-[2px] leading-[1.3]">Прослушать</div>
            </div>
          </div>
        </div>

        {/* Media */}
        <div style={cardStyle}>
          <div className="flex items-center gap-[9px] mb-[6px]">
            <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: '#FCEAF1' }}>🎬</span>
            <h2 className="font-display font-bold text-[17px] text-[#2E2350]">Медиаматериалы</h2>
          </div>
          <p className="font-sans font-semibold text-[13px] text-[#928AAC] mb-[16px] ml-[39px]">
            Добавьте аудио, видео, фото или ссылки к заданию
          </p>

          {/* Existing items */}
          {media.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-[12px] rounded-[14px] mb-[14px]"
              style={{ padding: '13px 15px', background: '#F6F1FE', border: '1px solid #EDE6FB' }}
            >
              <span className="text-[18px]">{MEDIA_ICONS[item.type]}</span>
              <div className="flex-1">
                <div className="font-sans font-bold text-[14px] text-[#241B3A]">{item.title || item.url}</div>
                <div className="font-sans font-semibold text-[12px] text-[#9B83D6]">{MEDIA_LABELS[item.type]}</div>
              </div>
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="w-[28px] h-[28px] rounded-[8px] bg-white flex items-center justify-center font-sans text-[14px] text-[#D14343] transition"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Tab buttons */}
          <div className="flex gap-[8px] border-t pt-[16px]" style={{ borderColor: '#F0ECF8' }}>
            {(['LINK', 'VIDEO', 'IMAGE', 'AUDIO'] as const).map(t => {
              const isActive = mediaTab === t
              const icons: Record<string, string> = { LINK: '🔗 Ссылка', VIDEO: '🎬 Видео', IMAGE: '🖼️ Фото', AUDIO: '🎧 Аудио' }
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaTab(t)}
                  className="inline-flex items-center gap-[6px] font-sans font-bold text-[13px] rounded-[11px] px-[14px] py-[8px] transition"
                  style={{
                    background: isActive ? '#F1ECFE' : '#F4F2F9',
                    color: isActive ? '#6D3BEB' : '#867DA0',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {icons[t]}
                </button>
              )
            })}
          </div>

          {mediaTab === 'IMAGE' ? (
            <div className="mt-[14px]">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full flex items-center justify-center gap-2 font-sans font-bold text-[14px] py-4 rounded-[13px] transition disabled:opacity-50"
                style={{ border: '2px dashed #E6DFF6', color: '#928AAC', background: 'transparent', cursor: 'pointer' }}
              >
                {imageUploading ? 'Загрузка...' : '🖼️ Загрузить изображение'}
              </button>
            </div>
          ) : (
            <div className="mt-[14px] space-y-[8px]">
              <input
                type="text"
                value={mediaTitle}
                onChange={e => setMediaTitle(e.target.value)}
                placeholder="Название (необязательно)"
                className="w-full font-sans font-semibold text-[14px] text-[#241B3A] outline-none"
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
              />
              <div className="flex gap-[8px]">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 font-sans font-semibold text-[14px] text-[#241B3A] outline-none"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
                />
                <button
                  type="button"
                  onClick={addMediaItem}
                  className="font-sans font-bold text-[14px] text-white rounded-[13px] px-[16px] transition"
                  style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', border: 'none', cursor: 'pointer' }}
                >
                  Добавить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student picker */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[9px]">
              <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: '#EAF6F0' }}>👭</span>
              <div>
                <h2 className="font-display font-bold text-[17px] text-[#2E2350]">Кому отправить</h2>
                <p className="font-sans font-semibold text-[12.5px] text-[#928AAC] mt-[2px]">
                  Выбрано <b style={{ color: '#6D3BEB' }}>{selectedStudents.size}</b> из {students.length} студентов
                </p>
              </div>
            </div>
            <div className="flex gap-[8px]">
              <button
                type="button"
                onClick={selectAll}
                className="font-sans font-bold text-[12px] text-[#6D3BEB] rounded-[10px] px-[12px] py-[6px] transition"
                style={{ border: '1px solid #DCCFF7', background: '#fff', cursor: 'pointer' }}
              >
                Выбрать всех
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="font-sans font-semibold text-[12px] text-[#928AAC] rounded-[10px] px-[12px] py-[6px] transition"
                style={{ border: '1px solid #ECE6F6', background: '#fff', cursor: 'pointer' }}
              >
                Снять
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="font-sans text-[#928AAC] text-center py-4">Загрузка студентов...</p>
          ) : (
            <div className="grid grid-cols-2 gap-[10px] max-h-64 overflow-y-auto pr-1">
              {students.map((student, idx) => {
                const isSelected = selectedStudents.has(student.id)
                const colors = [
                  { bg: '#FFD9E6', color: '#C2477E' },
                  { bg: '#D8E4FF', color: '#3E63DD' },
                  { bg: '#D6F0E2', color: '#1F9D63' },
                  { bg: '#E7DBFB', color: '#7C4DD6' },
                  { bg: '#FFE0C2', color: '#C77B3E' },
                ]
                const avatarColor = colors[idx % colors.length]
                return (
                  <label
                    key={student.id}
                    className="flex items-center gap-[11px] rounded-[14px] cursor-pointer transition"
                    style={{
                      padding: '11px 13px',
                      border: `2px solid ${isSelected ? '#6D3BEB' : '#ECE6F6'}`,
                      background: isSelected ? '#F6F1FE' : '#fff',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(student.id)}
                      className="sr-only"
                    />
                    <div
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-sans font-extrabold text-[14px] flex-shrink-0"
                      style={{ background: avatarColor.bg, color: avatarColor.color }}
                    >
                      {student.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-bold text-[13.5px] text-[#241B3A] truncate">{student.name}</div>
                      <div className="font-sans font-semibold text-[11px] text-[#A59EB8]">{student.phone}</div>
                    </div>
                    <div
                      className="w-[20px] h-[20px] rounded-[6px] flex items-center justify-center text-[12px] flex-shrink-0"
                      style={
                        isSelected
                          ? { background: '#6D3BEB', color: '#fff' }
                          : { border: '2px solid #DDD5EC', background: '#fff' }
                      }
                    >
                      {isSelected && '✓'}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Questions for TEST */}
        {type === 'TEST' && (
          <div style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="font-display font-bold text-[17px] text-[#2E2350]">Вопросы</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="font-sans font-bold text-[13px] text-[#6D3BEB] rounded-[10px] px-[12px] py-[6px]"
                style={{ border: '1px solid #DCCFF7', background: '#fff', cursor: 'pointer' }}
              >
                ＋ Добавить вопрос
              </button>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-8 rounded-[14px]" style={{ border: '2px dashed #E6DFF6' }}>
                <p className="font-sans font-semibold text-[14px] text-[#928AAC] mb-4">Нет вопросов. Добавьте первый.</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="font-sans font-bold text-[13px] text-white rounded-[12px] px-[16px] py-[10px]"
                  style={{ background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)', border: 'none', cursor: 'pointer' }}
                >
                  ＋ Добавить вопрос
                </button>
              </div>
            )}

            {questions.map((question, qi) => (
              <div
                key={qi}
                className="rounded-[16px] mb-[14px]"
                style={{ border: '1.5px solid #E6DFF6', padding: '18px' }}
              >
                <div className="flex items-center justify-between mb-[12px]">
                  <span className="w-[28px] h-[28px] rounded-full flex items-center justify-center font-sans font-extrabold text-[13px] text-white" style={{ background: '#6D3BEB' }}>
                    {qi + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="font-sans text-[20px] text-[#D14343]"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={question.text}
                  onChange={e => updateQuestion(qi, e.target.value)}
                  placeholder="Введите текст вопроса..."
                  className="w-full font-sans font-semibold text-[14px] text-[#241B3A] outline-none mb-[12px]"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
                />
                <p className="font-sans font-semibold text-[12px] text-[#928AAC] mb-[8px]">Варианты ответов (отметьте правильный)</p>
                {question.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-[10px] mb-[8px]">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={option.isCorrect}
                      onChange={() => setCorrectOption(qi, oi)}
                      className="accent-[#6D3BEB] w-4 h-4 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Вариант ${oi + 1}`}
                      className="flex-1 font-sans font-semibold text-[13px] text-[#241B3A] outline-none"
                      style={{ ...inputStyle, padding: '10px 13px' }}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => (e.target.style.borderColor = '#E6DFF6')}
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="font-sans text-[18px] text-[#D14343]"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {question.options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="font-sans font-semibold text-[13px] text-[#6D3BEB] mt-[4px]"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    ＋ Добавить вариант
                  </button>
                )}
              </div>
            ))}

            {questions.length > 0 && (
              <button
                type="button"
                onClick={addQuestion}
                className="w-full font-sans font-bold text-[14px] text-[#6D3BEB] py-3 rounded-[14px] transition"
                style={{ border: '2px dashed #DCCFF7', background: 'transparent', cursor: 'pointer' }}
              >
                ＋ Добавить ещё вопрос
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-[14px] mt-[4px]">
          <Link
            href="/teacher/dashboard"
            className="font-sans font-bold text-[15px] text-[#7A7193] rounded-[14px] px-[20px] py-[14px] text-center transition"
            style={{ flex: '0 0 160px', border: '1.5px solid #E2DAF2', background: '#fff' }}
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 font-sans font-extrabold text-[15.5px] text-white rounded-[14px] py-[14px] transition disabled:opacity-60"
            style={{
              background: 'linear-gradient(120deg,#6D3BEB,#8B5CF6)',
              boxShadow: '0 10px 24px rgba(109,59,235,.30)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Создание...' : '🚀 Создать и отправить задание'}
          </button>
        </div>
      </form>
    </div>
  )
}
