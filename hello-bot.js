// hello-bot.js
// This bot connects to the local Minecraft server and says "hllo" every 5 seconds.
// Run it with: node hello-bot.js
// Or override host with: MC_HOST=192.168.0.6 node hello-bot.js

const mineflayer = require('mineflayer')
const Vec3 = require('vec3')

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

function getFrontBlockPosition () {
  const yaw = bot.entity.yaw
  const dx = -Math.sin(yaw)
  const dz = Math.cos(yaw)
  const stepX = Math.round(dx)
  const stepZ = Math.round(dz)
  const position = bot.entity.position
  const blockX = Math.round(position.x) + stepX
  const blockY = Math.floor(position.y)
  const blockZ = Math.round(position.z) + stepZ
  return new Vec3(blockX, blockY, blockZ)
}

function getNearestTarget (range = 6) {
  let nearest = null
  let nearestDistance = Infinity

  for (const entityId in bot.entities) {
    const entity = bot.entities[entityId]
    if (!entity || entity === bot.entity || !entity.position) continue
    if (entity.type !== 'mob' && entity.type !== 'player') continue

    const distance = entity.position.distanceTo(bot.entity.position)
    if (distance < range && distance < nearestDistance) {
      nearestDistance = distance
      nearest = entity
    }
  }

  return nearest
}

function getInventoryArmorItem (itemName) {
  const itemType = bot.registry.itemsByName[itemName]
  if (!itemType) return null
  return bot.inventory.findInventoryItem(itemType.id, null)
}

function equipArmor () {
  const armorSets = [
    {
      destination: 'boots',
      items: ['diamond_boots', 'iron_boots', 'chainmail_boots', 'golden_boots', 'leather_boots']
    },
    {
      destination: 'leggings',
      items: ['diamond_leggings', 'iron_leggings', 'chainmail_leggings', 'golden_leggings', 'leather_leggings']
    },
    {
      destination: 'chestplate',
      items: ['diamond_chestplate', 'iron_chestplate', 'chainmail_chestplate', 'golden_chestplate', 'leather_chestplate']
    },
    {
      destination: 'helmet',
      items: ['diamond_helmet', 'iron_helmet', 'chainmail_helmet', 'golden_helmet', 'leather_helmet']
    }
  ]

  for (const armor of armorSets) {
    for (const itemName of armor.items) {
      const item = getInventoryArmorItem(itemName)
      if (item) {
        bot.equip(item, armor.destination)
          .then(() => {
            console.log(`Equipped ${itemName} in ${armor.destination}`)
          })
          .catch(() => {})
        break
      }
    }
  }
}

bot.once('spawn', () => {
  console.log(`Bot connected to ${host}:${port} as ${username}`)
  equipArmor()

  setInterval(() => {
    bot.chat('hllo')
    equipArmor()
    const target = getNearestTarget(6)

    if (target) {
      const name = target.username || target.name || target.type
      console.log(`Attacking ${name}`)
      bot.attack(target)
      return
    }

    const frontBlock = bot.blockAt(getFrontBlockPosition())

    if (frontBlock) {
      console.log('Block detected in front, jumping over it')
      bot.setControlState('jump', true)
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('jump', false)
      }, 500)
      setTimeout(() => {
        bot.setControlState('forward', false)
      }, 1000)
    } else {
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
      }, 1000)
    }
  }, 5000)
})

bot.on('error', (err) => {
  console.error('Bot error:', err)
})

bot.on('kicked', (reason) => {
  console.error('Bot was kicked:', reason)
})
