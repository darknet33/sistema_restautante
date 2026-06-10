import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username y contraseña son requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
    )

    return res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { username, password, name, role } = req.body
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Username, password y name son requeridos' })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(409).json({ message: 'El username ya existe' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'MESERO'
      },
      select: { id: true, username: true, name: true, role: true, email: true }
    })

    return res.status(201).json(user)
  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    })
    return res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { username, password, name, role } = req.body
    const data: any = {}
    if (username) data.username = username
    if (name) data.name = name
    if (role) data.role = role
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, username: true, email: true, name: true, role: true }
    })
    return res.json(user)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' })
    console.error('Update user error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    const orderCount = await prisma.order.count({ where: { userId: id } })
    const cajaCount = await prisma.cajaSession.count({ where: { userId: id } })
    const wasteCount = await prisma.waste.count({ where: { userId: id } })
    const movementCount = await prisma.inventoryMovement.count({ where: { userId: id } })
    const turnoCount = await prisma.turnoClosure.count({ where: { userId: id } })
    if (orderCount > 0 || cajaCount > 0 || wasteCount > 0 || movementCount > 0 || turnoCount > 0) {
      const parts: string[] = []
      if (orderCount > 0) parts.push(`${orderCount} pedido(s)`)
      if (cajaCount > 0) parts.push(`${cajaCount} sesión(es) de caja`)
      if (wasteCount > 0) parts.push(`${wasteCount} merma(s)`)
      if (movementCount > 0) parts.push(`${movementCount} movimiento(s) de inventario`)
      if (turnoCount > 0) parts.push(`${turnoCount} cierre(s) de turno`)
      return res.status(409).json({
        message: `No se puede eliminar: tiene ${parts.join(', ')} asociados`
      })
    }

    await prisma.user.delete({ where: { id } })
    return res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' })
    console.error('Delete user error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
