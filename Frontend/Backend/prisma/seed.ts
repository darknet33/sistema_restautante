import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const cajeroPassword = await bcrypt.hash('cajero123', 10)
  const meseroPassword = await bcrypt.hash('mesero123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      email: 'admin@restaurante.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN'
    }
  })

  await prisma.user.upsert({
    where: { email: 'cajero@restaurante.com' },
    update: {},
    create: {
      email: 'cajero@restaurante.com',
      password: cajeroPassword,
      name: 'Cajero Principal',
      role: 'CAJERO'
    }
  })

  await prisma.user.upsert({
    where: { email: 'mesero@restaurante.com' },
    update: {},
    create: {
      email: 'mesero@restaurante.com',
      password: meseroPassword,
      name: 'Mesero 1',
      role: 'MESERO'
    }
  })

  const catPlatos = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Platos Fuertes', type: 'plato' }
  })

  const catBebidas = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Bebidas', type: 'bebida' }
  })

  const catInsumos = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Insumos', type: 'insumo' }
  })

  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Hamburguesa Clásica',
      categoryId: catPlatos.id,
      price: 120,
      cost: 60,
      unit: 'porcion',
      isAvailable: true,
      isInventoryTracked: false
    }
  })

  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Pizza Margherita',
      categoryId: catPlatos.id,
      price: 150,
      cost: 70,
      unit: 'porcion',
      isAvailable: true,
      isInventoryTracked: false
    }
  })

  await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Coca Cola 600ml',
      categoryId: catBebidas.id,
      price: 25,
      cost: 15,
      unit: 'unidad',
      stockCurrent: 50,
      stockMin: 10,
      isInventoryTracked: true,
      isAvailable: true
    }
  })

  await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Agua Mineral 500ml',
      categoryId: catBebidas.id,
      price: 15,
      cost: 8,
      unit: 'unidad',
      stockCurrent: 100,
      stockMin: 20,
      isInventoryTracked: true,
      isAvailable: true
    }
  })

  for (let i = 1; i <= 7; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        seats: 4,
        status: 'LIBRE'
      }
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
