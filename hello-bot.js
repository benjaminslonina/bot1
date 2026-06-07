// hello-bot.js
// This bot connects to the local Minecraft server and says "hllo" every 5 seconds.
// Run it with: node hello-bot.js
// Or override host with: MC_HOST=192.168.0.6 node hello-bot.js

const mineflayer = require('mineflayer')

const host = process.env.MC_HOST || '192.168.0.6'
const port = parseInt(process.env.MC_PORT, 10) || 25565
const username = process.env.MC_USERNAME || 'Bot'

const bot = mineflayer.createBot({
  host,
  port,
  username,
  auth: 'offline',
  version: false
})

bot.once('spawn', () => {
  console.log(`Bot connected to ${host}:${port} as ${username}`)
  setInterval(() => {
    bot.chat('hllo')
  }, 5000)
})

bot.on('error', (err) => {
  console.error('Bot error:', err)
})

bot.on('kicked', (reason) => {
  console.error('Bot was kicked:', reason)
})
