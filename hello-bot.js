// hello-bot.js
// This bot connects to the local Minecraft server and says "hllo" every 5 seconds.
// Run it with: node hello-bot.js

const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'pterodactyl.home.arpa',
  port: 25565,
  username: 'Bot',
  auth: 'offline',
  version: false
})

bot.once('spawn', () => {
  console.log('Bot connected to pterodactyl.home.arpa')
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
