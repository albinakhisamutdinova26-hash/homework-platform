import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, phone: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(students)
}
