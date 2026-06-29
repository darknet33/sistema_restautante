import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Users (login con username)
  const randPass = () => Math.random().toString(36).slice(-8)
  const adminPass = process.env.SEED_ADMIN_PASSWORD || randPass()
  const cajeroPass = process.env.SEED_CAJERO_PASSWORD || randPass()
  const meseroPass = process.env.SEED_MESERO_PASSWORD || randPass()
  const cocinaPass = process.env.SEED_COCINA_PASSWORD || randPass()
  const adminPassword = await bcrypt.hash(adminPass, 10)
  const cajeroPassword = await bcrypt.hash(cajeroPass, 10)
  const meseroPassword = await bcrypt.hash(meseroPass, 10)
  const cocinaPassword = await bcrypt.hash(cocinaPass, 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@restaurante.com', password: adminPassword, name: 'Administrador', role: 'ADMIN' }
  })

  await prisma.user.upsert({
    where: { username: 'cajero' },
    update: {},
    create: { username: 'cajero', email: 'cajero@restaurante.com', password: cajeroPassword, name: 'Cajero Principal', role: 'CAJERO' }
  })

  await prisma.user.upsert({
    where: { username: 'mesero' },
    update: {},
    create: { username: 'mesero', email: 'mesero@restaurante.com', password: meseroPassword, name: 'Mesero 1', role: 'MESERO' }
  })

  await prisma.user.upsert({
    where: { username: 'cocina' },
    update: {},
    create: { username: 'cocina', email: 'cocina@restaurante.com', password: cocinaPassword, name: 'Cocinero 1', role: 'COCINA' }
  })

  // Categories
  const catPlatos = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Platos Fuertes', type: 'plato' }
  })

  const catBebidas = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Bebidas', type: 'bebida' }
  })

  const catInsumos = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Insumos', type: 'insumo' }
  })

  // Dishes (Platos)
  await prisma.dish.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, name: 'Hamburguesa Clásica', description: 'Carne 200g con queso, lechuga y tomate',
      price: 120, cost: 60, categoryId: catPlatos.id, isAvailable: true, isMenu: true
    }
  })

  await prisma.dish.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2, name: 'Pizza Margherita', description: 'Queso mozzarella, tomate y albahaca',
      price: 150, cost: 70, categoryId: catPlatos.id, isAvailable: true, isMenu: true
    }
  })

  await prisma.dish.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3, name: 'Tacos al Pastor', description: 'Tacos de cerdo con piña y cebolla',
      price: 90, cost: 40, categoryId: catPlatos.id, isAvailable: true, isMenu: true
    }
  })

  // Supplies (Consumibles) — con precios y movimiento inicial de stock
  const suppliesData = [
    { id: 1, name: 'Coca Cola 600ml', unit: 'unidad', purchaseCost: 5, salePrice: 12, stockCurrent: 50, stockMin: 10, categoryId: catBebidas.id, isInventoryTracked: true },
    { id: 2, name: 'Agua Mineral 500ml', unit: 'unidad', purchaseCost: 3, salePrice: 8, stockCurrent: 100, stockMin: 20, categoryId: catBebidas.id, isInventoryTracked: true },
    { id: 3, name: 'Jugo de Naranja Natural', unit: 'unidad', purchaseCost: 6, salePrice: 15, stockCurrent: 30, stockMin: 10, categoryId: catBebidas.id, isInventoryTracked: true },
    { id: 4, name: 'Papas Fritas (porción)', unit: 'porcion', purchaseCost: 4, salePrice: 10, stockCurrent: 40, stockMin: 15, categoryId: catInsumos.id, isInventoryTracked: true },
    { id: 5, name: 'Pan de Hamburguesa', unit: 'unidad', purchaseCost: 2, salePrice: 0, stockCurrent: 80, stockMin: 20, categoryId: catInsumos.id, isInventoryTracked: true },
  ]

  for (const s of suppliesData) {
    await prisma.supply.upsert({
      where: { id: s.id },
      update: {},
      create: s
    })
  }

  // Registra movimiento inicial de stock para cada consumible trackeado
  for (const s of suppliesData) {
    if (s.isInventoryTracked) {
      const existing = await prisma.inventoryMovement.findFirst({
        where: { supplyId: s.id, type: 'ENTRADA', stockBefore: 0, stockAfter: s.stockCurrent }
      })
      if (!existing) {
        await prisma.inventoryMovement.create({
          data: {
            supplyId: s.id,
            type: 'ENTRADA',
            quantity: s.stockCurrent,
            stockBefore: 0,
            stockAfter: s.stockCurrent,
            userId: 1
          }
        })
      }
    }
  }

  // Tables
  for (let i = 1; i <= 7; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: { number: i, seats: 4, status: 'LIBRE' }
    })
  }

  console.log('Seed completed successfully!')
  console.log('')
  console.log('─'.repeat(40))
  console.log('  CREDENCIALES DE ACCESO')
  console.log('─'.repeat(40))
  const showPass = !process.env.SEED_ADMIN_PASSWORD
  if (showPass) {
    console.log(`  Admin:  admin / ${adminPass}`)
    console.log(`  Cajero: cajero / ${cajeroPass}`)
    console.log(`  Mesero: mesero / ${meseroPass}`)
    console.log(`  Cocina: cocina / ${cocinaPass}`)
    console.log('')
    console.log('  Para usar contraseñas fijas, definir las variables:')
    console.log('  SEED_ADMIN_PASSWORD, SEED_CAJERO_PASSWORD,')
    console.log('  SEED_MESERO_PASSWORD, SEED_COCINA_PASSWORD')
  }
  console.log('─'.repeat(40))
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
