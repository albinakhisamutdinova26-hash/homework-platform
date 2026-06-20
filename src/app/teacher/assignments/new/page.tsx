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

  // Media add state
  const [mediaType, setMediaType] = useState<'VIDEO' | 'IMAGE' | 'LINK'>('LINK')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaTitle, setMediaTitle] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => setStudents(data))
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

  // ── Questions ──
  const addQuestion = () => {
    setQuestions([...questions, {
      text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    }])
  }

  const removeQuestion = (qi: number) => setQuestions(questions.filter((_, i) => i !== qi))

  const updateQuestion = (qi: number, text: string) => {
    const updated = [...questions]
    updated[qi] = { ...updated[qi], text }
    setQuestions(updated)
  }

  const addOption = (qi: number) => {
    if (questions[qi].options.length >= 5) return
    const updated = [...questions]
    updated[qi].options = [...updated[qi].options, { text: '', isCorrect: false }]
    setQuestions(updated)
  }

  const removeOption = (qi: number, oi: number) => {
    if (questions[qi].options.length <= 2) return
    const updated = [...questions]
    updated[qi].options = updated[qi].options.filter((_, i) => i !== oi)
    if (!updated[qi].options.some(o => o.isCorrect)) {
      updated[qi].options[0].isCorrect = true
    }
    setQuestions(updated)
  }

  const updateOption = (qi: number, oi: number, text: string) => {
    const updated = [...questions]
    updated[qi].options[oi] = { ...updated[qi].options[oi], text }
    setQuestions(updated)
  }

  const setCorrectOption = (qi: number, oi: number) => {
    const updated = [...questions]
    updated[qi].options = updated[qi].options.map((opt, i) => ({ ...opt, isCorrect: i === oi }))
    setQuestions(updated)
  }

  // ── Media ──
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
    if (!mediaUrl.trim()) {
      setError('Введите URL')
      return
    }
    setMedia(prev => [...prev, { type: mediaType, url: mediaUrl.trim(), title: mediaTitle.trim() }])
    setMediaUrl('')
    setMediaTitle('')
    setError('')
  }

  const removeMedia = (index: number) => setMedia(media.filter((_, i) => i !== index))

  // ── Validation ──
  const validate = () => {
    if (!title.trim()) return 'Введите название задания'
    if (!deadline) return 'Укажите дедлайн'
    if (new Date(deadline) <= new Date()) return 'Дедлайн должен быть в будущем'
    if (selectedStudents.size === 0) return 'Выберите хотя бы одного студента'
    if (type === 'TEST') {
      if (questions.length === 0) return 'Добавьте хотя бы один вопрос'
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim()) return `Введите текст вопроса ${i + 1}`
        if (questions[i].options.length < 2) return `Вопрос ${i + 1} должен иметь минимум 2 варианта ответа`
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
        body: JSON.stringify({
          title,
          description,
          deadline,
          type,
          questions,
          studentIds: Array.from(selectedStudents),
          media,
        }),
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

  const mediaTypeLabel: Record<string, string> = { VIDEO: 'Видео', IMAGE: 'Изображение', LINK: 'Ссылка' }
  const mediaTypeIcon: Record<string, string> = { VIDEO: '🎬', IMAGE: '🖼️', LINK: '🔗' }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/teacher/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новое задание</h1>
          <p className="text-gray-500 mt-0.5">Создайте задание для студентов</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Основная информация</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название задания"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите задание подробнее..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дедлайн <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Assignment type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип задания <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'TEXT', label: 'Текстовый ответ', desc: 'Студент пишет свободный ответ', icon: '✏️' },
                { value: 'TEST', label: 'Тест', desc: 'Вопросы с вариантами ответов', icon: '📝' },
                { value: 'VOICE', label: 'Голосовой ответ', desc: 'Студент записывает аудио', icon: '🎤' },
              ] as const).map(({ value, label, desc, icon }) => (
                <label
                  key={value}
                  className={`flex flex-col gap-1 p-4 border-2 rounded-lg cursor-pointer transition ${
                    type === value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={type === value}
                    onChange={() => { setType(value); if (value !== 'TEST') setQuestions([]) }}
                    className="sr-only"
                  />
                  <span className="text-xl">{icon}</span>
                  <span className="font-medium text-gray-900 text-sm">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Media section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Медиаматериалы</h2>
            <p className="text-sm text-gray-500 mt-0.5">Добавьте видео, фото или ссылки к заданию</p>
          </div>

          {/* Existing media */}
          {media.length > 0 && (
            <div className="space-y-2">
              {media.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-lg flex-shrink-0">{mediaTypeIcon[item.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {item.title || item.url}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{mediaTypeLabel[item.type]}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add media controls */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex gap-2 mb-3">
              {(['LINK', 'VIDEO', 'IMAGE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    mediaType === t ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mediaTypeIcon[t]} {mediaTypeLabel[t]}
                </button>
              ))}
            </div>

            {mediaType === 'IMAGE' ? (
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-purple-400 text-gray-500 hover:text-purple-600 py-4 rounded-lg transition disabled:opacity-50"
                >
                  {imageUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Загрузить изображение
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder={mediaType === 'VIDEO' ? 'Название видео (необязательно)' : 'Название ссылки (необязательно)'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={mediaType === 'VIDEO' ? 'https://youtube.com/watch?v=...' : 'https://example.com'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={addMediaItem}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Picker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Студенты <span className="text-red-500">*</span></h2>
              <p className="text-sm text-gray-500 mt-0.5">Выбрано: {selectedStudents.size} из {students.length}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50 transition">Все</button>
              <button type="button" onClick={deselectAll} className="text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Снять</button>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Загрузка студентов...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {students.map((student) => (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedStudents.has(student.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="accent-purple-600 w-4 h-4 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{student.name}</div>
                    <div className="text-xs text-gray-400">{student.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Questions for TEST type */}
        {type === 'TEST' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-lg">Вопросы</h2>
              <button type="button" onClick={addQuestion} className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить вопрос
              </button>
            </div>

            {questions.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">Нет вопросов. Добавьте первый вопрос.</p>
                <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить вопрос
                </button>
              </div>
            )}

            {questions.map((question, qi) => (
              <div key={qi} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-purple-600 text-white text-sm font-bold rounded-full">{qi + 1}</span>
                  <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(qi, e.target.value)}
                    placeholder="Введите текст вопроса..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 mb-2">Варианты ответов (отметьте правильный)</p>
                  {question.options.map((option, oi) => (
                    <div key={oi} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={option.isCorrect}
                        onChange={() => setCorrectOption(qi, oi)}
                        className="accent-purple-600 w-4 h-4 flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Вариант ${oi + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                      />
                      {question.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(qi, oi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {question.options.length < 5 && (
                    <button type="button" onClick={() => addOption(qi)} className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 mt-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Добавить вариант ответа
                    </button>
                  )}
                </div>
              </div>
            ))}

            {questions.length > 0 && (
              <button
                type="button"
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 text-purple-600 hover:border-purple-500 hover:bg-purple-50 py-3 rounded-xl transition font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить ещё вопрос
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/teacher/dashboard" className="flex-1 text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Создание...
              </>
            ) : 'Создать задание'}
          </button>
        </div>
      </form>
    </div>
  )
}
