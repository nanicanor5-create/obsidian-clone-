/**
 * Server - Express Minimalista
 * 
 * API server otimizado para performance
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './core/database'
import { logger } from './utils/logger'

// Import routes
import { ingestNotes, getIngestStatus } from './api/routes/ingest'
import { getGraph, getGraphStats, getNoteConnections, findPath } from './api/routes/graph'
import { searchNotes, findSimilarNotes, listTags, listEntities } from './api/routes/search'

// Carrega env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ limit: '10mb' }))

// Request logging (apenas em dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`)
    next()
  })
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.post('/api/ingest', ingestNotes)
app.get('/api/ingest/status', getIngestStatus)

app.get('/api/graph', getGraph)
app.get('/api/graph/stats', getGraphStats)
app.get('/api/graph/connections/:noteId', getNoteConnections)
app.get('/api/graph/path/:noteId1/:noteId2', findPath)

app.get('/api/search', searchNotes)
app.get('/api/search/similar/:noteId', findSimilarNotes)
app.get('/api/search/tags', listTags)
app.get('/api/search/entities', listEntities)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// Inicia servidor
export async function startServer() {
  try {
    // Conecta ao banco
    db.connect()
    logger.info('💾 Database connected')

    // Inicia HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`)
      logger.info(`📊 Health: http://localhost:${PORT}/health`)
      logger.info(`🔍 Search: http://localhost:${PORT}/api/search?q=test`)
      logger.info(`🕸️ Graph: http://localhost:${PORT}/api/graph`)
      logger.info(`📥 Ingest: POST http://localhost:${PORT}/api/ingest`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  db.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...')
  db.close()
  process.exit(0)
})

// Export para testes
export default app
