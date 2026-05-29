import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role === 'TEACHER') {
    redirect('/teacher/dashboard')
  }

  if (session.user.role === 'STUDENT') {
    redirect('/student/dashboard')
  }

  redirect('/auth/login')
}
