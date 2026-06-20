import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, description, deadline, type, questions, studentIds, media } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
    }
    if (!deadline) {
      return NextResponse.json({ error: 'Дедлайн обязателен' }, { status: 400 })
    }
    if (!['TEST', 'TEXT', 'VOICE'].includes(type)) {
      return NextResponse.json({ error: 'Неверный тип задания' }, { status: 400 })
    }
    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: 'Выберите хотя бы одного студента' }, { status: 400 })
    }

    if (type === 'TEST') {
      if (!questions || questions.length === 0) {
        return NextResponse.json({ error: 'Добавьте хотя бы один вопрос' }, { status: 400 })
      }
      for (const q of questions) {
        if (!q.text?.trim()) {
          return NextResponse.json({ error: 'Текст вопроса обязателен' }, { status: 400 })
        }
        if (!q.options || q.options.length < 2) {
          return NextResponse.json({ error: 'Минимум 2 варианта ответа для каждого вопроса' }, { status: 400 })
        }
        if (!q.options.some((o: any) => o.isCorrect)) {
          return NextResponse.json({ error: 'Отметьте правильный ответ для каждого вопроса' }, { status: 400 })
        }
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        deadline: new Date(deadline),
        teacherId: session.user.id,
        assignedStudents: {
          create: (studentIds as string[]).map((studentId) => ({ studentId })),
        },
        questions: type === 'TEST' ? {
          create: questions.map((q: any, index: number) => ({
            text: q.text.trim(),
            orderIndex: index,
            options: {
              create: q.options.map((o: any) => ({
                text: o.text.trim(),
                isCorrect: Boolean(o.isCorrect),
              })),
            },
          })),
        } : undefined,
        media: media && media.length > 0 ? {
          create: media.map((m: any, index: number) => ({
            type: m.type,
            url: m.url,
            title: m.title?.trim() || null,
            orderIndex: index,
          })),
        } : undefined,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
