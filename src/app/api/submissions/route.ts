import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { assignmentId, responses, textAnswer, voiceUrl } = body

    if (!assignmentId) {
      return NextResponse.json({ error: 'ID задания обязателен' }, { status: 400 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { questions: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    if (new Date(assignment.deadline) < new Date()) {
      return NextResponse.json({ error: 'Срок сдачи задания истёк' }, { status: 400 })
    }

    const existing = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Вы уже сдали это задание' }, { status: 400 })
    }

    if (assignment.type === 'TEXT') {
      if (!textAnswer?.trim()) {
        return NextResponse.json({ error: 'Текстовый ответ обязателен' }, { status: 400 })
      }
      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: session.user.id,
          status: 'SUBMITTED',
          textAnswer: textAnswer.trim(),
        },
      })
      return NextResponse.json(submission, { status: 201 })
    }

    if (assignment.type === 'VOICE') {
      if (!voiceUrl) {
        return NextResponse.json({ error: 'Голосовой ответ обязателен' }, { status: 400 })
      }
      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: session.user.id,
          status: 'SUBMITTED',
          voiceUrl,
        },
      })
      return NextResponse.json(submission, { status: 201 })
    }

    // TEST type
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'Ответы на вопросы обязательны' }, { status: 400 })
    }

    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          assignmentId,
          studentId: session.user.id,
          status: 'SUBMITTED',
          responses: {
            create: responses.map((r: any) => ({
              questionId: r.questionId,
              selectedOptionId: r.selectedOptionId,
            })),
          },
        },
        include: {
          responses: {
            include: { selectedOption: true },
          },
        },
      })
      return sub
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
