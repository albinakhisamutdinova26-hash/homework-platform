'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  text: string
  orderIndex: number
  options: AnswerOption[]
}

interface SubmissionResponse {
  id: string
  questionId: string
  selectedOptionId: string | null
  textAnswer: string | null
  selectedOption: AnswerOption | null
}

interface SubmissionData {
  id: string
  status: string
  grade: number | null
  feedback: string | null
  textAnswer: string | null
  voiceUrl: string | null
  submittedAt: string
  gradedAt: string | null
  student: { name: string }
  assignment: {
    id: string
    title: string
    type: string
    description: string | null
    questions: Question[]
  }
  responses: SubmissionResponse[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GradeSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params.submissionId as string
  const assignmentId = params.id as string

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/submissions/${submissionId}`)
      .then(res => res.json())
      .then(data => {
        setSubmission(data)
        if (data.grade !== null && data.grade !== undefined) setGrade(String(data.grade))
        if (data.feedback) setFeedback(data.feedback)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [submissionId])

  const handleSave = async () => {
    if (!grade) { setError('Введите оценку'); return }
    const gradeNum = parseInt(grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      setError('Оценка должна быть от 0 до 100')
      return
    }
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: gradeNum, feedback }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при сохранении')
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push(`/teacher/assignments/${assignmentId}`), 1500)
    } catch {
      setError('Произошла ошибка')
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

  if (!submission) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Работа не найдена</p>
        <Link href="/teacher/dashboard" className="text-purple-600 hover:underline mt-2 inline-block">На главную</Link>
      </div>
    )
  }

  const getResponseForQuestion = (questionId: string) =>
    submission.responses.find(r => r.questionId === questionId)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href={`/teacher/assignments/${assignmentId}`} className="p-2 rounded-lg hover:bg-gray-100 transition mt-1">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проверка работы</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
              {submission.student.name[0]}
            </div>
            <span className="text-gray-600">{submission.student.name}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">Сдано: {formatDate(submission.submittedAt)}</span>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Оценка сохранена! Перенаправление...
        </div>
      )}

      {/* Assignment info */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
        <p className="text-purple-700 font-medium">{submission.assignment.title}</p>
        <p className="text-purple-500 text-sm mt-0.5">
          {submission.assignment.type === 'TEST' ? 'Тест' :
           submission.assignment.type === 'VOICE' ? 'Голосовой ответ' : 'Текстовый ответ'}
        </p>
        {submission.assignment.description && (
          <p className="text-purple-600 text-sm mt-2">{submission.assignment.description}</p>
        )}
      </div>

      {/* Answers */}
      <div className="space-y-4 mb-6">
        {submission.assignment.type === 'VOICE' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-700 mb-4">Голосовой ответ студента</h3>
            {submission.voiceUrl ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <span className="text-orange-700 font-medium text-sm">Аудиозапись ответа</span>
                </div>
                <audio src={submission.voiceUrl} controls className="w-full" />
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">Голосовой ответ не предоставлен</p>
            )}
          </div>
        ) : submission.assignment.type === 'TEXT' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-700 mb-3">Ответ студента</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
              {submission.textAnswer ? (
                <p className="text-gray-800 whitespace-pre-wrap">{submission.textAnswer}</p>
              ) : (
                <span className="text-gray-400 italic">Ответ не предоставлен</span>
              )}
            </div>
          </div>
        ) : (
          submission.assignment.questions.map((question, i) => {
            const response = getResponseForQuestion(question.id)
            const selectedOption = response?.selectedOption

            return (
              <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-purple-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium text-gray-900">{question.text}</p>
                </div>

                <div className="space-y-2 ml-10">
                  {question.options.map((option) => {
                    const isSelected = response?.selectedOptionId === option.id
                    const isCorrect = option.isCorrect

                    let containerClass = 'bg-gray-50 border-gray-200'
                    let textClass = 'text-gray-700'
                    let icon = null

                    if (isCorrect && isSelected) {
                      containerClass = 'bg-green-50 border-green-300'
                      textClass = 'text-green-800 font-medium'
                      icon = <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    } else if (!isCorrect && isSelected) {
                      containerClass = 'bg-red-50 border-red-300'
                      textClass = 'text-red-800 font-medium'
                      icon = <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    } else if (isCorrect) {
                      containerClass = 'bg-green-50 border-green-200'
                      textClass = 'text-green-700'
                      icon = <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    }

                    return (
                      <div key={option.id} className={`flex items-center gap-3 p-3 rounded-lg border ${containerClass}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`} />
                        <span className={`flex-1 text-sm ${textClass}`}>{option.text}</span>
                        {icon}
                      </div>
                    )
                  })}
                </div>

                <div className="ml-10 mt-3">
                  {!response ? (
                    <p className="text-xs text-gray-400 italic">Нет ответа</p>
                  ) : selectedOption?.isCorrect ? (
                    <p className="text-xs text-green-600 font-medium">Правильный ответ</p>
                  ) : (
                    <div>
                      <p className="text-xs text-red-600 font-medium">Неправильный ответ</p>
                      <p className="text-xs text-gray-500 mt-0.5">Правильный: {question.options.find(o => o.isCorrect)?.text}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Grade form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Выставить оценку</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Оценка (0–100) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="100"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Например, 85"
              className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
            {grade && !isNaN(parseInt(grade)) && (
              <span className={`text-2xl font-bold ${
                parseInt(grade) >= 90 ? 'text-green-600' :
                parseInt(grade) >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {parseInt(grade)}/100
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий к оценке</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Напишите комментарий для студента..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
          />
        </div>

        <div className="flex gap-4">
          <Link
            href={`/teacher/assignments/${assignmentId}`}
            className="flex-1 text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Назад
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Сохранение...
              </>
            ) : 'Сохранить оценку'}
          </button>
        </div>
      </div>
    </div>
  )
}
