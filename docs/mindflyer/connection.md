# Mineflyer Connection Guide

This document records what I learned about connecting a Minecraft bot to a server using the Mineflyer/Mineflayer API.

## 1. Install Node and Mineflayer

Mineflayer is a Node.js library for creating Minecraft bots.

Install Node.js (version 18 or newer), then in the repo run:

```bash
npm install mineflayer
```

## 2. How the bot connects to the server

The bot connects using the Minecraft protocol. You create the bot with `mineflayer.createBot()` and give it server details.

Example:

```js
const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'pterodactyl.home.arpa',
  port: 25565,
  username: 'its_eystreem',
  auth: 'offline',
  version: false
})

bot.on('spawn', () => {
  console.log('Bot connected to server!')
})

bot.on('error', console.log)
bot.on('kicked', console.log)
```

## 3. Important connection options

- `host`: the Minecraft server address, e.g. `pterodactyl.home.arpa`.
- `port`: Minecraft server port, usually `25565`.
- `username`: the bot's name when joining.
- `auth`: authentication mode. For local offline servers use `'offline'`. For online Mojang/Microsoft servers use `'microsoft'` or omit it and let Mineflayer guess.
- `version`: if not set or set to `false`, Mineflayer tries to detect the server version automatically.
- `password`: only needed for password-based auth; `username` must be an email address for this. If you want the bot to use a real account skin, use a Microsoft login with `auth: 'microsoft'` and the correct account credentials.

## 4. Working with server events

The bot can listen for important events once connected:

- `bot.on('spawn', ...)` runs when the bot has entered the world.
- `bot.on('chat', ...)` listens to chat messages.
- `bot.on('kicked', ...)` reports server kick messages.
- `bot.on('error', ...)` reports connection or protocol errors.

## 5. Example: send chat every 5 seconds

This is how a bot can say `hllo` every 5 seconds after it connects:

```js
const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'pterodactyl.home.arpa',
  port: 25565,
  username: 'its_eystreem',
  auth: 'offline',
  version: false
})

bot.on('spawn', () => {
  setInterval(() => {
    bot.chat('hllo')
  }, 5000)
})

bot.on('error', console.log)
bot.on('kicked', console.log)
```

## 6. Notes from research

- Mineflayer docs show `createBot()` is the main API for connecting.
- If `auth` is set to `'microsoft'`, Mineflayer may open a browser login flow and cache tokens.
- `host` and `port` tell the bot where the Minecraft server is.
- Without `version`, Mineflayer guesses the server version automatically.
- For local servers, `auth: 'offline'` is usually the easiest option.

## 7. Why this matters

The bot needs the server address, port, and login info to join the game. Once connected, it can chat, move, dig, and mine using Mineflayer APIs.
