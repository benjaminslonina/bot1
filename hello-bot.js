// hello-bot.js
// This bot connects to the local Minecraft server and says "hllo" every 5 seconds.
// Run it with: node hello-bot.js
// Or override host with: MC_HOST=192.168.0.6 node hello-bot.js

const mineflayer = require('mineflayer')
const Vec3 = require('vec3')

const host = process.env.MC_HOST || '192.168.0.6'
const port = parseInt(process.env.MC_PORT, 10) || 25565
const username = process.env.MC_USERNAME || 'its_eystreem'
const password = process.env.MC_PASSWORD || undefined
const auth = process.env.MC_AUTH || (password ? 'microsoft' : 'offline')
const loopDelayMs = Math.max(750, parseInt(process.env.BOT_LOOP_DELAY_MS || '1000', 10))
const moveDurationMs = Math.max(200, Math.min(350, Math.floor(loopDelayMs / 3)))

const botOptions = {
  host,
  port,
  username,
  auth,
  version: false
}

if (password) {
  botOptions.password = password
}

if (auth === 'microsoft' && !password) {
  console.log('Microsoft auth selected. Mineflayer will try the browser sign-in flow if needed.')
}

const bot = mineflayer.createBot(botOptions)

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

function getFrontBlockName () {
  const frontPosition = getFrontBlockPosition()
  const frontBlock = bot.blockAt(frontPosition)
  return frontBlock ? frontBlock.name : 'air'
}

const foodItems = [
  'cooked_beef',
  'cooked_porkchop',
  'cooked_chicken',
  'bread',
  'apple',
  'cooked_mutton',
  'baked_potato',
  'cooked_cod',
  'cooked_salmon',
  'pumpkin_pie'
]

const animalTypes = ['cow', 'pig', 'sheep', 'chicken', 'rabbit', 'mooshroom']

function getFoodItem () {
  for (const itemName of foodItems) {
    const itemType = bot.registry.itemsByName[itemName]
    if (!itemType) continue
    const item = bot.inventory.findInventoryItem(itemType.id, null)
    if (item) return item
  }
  return null
}

function getNearestAnimal (range = 12) {
  if (!bot.entity || !bot.entity.position) return null

  return bot.nearestEntity((entity) => {
    if (!entity || entity === bot.entity || !entity.position) return false
    if (entity.type !== 'mob') return false
    if (!animalTypes.includes(entity.name)) return false
    const distance = entity.position.distanceTo(bot.entity.position)
    return distance <= range
  })
}

async function eatFood () {
  const foodItem = getFoodItem()
  if (!foodItem) return false

  try {
    await bot.equip(foodItem, 'hand')
    console.log(`Eating ${foodItem.name}`)
    await bot.consume()
    return true
  } catch (err) {
    console.error('Failed to eat food:', err)
    return false
  }
}

const blockPlaceItems = ['cobblestone', 'dirt', 'stone', 'oak_planks', 'spruce_planks', 'birch_planks', 'gravel', 'sand', 'sandstone', 'stone_bricks', 'andesite', 'diorite', 'granite']
const swordItems = ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'golden_sword', 'wooden_sword']
let isPaused = false
let runOneBlock = false
let runLeftBlock = false
let runRightBlock = false
let runBackBlock = false

function isPlaceableBlockName (name) {
  const keywords = [
    'dirt', 'cobblestone', 'stone', 'planks', 'gravel', 'sand', 'sandstone',
    'stone_bricks', 'andesite', 'diorite', 'granite', 'brick', 'concrete',
    'terracotta', 'glass', 'clay', 'mossy', 'netherrack', 'deepslate', 'basalt',
    'obsidian', 'end_stone', 'nether_brick', 'prismarine', 'quartz', 'mud',
    'wood', 'log'
  ]
  return keywords.some((keyword) => name.includes(keyword))
}

function getNearestPlayer () {
  if (!bot.entity || !bot.entity.position) return null

  return bot.nearestEntity((entity) => {
    if (!entity || entity === bot.entity || !entity.position) return false
    return entity.type === 'player'
  })
}

function getNearestBed (maxDistance = 50) {
  if (!bot.entity || !bot.entity.position) return null
  return bot.findBlock({
    matching: (block) => bot.isABed(block),
    maxDistance
  })
}

