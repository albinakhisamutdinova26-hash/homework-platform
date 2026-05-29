import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { id: true, name: true } },
        assignment: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        responses: {
          include: {
            selectedOption: true,
            question: { select: { text: true } },
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 })
    }

    // Verify the assignment belongs to this teacher
    if (submission.assignment.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
