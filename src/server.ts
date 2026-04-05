/**
 * Express Server Setup
 * 
 * Configura o servidor Express com middleware, rotas e handlers
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import { createServer as createHttpServer, Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { logger } from './utils/logger'
import { errorHandler } from './api/middleware/errorHandler'
import { authMiddleware } from './api/middleware/auth'

// Import routes (quando criadas)
// import notesRouter from './api/routes/notes'
// import graphRouter from './api/routes/graph'
// import aiRouter from './api/routes/ai'
// import authRouter from './api/routes/auth'

export function createServer(): { app: Express; server: Server; io: SocketIOServer } {
  const app = express()
  const server = createHttpServer(app)
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  })

  // ===== MIDDLEWARE =====

  // Security
  app.use(helmet())
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }))

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))

  // Logging
  if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }))
  }

  // Request ID for tracing
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = require('crypto').randomUUID()
    res.setHeader('X-Request-ID', req.id)
    next()
  })

  // ===== ROUTES =====

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  // API Status
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected', // TODO: Check actual connection
      redis: 'connected', // TODO: Check actual connection
      gemini: 'ready', // TODO: Check actual availability
      version: '0.1.0-alpha',
    })
  })

  // API Documentation
  if (process.env.ENABLE_SWAGGER_DOCS !== 'false') {
    app.get('/docs', (req: Request, res: Response) => {
      res.send(`
        <html>
          <head>
            <title>API Documentation</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css">
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.js"></script>
            <script>
              window.onload = () => {
                SwaggerUIBundle({
                  url: '/api/openapi.json',
                  dom_id: '#swagger-ui',
                })
              }
            </script>
          </body>
        </html>
      `)
    })
  }

  // Register routes (quando implementadas)
  // app.use('/api/auth', authRouter)
  // app.use('/api/notes', authMiddleware, notesRouter)
  // app.use('/api/graph', authMiddleware, graphRouter)
  // app.use('/api/ai', authMiddleware, aiRouter)

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
    })
  })

  // Error handler (deve estar por último)
  app.use(errorHandler)

  // ===== WEBSOCKET =====

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`)
    })

    socket.on('error', (error) => {
      logger.error(`WebSocket error: ${socket.id}`, error)
    })
  })

  // Store io instance on server for access in other modules
  ;(server as any).io = io

  return { app, server, io }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string
      user?: any
    }
  }
}