function isNightTime () {
  return bot.time && !bot.time.isDay
}

async function sleepAtNearestBed () {
  if (bot.isSleeping) return true

  const bedBlock = getNearestBed(50)
  if (!bedBlock) return false

  const distance = bedBlock.position.distanceTo(bot.entity.position)
  if (distance > 2.5) {
    try {
      await bot.lookAt(bedBlock.position.offset(0, 0.5, 0), true)
    } catch (err) {
      console.error('Failed to look at bed:', err)
    }

    bot.setControlState('forward', true)
    setTimeout(() => {
      bot.setControlState('forward', false)
    }, 400)
    console.log(`Night: moving toward bed (${distance.toFixed(1)} blocks)`)
    return false
  }

  bot.clearControlStates()

  try {
    await bot.lookAt(bedBlock.position.offset(0, 0.5, 0), true)
  } catch (err) {
    console.error('Failed to look at bed:', err)
  }

  try {
    await bot.sleep(bedBlock)
    console.log('Night: sleeping in nearest bed')
    return true
  } catch (err) {
    console.error('Failed to sleep in bed:', err)
    return false
  }
}

function getBlockItem () {
  for (const itemName of blockPlaceItems) {
    const itemType = bot.registry.itemsByName[itemName]
    if (!itemType) continue
    const item = bot.inventory.findInventoryItem(itemType.id, null)
    if (item) return item
  }

  for (const item of bot.inventory.items()) {
    if (!item || !item.name) continue
    if (isPlaceableBlockName(item.name)) return item
  }

  return null
}

function getSwordItem () {
  for (const itemName of swordItems) {
    const itemType = bot.registry.itemsByName[itemName]
    if (!itemType) continue
    const item = bot.inventory.findInventoryItem(itemType.id, null)
    if (item) return item
  }
  return null
}

async function equipSword () {
  const swordItem = getSwordItem()
  if (!swordItem) return false

  try {
    await bot.equip(swordItem, 'hand')
    return true
  } catch (err) {
    console.error('Failed to equip sword:', err)
    return false
  }
}

async function placeBlockUnder () {
  const blockItem = getBlockItem()
  if (!blockItem) return false

  try {
    await bot.equip(blockItem, 'hand')
  } catch (err) {
    console.error('Failed to equip block item:', err)
    return false
  }

  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0)) || bot.blockAt(bot.entity.position.offset(0, -2, 0))
  if (!referenceBlock) return false

  try {
    await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0))
    console.log('Placed block below to climb up')
    bot.setControlState('forward', true)
    bot.setControlState('jump', true)
    await new Promise(resolve => setTimeout(resolve, 150))
    bot.setControlState('jump', false)
    setTimeout(() => {
      bot.setControlState('forward', false)
    }, 150)
    return true
  } catch (err) {
    console.error('Failed to place block:', err)
    return false
  }
}

async function attackTarget (target) {
  if (!target || !target.position || !bot.entity || !bot.entity.position) return

  const lookPoint = target.position.offset(0, (target.height || 1.6) * 0.75, 0)
  const distance = target.position.distanceTo(bot.entity.position)

  try {
    await bot.lookAt(lookPoint, true)
    await new Promise(resolve => setTimeout(resolve, 80))

    if (distance > 2.4) {
      console.log(`Target too far to hit (${distance.toFixed(2)}). Moving closer...`)
      bot.setControlState('forward', true)
      await new Promise(resolve => setTimeout(resolve, 160))
      bot.setControlState('forward', false)
      return
    }

    const equipped = await equipSword()
    if (!equipped) {
      console.log('No sword found, attacking with hand')
    }

    bot.attack(target, true)
  } catch (err) {
    console.error('Failed to look at or attack target:', err)
  }
}

function getInventoryArmorItem (itemName) {
  const itemType = bot.registry.itemsByName[itemName]
  if (!itemType) return null
  return bot.inventory.items().find((inventoryItem) => inventoryItem && inventoryItem.name === itemName) || null
}

