import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, phone: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(students)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const { name, phone, password } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Введите имя' }, { status: 400 })
  if (!phone?.trim()) return NextResponse.json({ error: 'Введите телефон или логин' }, { status: 400 })
  if (!password?.trim()) return NextResponse.json({ error: 'Введите пароль' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { phone: phone.trim() } })
  if (exists) return NextResponse.json({ error: 'Такой телефон уже существует' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  const student = await prisma.user.create({
    data: { name: name.trim(), phone: phone.trim(), password: hashed, role: 'STUDENT' },
    select: { id: true, name: true, phone: true, createdAt: true },
  })

  return NextResponse.json(student, { status: 201 })
}
