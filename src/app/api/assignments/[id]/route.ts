import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                text: true,
                ...(session.user.role === 'TEACHER' ? { isCorrect: true } : {}),
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    let submission = null
    if (session.user.role === 'STUDENT') {
      submission = await prisma.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: params.id,
            studentId: session.user.id,
          },
        },
        include: {
          responses: {
            include: {
              selectedOption: true,
              question: { select: { text: true } },
            },
          },
        },
      })
    }

    return NextResponse.json({ ...assignment, submission })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
