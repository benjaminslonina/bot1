# bot1

A simple Minecraft bot that connects to the local Pterodactyl server, says "hllo", moves forward every 5 seconds, jumps over blocks in front, attacks nearby mobs or players, and automatically equips armor found in its inventory.

## Setup

Install Mineflayer in this project first:

```bash
npm install mineflayer
```

## Run the bot

```bash
node hello-bot.js
```

## Watch the bot

If you want the bot to keep an eye on itself and restart if it stops, run:

```bash
npm run watch
```

## Custom host

If the hostname does not resolve, use the server IP directly:

```bash
MC_HOST=192.168.0.6 node hello-bot.js
```

You can also override the port and username with:

```bash
MC_PORT=25565 MC_USERNAME=its_eystreem MC_HOST=192.168.0.6 node hello-bot.js
```

If you want the bot to use a real Minecraft skin, use a Microsoft account login:

```bash
MC_AUTH=microsoft MC_USERNAME=its_eystreem MC_HOST=192.168.0.6 node hello-bot.js
```

If that account uses a password login, you can also add a password:

```bash
MC_AUTH=microsoft MC_USERNAME=its_eystreem MC_PASSWORD=your-password MC_HOST=192.168.0.6 node hello-bot.js
```

