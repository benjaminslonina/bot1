# bot1

A simple Minecraft bot that connects to the local Pterodactyl server and says "hllo" every 5 seconds.

## Setup

Install Mineflayer in this project first:

```bash
npm install mineflayer
```

## Run the bot

```bash
node hello-bot.js
```

## Custom host

If the hostname does not resolve, use the server IP directly:

```bash
MC_HOST=192.168.0.6 node hello-bot.js
```

You can also override the port and username with:

```bash
MC_PORT=25565 MC_USERNAME=BotName MC_HOST=192.168.0.6 node hello-bot.js
```

