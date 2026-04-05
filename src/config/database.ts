/**
 * Database Configuration
 * 
 * Configuração do PostgreSQL e inicialização
 */

import { DataSource } from 'typeorm'
import { logger } from '@/utils/logger'

// TODO: Import entities
// import { User } from '@/models/User'
// import { Note } from '@/models/Note'
// import { Link } from '@/models/Link'
// import { Tag } from '@/models/Tag'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'obsidian-clone',
  entities: [
    // User,
    // Note,
    // Link,
    // Tag,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.DATABASE_LOGGING === 'true',
  cache: {
    duration: 1000 * 60 * 10, // 10 minutos
  },
})

export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      logger.info('✅ Database connected and initialized')
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
    logger.info('✅ Database connection closed')
  }
}

// Getters for common repositories
export function getUserRepository() {
  return AppDataSource.getRepository('User')
}

export function getNoteRepository() {
  return AppDataSource.getRepository('Note')
}

export function getLinkRepository() {
  return AppDataSource.getRepository('Link')
}

export function getTagRepository() {
  return AppDataSource.getRepository('Tag')
}
