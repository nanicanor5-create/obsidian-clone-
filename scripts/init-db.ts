#!/usr/bin/env tsx
/**
 * Script de inicialização do banco de dados
 */

import { db } from '../src/core/database'
import { logger } from '../src/utils/logger'

try {
  logger.info('🚀 Initializing database...')
  db.connect()
  logger.info('✅ Database initialized successfully!')
  logger.info(`📁 Database file: ${process.cwd()}/knowledge.db`)
} catch (error) {
  console.error('❌ Failed to initialize database:', error)
  process.exit(1)
}
