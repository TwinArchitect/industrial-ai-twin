import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { generateSnapshot } from './mockData.js'

const PORT = process.env.PORT ?? 3001

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://*.vercel.app'],
    methods: ['GET', 'POST'],
  },
})

// ─── REST 端点 ───────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ─── WebSocket ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`)

  // 立即发送一帧初始数据
  socket.emit('sensor:update', generateSnapshot())

  // 每 500ms 推送一次传感器快照（2Hz 更新频率）
  const interval = setInterval(() => {
    socket.emit('sensor:update', generateSnapshot())
  }, 500)

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`)
    clearInterval(interval)
  })
})

// ─── 启动 ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`)
  console.log('[Server] WebSocket ready for sensor data streaming')
})
