'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
  submission: Submission | null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StudentAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [textAnswer, setTextAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then(res => res.json())
      .then(data => {
        setAssignment(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
        // Check all questions answered
        for (const q of (assignment?.questions || [])) {
          if (!answers[q.id]) {
            setError('Ответьте на все вопросы перед отправкой')
            setSubmitting(false)
            return
          }
        }
      } else {
        if (!textAnswer.trim()) {
          setError('Напишите ответ перед отправкой')
          setSubmitting(false)
          return
        }
      }

      const body: any = { assignmentId: id }

      if (assignment?.type === 'TEST') {
        body.responses = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        }))
      } else {
        body.textAnswer = textAnswer
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

      router.push('/student/dashboard')
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
        <Link href="/student/dashboard" className="text-purple-600 hover:underline mt-2 inline-block">
          Назад к заданиям
        </Link>
      </div>
    )
  }

  const isOverdue = new Date(assignment.deadline) < new Date()
  const submission = assignment.submission

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/student/dashboard"
          className="p-2 rounded-lg hover:bg-gray-100 transition mt-1"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              assignment.type === 'TEST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {assignment.type === 'TEST' ? 'Тест' : 'Текст'}
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

      {/* Already submitted & graded */}
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

          {/* Show answers */}
          <h2 className="font-semibold text-gray-900 mb-3">Ваши ответы</h2>
          <AnswersReview assignment={assignment} submission={submission} />
        </div>
      )}

      {/* Submitted but not graded */}
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

          {/* Show submitted answers */}
          <h2 className="font-semibold text-gray-900 mb-3">Ваши ответы</h2>
          <AnswersReview assignment={assignment} submission={submission} />
        </div>
      )}

      {/* Deadline passed, not submitted */}
      {!submission && isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800 mb-1">Срок сдачи истёк</h2>
          <p className="text-red-600 text-sm">Дедлайн прошёл {formatDate(assignment.deadline)}</p>
          <p className="text-red-500 text-sm mt-1">Отправка работы больше невозможна</p>
        </div>
      )}

      {/* Assignment form (not submitted, not overdue) */}
      {!submission && !isOverdue && (
        <div>
          {assignment.description && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">
              <p className="text-purple-800">{assignment.description}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
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
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ваш ответ
              </label>
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

          {/* Submit button */}
          <div className="mt-6 flex gap-4">
            <Link
              href="/student/dashboard"
              className="flex-1 text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
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
            <p className="text-gray-600 mb-6">
              После отправки вы не сможете изменить ответы. Вы уверены, что хотите сдать задание?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnswersReview({ assignment, submission }: { assignment: Assignment; submission: Submission }) {
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
              <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-700 text-sm font-bold rounded-full flex-shrink-0">
                {i + 1}
              </span>
              <p className="font-medium text-gray-900">{question.text}</p>
            </div>
            <div className="space-y-2 ml-10">
              {question.options.map((option) => {
                const isSelected = response?.selectedOptionId === option.id
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                    }`} />
                    <span className={`text-sm ${isSelected ? 'text-purple-800 font-medium' : 'text-gray-600'}`}>
                      {option.text}
                    </span>
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
