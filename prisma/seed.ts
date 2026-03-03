import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function createAdapterFromUrl(url?: string) {
  if (!url) throw new Error('DATABASE_URL ausente')
  const u = new URL(url)
  const host = u.hostname
  const port = u.port ? parseInt(u.port, 10) : undefined
  const user = decodeURIComponent(u.username)
  const password = decodeURIComponent(u.password)
  const database = u.pathname.replace(/^\//, '')
  return new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
  })
}

const adapter = createAdapterFromUrl(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

async function main() {
  const ldapServers = [
    'ldap://10.10.53.10',
    'ldap://10.10.53.11',
    'ldap://10.10.53.12',
    'ldap://10.10.64.213',
    'ldap://10.10.65.242',
    'ldap://10.10.65.90',
    'ldap://10.10.65.91',
    'ldap://10.10.66.85',
    'ldap://10.10.68.42',
    'ldap://10.10.68.43',
    'ldap://10.10.68.44',
    'ldap://10.10.68.45',
    'ldap://10.10.68.46',
    'ldap://10.10.68.47',
    'ldap://10.10.68.48',
    'ldap://10.10.68.49',
  ]

  for (const url of ldapServers) {
    const ip = new URL(url).hostname
    await prisma.servidor.upsert({
      where: { ip },
      update: {},
      create: { ip },
    })
  }

  await prisma.usuario.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      email: 'admin@local',
      nome: 'Administrador',
      permissao: 'ADMIN',
    },
  })

  // Caso deseje, ajuste nomes dos servidores:
  // await prisma.servidor.updateMany({ where: { ip: '10.10.65.242' }, data: { nome: 'Servidor LDAP Principal' } })
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
