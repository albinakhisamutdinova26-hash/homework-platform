'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import MotivationalCat from '@/components/MotivationalCat'

interface AnswerOption {
  id: string
  text: string
  isCorrect?: boolean
}

interface Question {
  id: string
  text: string
  orderIndex: number
  options: AnswerOption[]
}

interface MediaItem {
  id: string
  type: string
  url: string
  title: string | null
  orderIndex: number
}

interface SubmissionResponse {
  questionId: string
  selectedOptionId: string | null
  textAnswer: string | null
  selectedOption: AnswerOption | null
  question: { text: string }
}

interface Submission {
  id: string
  status: string
  grade: number | null
  feedback: string | null
  textAnswer: string | null
  voiceUrl: string | null
  submittedAt: string
  responses: SubmissionResponse[]
}

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  deadline: string
  questions: Question[]
  media: MediaItem[]
  submission: Submission | null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

function MediaBlock({ items }: { items: MediaItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-4 mb-6">
      {items.map((item) => {
        if (item.type === 'IMAGE') {
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {item.title && <p className="text-sm font-medium text-gray-700 mb-3">{item.title}</p>}
              <img src={item.url} alt={item.title || 'Изображение'} className="rounded-lg max-w-full max-h-80 object-contain" />
            </div>
          )
        }
        if (item.type === 'VIDEO') {
          const embedUrl = getVideoEmbedUrl(item.url)
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {item.title && <p className="text-sm font-medium text-gray-700 mb-3">{item.title}</p>}
              {embedUrl ? (
                <iframe src={embedUrl} className="w-full rounded-lg" style={{ aspectRatio: '16/9' }} allowFullScreen />
              ) : (
                <video src={item.url} controls className="w-full rounded-lg" />
              )}
            </div>
          )
        }
        return (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="text-blue-700 font-medium text-sm">{item.title || item.url}</span>
            <svg className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )
      })}
    </div>
  )
}