async function equipArmor () {
  const armorSets = [
    {
      destination: 'feet',
      items: ['netherite_boots', 'diamond_boots', 'iron_boots', 'chainmail_boots', 'golden_boots', 'leather_boots']
    },
    {
      destination: 'legs',
      items: ['netherite_leggings', 'diamond_leggings', 'iron_leggings', 'chainmail_leggings', 'golden_leggings', 'leather_leggings']
    },
    {
      destination: 'torso',
      items: ['netherite_chestplate', 'diamond_chestplate', 'iron_chestplate', 'chainmail_chestplate', 'golden_chestplate', 'leather_chestplate']
    },
    {
      destination: 'head',
      items: ['netherite_helmet', 'diamond_helmet', 'iron_helmet', 'chainmail_helmet', 'golden_helmet', 'leather_helmet']
    }
  ]

  for (const armor of armorSets) {
    for (const itemName of armor.items) {
      const item = getInventoryArmorItem(itemName)
      if (!item) continue

      try {
        await bot.equip(item, armor.destination)
        console.log(`Equipped ${itemName} in ${armor.destination}`)
        break
      } catch (err) {
        console.log(`Could not equip ${itemName} in ${armor.destination}: ${err.message || err}`)
      }
    }
  }
}

bot.once('spawn', () => {
  console.log(`Bot connected to ${host}:${port} as ${username}`)
  setTimeout(() => {
    equipArmor().catch((err) => console.error('Armor equip failed:', err))
  }, 1000)

  bot.on('inventory', () => {
    setTimeout(() => {
      equipArmor().catch((err) => console.error('Armor equip failed:', err))
    }, 300)
  })

  bot.on('chat', (username, message) => {
    if (!username) return
    const playerName = String(username).toLowerCase()
    const msg = String(message).trim().toLowerCase()
    if (!['benjamin', 'benimin', 'ben'].some((name) => playerName.includes(name))) return

    console.log(`Chat command from ${username}: ${message}`)
    if (msg === 's') {
      isPaused = true
      runOneBlock = false
      bot.clearControlStates()
      console.log('Paused by chat command')
    }

    if (msg === 'ss') {
      isPaused = false
      runOneBlock = false
      runLeftBlock = false
      runRightBlock = false
      runBackBlock = false
      bot.clearControlStates()
      console.log('Resumed normal behavior')
    }

    if (msg === 'f') {
      isPaused = true
      runOneBlock = true
      runLeftBlock = false
      runRightBlock = false
      runBackBlock = false
      console.log('Run one block commanded')
    }

    if (msg === 'l') {
      isPaused = true
      runOneBlock = false
      runLeftBlock = true
      runRightBlock = false
      runBackBlock = false
      console.log('Run one block left commanded')
    }

    if (msg === 'r') {
      isPaused = true
      runOneBlock = false
      runLeftBlock = false
      runRightBlock = true
      runBackBlock = false
      console.log('Run one block right commanded')
    }

    if (msg === 'b') {
      isPaused = true
      runOneBlock = false
      runLeftBlock = false
      runRightBlock = false
      runBackBlock = true
      console.log('Run one block backward commanded')
    }
  })

  bot.on('sleep', (entity) => {
    if (entity === bot.entity) {
      console.log('Bot is now sleeping in a bed')
    }
  })

  bot.on('wake', (entity) => {
    if (entity === bot.entity) {
      console.log('Bot woke up from a bed')
    }
  })

  let botLoopRunning = false
  let nextLoopDelay = loopDelayMs
  let lastFrontBlockName = ''

  async function botLoop () {
    if (botLoopRunning) return
    botLoopRunning = true
    nextLoopDelay = loopDelayMs

    try {
      if (!bot.entity || !bot.entity.position) return

      const currentFrontBlockName = getFrontBlockName()
      if (currentFrontBlockName !== lastFrontBlockName) {
        console.log(`Front block: ${currentFrontBlockName}`)
        lastFrontBlockName = currentFrontBlockName
      }

      if (runOneBlock) {
        bot.clearControlStates()
        bot.setControlState('forward', true)
        setTimeout(() => {
          bot.setControlState('forward', false)
          runOneBlock = false
          if (isPaused) bot.clearControlStates()
        }, moveDurationMs)
        return
      }

      if (runLeftBlock) {
        bot.clearControlStates()
        bot.setControlState('left', true)
        setTimeout(() => {
          bot.setControlState('left', false)
          runLeftBlock = false
          if (isPaused) bot.clearControlStates()
        }, moveDurationMs)
        return
      }

      if (runRightBlock) {
        bot.clearControlStates()
        bot.setControlState('right', true)
        setTimeout(() => {
          bot.setControlState('right', false)
          runRightBlock = false
          if (isPaused) bot.clearControlStates()
        }, moveDurationMs)
        return
      }

      if (runBackBlock) {
        bot.clearControlStates()
        bot.setControlState('back', true)
        setTimeout(() => {
          bot.setControlState('back', false)
          runBackBlock = false
          if (isPaused) bot.clearControlStates()
        }, moveDurationMs)
        return
      }

      if (isPaused) {
        bot.clearControlStates()
        return
      }

      if (isNightTime()) {
        if (bot.isSleeping) {
          return
        }

        const sleeping = await sleepAtNearestBed()
        if (!sleeping) {
          bot.clearControlStates()
          return
        }
        return
      }

      if (bot.isSleeping) {
        try {
          await bot.wake()
          console.log('Daytime: woke up from bed')
        } catch (err) {
          console.error('Failed to wake up:', err)
        }
        return
      }

      const hungry = bot.food <= 2
      if (hungry) {
        const ate = await eatFood()
        if (ate) return

        const animal = getNearestAnimal(12)
        if (animal) {
          const name = animal.name || animal.type
          const distance = animal.position.distanceTo(bot.entity.position)
          const lookPoint = animal.position.offset(0, (animal.height || 1.0) * 0.75, 0)

          try {
            await bot.lookAt(lookPoint, true)
          } catch (err) {
            console.error('Failed to look at animal:', err)
          }

          if (distance > 2.4) {
            console.log(`Hungry: moving toward animal ${name} (${distance.toFixed(2)} blocks)`)
            bot.setControlState('forward', true)
            const frontBlock = bot.blockAt(getFrontBlockPosition())
            if (frontBlock) {
              bot.setControlState('jump', true)
              setTimeout(() => {
                bot.setControlState('jump', false)
              }, 500)
            }
          } else {
            bot.setControlState('forward', false)
            console.log(`Hungry: attacking animal ${name}`)
            await attackTarget(animal)
          }
          return
        }
      }

      const target = getNearestPlayer()

      if (target) {
        const name = target.username || target.name || target.type
        const distance = target.position.distanceTo(bot.entity.position)
        const heightDiff = target.position.y - bot.entity.position.y
        const lookPoint = target.position.offset(0, (target.height || 1.6) * 0.75, 0)

        try {
          await bot.lookAt(lookPoint, true)
        } catch (err) {
          console.error('Failed to look at player:', err)
        }

        if (heightDiff > 1.2 && distance <= 6) {
          console.log(`Player ${name} is high above. Building up to reach them.`)
          bot.setControlState('forward', false)
          const built = await placeBlockUnder()
          if (!built) {
            bot.setControlState('jump', true)
            setTimeout(() => {
              bot.setControlState('jump', false)
            }, 250)
          }
          nextLoopDelay = loopDelayMs
        } else if (distance > 2.4) {
          console.log(`Moving toward player ${name} (${distance.toFixed(2)} blocks)`)
          bot.setControlState('forward', true)
          const frontBlock = bot.blockAt(getFrontBlockPosition())
          if (frontBlock) {
            bot.setControlState('jump', true)
            setTimeout(() => {
              bot.setControlState('jump', false)
            }, 500)
          }
        } else {
          bot.setControlState('forward', false)
          console.log(`Attacking ${name}`)
          await attackTarget(target)
        }
      } else {
        bot.setControlState('forward', false)
      }
    } catch (err) {
      console.error('Interval loop error:', err)
    } finally {
      botLoopRunning = false
      setTimeout(botLoop, nextLoopDelay)
    }
  }

  botLoop()
})

bot.on('error', (err) => {
  console.error('Bot error:', err)
})

bot.on('kicked', (reason) => {
  console.error('Bot was kicked:', reason)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})
