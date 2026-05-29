import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { grade, feedback } = body

    if (grade === undefined || grade === null) {
      return NextResponse.json({ error: 'Оценка обязательна' }, { status: 400 })
    }

    const gradeNum = parseInt(String(grade))
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return NextResponse.json({ error: 'Оценка должна быть от 0 до 100' }, { status: 400 })
    }

    // Verify submission belongs to teacher's assignment
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: { select: { teacherId: true } },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 })
    }

    if (submission.assignment.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        grade: gradeNum,
        feedback: feedback?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
