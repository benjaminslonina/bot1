#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const scriptPath = path.join(__dirname, 'hello-bot.js')
const restartDelayMs = 3000
const maxRestarts = 10

let child = null
let restartCount = 0
let stopping = false

function startBot () {
  console.log(`[watch] Starting bot (attempt ${restartCount + 1})...`)

  child = spawn(process.execPath, [scriptPath], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  child.stdout.on('data', (data) => {
    process.stdout.write(`[bot] ${data}`)
  })

  child.stderr.on('data', (data) => {
    process.stderr.write(`[bot] ${data}`)
  })

  child.on('exit', (code, signal) => {
    if (stopping) return

    const reason = code === null ? `signal ${signal}` : `exit code ${code}`
    console.log(`[watch] Bot stopped: ${reason}`)

    if (restartCount < maxRestarts) {
      restartCount += 1
      console.log(`[watch] Restarting in ${restartDelayMs / 1000}s...`)
      setTimeout(startBot, restartDelayMs)
    } else {
      console.log('[watch] Maximum restarts reached. Stopping watcher.')
      process.exit(1)
    }
  })
}

function stopWatcher () {
  stopping = true
  if (child && !child.killed) {
    child.kill('SIGINT')
  }
  setTimeout(() => process.exit(0), 500)
}

process.on('SIGINT', stopWatcher)
process.on('SIGTERM', stopWatcher)

startBot()
