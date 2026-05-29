import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingTeacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } })
  if (existingTeacher) {
    console.log('База уже заполнена, пропускаю seed.')
    return
  }

  console.log('Первый запуск — создаю аккаунты...')

  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  await prisma.user.create({
    data: {
      name: 'Преподаватель',
      phone: '79991234567',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })
  console.log('Создан преподаватель: 79991234567 / teacher123')

  const students = [
    { name: 'Иванов Иван', phone: '79991111111' },
    { name: 'Петрова Мария', phone: '79992222222' },
    { name: 'Сидоров Алексей', phone: '79993333333' },
    { name: 'Козлова Елена', phone: '79994444444' },
    { name: 'Новиков Дмитрий', phone: '79995555555' },
    { name: 'Морозова Анна', phone: '79996666666' },
    { name: 'Волков Сергей', phone: '79997777777' },
    { name: 'Лебедева Ольга', phone: '79998888888' },
    { name: 'Соколов Павел', phone: '79999999999' },
    { name: 'Попова Наталья', phone: '79990000000' },
    { name: 'Васильев Андрей', phone: '79991112233' },
    { name: 'Захарова Юлия', phone: '79992223344' },
    { name: 'Орлов Михаил', phone: '79993334455' },
    { name: 'Федорова Татьяна', phone: '79994445566' },
    { name: 'Михайлов Кирилл', phone: '79995556677' },
    { name: 'Никитина Светлана', phone: '79996667788' },
    { name: 'Борисов Виктор', phone: '79997778899' },
    { name: 'Алексеева Ирина', phone: '79998889900' },
    { name: 'Кузнецов Роман', phone: '79999990011' },
    { name: 'Тихонова Валерия', phone: '79990001122' },
  ]

  for (const s of students) {
    await prisma.user.create({
      data: { ...s, password: studentPassword, role: 'STUDENT' },
    })
  }
  console.log(`Создано ${students.length} студентов, пароль: student123`)
  console.log('Готово!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
