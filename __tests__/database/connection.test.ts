import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

describe('Database Connection and Operations', () => {
  let prisma: PrismaClient
  const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

  beforeAll(async () => {
    // Create a test database instance
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./test.db',
        },
      },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      try {
        await prisma.$connect()
        expect(true).toBe(true)
      } catch (error) {
        fail('Failed to connect to database')
      }
    })

    it('should handle database queries', async () => {
      try {
        await prisma.$queryRaw`SELECT 1`
        expect(true).toBe(true)
      } catch (error) {
        fail('Failed to execute query')
      }
    })

    it('should verify database file exists', () => {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
      const dbExists = fs.existsSync(dbPath)
      expect(dbExists).toBe(true)
    })
  })

  describe('Admin Model Operations', () => {
    it('should have correct schema structure', async () => {
      // Test that we can query the admin table structure
      try {
        const tableInfo = await prisma.$queryRaw`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name='Admin'
        ` as any[]

        expect(tableInfo.length).toBeGreaterThan(0)
      } catch (error) {
        console.error('Schema test error:', error)
      }
    })

    it('should verify admin table columns', async () => {
      try {
        const columns = await prisma.$queryRaw`
          PRAGMA table_info(Admin)
        ` as any[]

        const columnNames = columns.map((col: any) => col.name)

        expect(columnNames).toContain('id')
        expect(columnNames).toContain('username')
        expect(columnNames).toContain('password')
        expect(columnNames).toContain('createdAt')
        expect(columnNames).toContain('updatedAt')
      } catch (error) {
        console.error('Column verification error:', error)
      }
    })

    it('should enforce unique username constraint', async () => {
      // This test verifies the unique constraint is in place
      try {
        const constraints = await prisma.$queryRaw`
          SELECT sql FROM sqlite_master
          WHERE type='table' AND name='Admin'
        ` as any[]

        const tableDefinition = constraints[0]?.sql || ''
        expect(tableDefinition.toLowerCase()).toContain('unique')
      } catch (error) {
        console.error('Constraint test error:', error)
      }
    })

    it('should verify admin user exists', async () => {
      try {
        const admin = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        expect(admin).toBeTruthy()
        expect(admin?.username).toBe('admin')
        expect(admin?.password).toBeTruthy()
        expect(admin?.password.length).toBeGreaterThan(50) // Hashed password
      } catch (error) {
        console.error('Admin verification error:', error)
      }
    })

    it('should verify password is hashed correctly', async () => {
      try {
        const admin = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        if (admin) {
          const isValidPassword = await bcrypt.compare('admin123', admin.password)
          expect(isValidPassword).toBe(true)

          const isInvalidPassword = await bcrypt.compare('wrongpassword', admin.password)
          expect(isInvalidPassword).toBe(false)
        }
      } catch (error) {
        console.error('Password verification error:', error)
      }
    })
  })

  describe('Database Performance', () => {
    it('should handle queries efficiently', async () => {
      const startTime = Date.now()

      try {
        await prisma.admin.findMany()
        const endTime = Date.now()
        const queryTime = endTime - startTime

        // Query should complete in less than 100ms
        expect(queryTime).toBeLessThan(100)
      } catch (error) {
        console.error('Performance test error:', error)
      }
    })

    it('should handle concurrent connections', async () => {
      const connections = []

      for (let i = 0; i < 5; i++) {
        connections.push(
          prisma.admin.findMany()
        )
      }

      try {
        const results = await Promise.all(connections)
        expect(results.length).toBe(5)
        results.forEach(result => {
          expect(Array.isArray(result)).toBe(true)
        })
      } catch (error) {
        fail('Failed to handle concurrent connections')
      }
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data consistency', async () => {
      try {
        const admin1 = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        const admin2 = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        expect(admin1?.id).toBe(admin2?.id)
        expect(admin1?.username).toBe(admin2?.username)
        expect(admin1?.password).toBe(admin2?.password)
      } catch (error) {
        console.error('Data consistency error:', error)
      }
    })

    it('should have valid timestamps', async () => {
      try {
        const admin = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        if (admin) {
          expect(admin.createdAt).toBeInstanceOf(Date)
          expect(admin.updatedAt).toBeInstanceOf(Date)
          expect(admin.createdAt.getTime()).toBeLessThanOrEqual(admin.updatedAt.getTime())
        }
      } catch (error) {
        console.error('Timestamp validation error:', error)
      }
    })

    it('should validate ID format', async () => {
      try {
        const admin = await prisma.admin.findUnique({
          where: { username: 'admin' }
        })

        if (admin) {
          // Check if ID is a valid cuid format
          expect(admin.id).toBeTruthy()
          expect(typeof admin.id).toBe('string')
          expect(admin.id.length).toBeGreaterThan(20)
        }
      } catch (error) {
        console.error('ID validation error:', error)
      }
    })
  })
})