function VoiceRecorder({ onRecorded }: { onRecorded: (url: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setRecorded(true)

        // Upload
        setUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'voice.webm')
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          if (!res.ok) throw new Error()
          const data = await res.json()
          onRecorded(data.url)
        } catch {
          setError('Ошибка загрузки записи. Попробуйте снова.')
          setRecorded(false)
          setAudioUrl(null)
        } finally {
          setUploading(false)
        }
      }

      mr.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setError('Не удалось получить доступ к микрофону. Разрешите доступ в настройках браузера.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resetRecording = () => {
    setRecorded(false)
    setAudioUrl(null)
    setSeconds(0)
    setError('')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-4">Голосовой ответ</label>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {!recorded ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            recording ? 'bg-red-100 ring-4 ring-red-300 ring-offset-2 animate-pulse' : 'bg-gray-100'
          }`}>
            <svg className={`w-9 h-9 ${recording ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>

          {recording && (
            <div className="text-red-500 font-mono text-lg font-semibold">{formatTime(seconds)}</div>
          )}

          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              Начать запись
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              Остановить
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {uploading ? (
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-purple-700 text-sm">Загрузка записи...</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 text-sm font-medium">Запись готова ({formatTime(seconds)})</span>
              </div>
              {audioUrl && <audio src={audioUrl} controls className="w-full" />}
              <button
                type="button"
                onClick={resetRecording}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Записать снова
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [textAnswer, setTextAnswer] = useState('')
  const [voiceUrl, setVoiceUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMotivation, setShowMotivation] = useState(false)
  const [studentGoal, setStudentGoal] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/assignments/${id}`).then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([assignmentData, profileData]) => {
      setAssignment(assignmentData)
      setStudentGoal(profileData?.goal || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    setShowConfirm(false)

    try {
      if (assignment?.type === 'TEST') {
        for (const q of (assignment?.questions || [])) {
          if (!answers[q.id]) {
            setError('Ответьте на все вопросы перед отправкой')
            setSubmitting(false)
            return
          }
        }
      } else if (assignment?.type === 'TEXT') {
        if (!textAnswer.trim()) {
          setError('Напишите ответ перед отправкой')
          setSubmitting(false)
          return
        }
      } else if (assignment?.type === 'VOICE') {
        if (!voiceUrl) {
          setError('Запишите голосовой ответ перед отправкой')
          setSubmitting(false)
          return
        }
      }

      const body: Record<string, unknown> = { assignmentId: id }

      if (assignment?.type === 'TEST') {
        body.responses = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId, selectedOptionId,
        }))
      } else if (assignment?.type === 'TEXT') {
        body.textAnswer = textAnswer
      } else if (assignment?.type === 'VOICE') {
        body.voiceUrl = voiceUrl
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при отправке')
        setSubmitting(false)
        return
      }

      setShowMotivation(true)
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Задание не найдено</p>
        <Link href="/student/dashboard" className="text-purple-600 hover:underline mt-2 inline-block">Назад к заданиям</Link>
      </div>
    )
  }

  const isOverdue = new Date(assignment.deadline) < new Date()
  const submission = assignment.submission

  const typeLabel: Record<string, string> = { TEXT: 'Текст', TEST: 'Тест', VOICE: 'Голос' }
  const typeColor: Record<string, string> = {
    TEXT: 'bg-green-100 text-green-700',
    TEST: 'bg-blue-100 text-blue-700',
    VOICE: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/student/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition mt-1">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor[assignment.type] || 'bg-gray-100 text-gray-700'}`}>
              {typeLabel[assignment.type] || assignment.type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <div className="flex items-center gap-1.5 mt-2">
            <svg className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              Дедлайн: {formatDate(assignment.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Graded */}
      {submission && submission.status === 'GRADED' && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-800">Работа проверена</span>
            </div>
            <div className="text-green-700">
              <span className="text-2xl font-bold">{submission.grade}</span>
              <span className="text-lg">/100</span>
            </div>
            {submission.feedback && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-green-800 mb-1">Комментарий преподавателя:</p>
                <p className="text-green-700 text-sm">{submission.feedback}</p>
              </div>
            )}
          </div>

          <h2 className="font-semibold text-gray-900 mb-3">Ваш ответ</h2>
          <AnswersReview assignment={assignment} submission={submission} />
        </div>
      )}

      {/* Submitted, not graded */}
      {submission && submission.status === 'SUBMITTED' && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-800">Работа сдана</p>
              <p className="text-blue-600 text-sm">Ожидает проверки · Сдано: {formatDate(submission.submittedAt)}</p>
            </div>
          </div>
          <h2 className="font-semibold text-gray-900 mb-3">Ваш ответ</h2>
          <AnswersReview assignment={assignment} submission={submission} />
        </div>
      )}

      {/* Overdue, not submitted */}
      {!submission && isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800 mb-1">Срок сдачи истёк</h2>
          <p className="text-red-600 text-sm">{formatDate(assignment.deadline)}</p>
        </div>
      )}

      {/* Active form */}
      {!submission && !isOverdue && (
        <div>
          {assignment.description && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">
              <p className="text-purple-800">{assignment.description}</p>
            </div>
          )}

          {/* Media */}
          <MediaBlock items={assignment.media} />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          {assignment.type === 'TEST' ? (
            <div className="space-y-4">
              {assignment.questions.map((question, i) => (
                <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-purple-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="font-medium text-gray-900">{question.text}</p>
                  </div>
                  <div className="space-y-2 ml-10">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          answers[question.id] === option.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={answers[question.id] === option.id}
                          onChange={() => handleSelectOption(question.id, option.id)}
                          className="accent-purple-600"
                        />
                        <span className="text-gray-800 text-sm">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : assignment.type === 'VOICE' ? (
            <VoiceRecorder onRecorded={setVoiceUrl} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Ваш ответ</label>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Напишите ваш ответ здесь..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
              />
              <p className="text-sm text-gray-400 mt-2">{textAnswer.length} символов</p>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Link href="/student/dashboard" className="flex-1 text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
              Назад
            </Link>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Сдать задание
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Подтверждение</h3>
            <p className="text-gray-600 mb-6">После отправки вы не сможете изменить ответы. Вы уверены?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">Отмена</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition">Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* Motivation modal */}
      {showMotivation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <MotivationalCat celebrating size={120} />
            </div>

            <div className="mb-2 text-2xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Задание сдано!</h2>

            {studentGoal ? (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
                <p className="text-purple-700 font-semibold text-base">Ты на шаг ближе к своей цели!</p>
                <p className="text-purple-500 text-sm mt-1">«{studentGoal}»</p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                <p className="text-orange-700 font-medium text-sm">
                  Отличная работа! Установи цель в своём профиле — и котик будет напоминать тебе о ней каждый раз 🐱
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/student/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              На главную
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AnswersReview({ assignment, submission }: { assignment: Assignment; submission: Submission }) {
  if (assignment.type === 'VOICE') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-500 mb-3">Голосовой ответ</p>
        {submission.voiceUrl ? (
          <audio src={submission.voiceUrl} controls className="w-full" />
        ) : (
          <span className="text-gray-400 italic text-sm">Голосовой ответ не был предоставлен</span>
        )}
      </div>
    )
  }

  if (assignment.type === 'TEXT') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-800 whitespace-pre-wrap">
          {submission.textAnswer || <span className="text-gray-400 italic">Ответ не был предоставлен</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assignment.questions.map((question, i) => {
        const response = submission.responses.find(r => r.questionId === question.id)
        return (
          <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-700 text-sm font-bold rounded-full flex-shrink-0">{i + 1}</span>
              <p className="font-medium text-gray-900">{question.text}</p>
            </div>
            <div className="space-y-2 ml-10">
              {question.options.map((option) => {
                const isSelected = response?.selectedOptionId === option.id
                return (
                  <div key={option.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`} />
                    <span className={`text-sm ${isSelected ? 'text-purple-800 font-medium' : 'text-gray-600'}`}>{option.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
