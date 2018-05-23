'use strict'

const mqtt = require('mqtt')
const readline = require('readline')

const Bitmaps = {
  Blank:
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯',
  I:
  '◯◯●●●●◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯●●●●◯◯',
  '❤':
  '◯◯◯◯◯◯◯◯' +
  '◯●●◯●●◯◯' +
  '●●●●●●●◯' +
  '●●●●●●●◯' +
  '◯●●●●●◯◯' +
  '◯◯●●●◯◯◯' +
  '◯◯◯●◯◯◯◯' +
  '◯◯◯◯◯◯◯◯',
  JS:
  '●●●●●●●●' +
  '●●●●●●●●' +
  '●●◯●●◯◯●' +
  '●●◯●◯●●●' +
  '●●◯●●◯●●' +
  '●●◯●●●◯●' +
  '◯◯●●◯◯●●' +
  '●●●●●●●●',
  Nordic:
  '◯●◯◯◯●●◯' +
  '●●●◯●◯●●' +
  '●◯●●◯◯●●' +
  '●◯◯●●◯●●' +
  '●◯◯◯●●●●' +
  '●◯●◯◯●●●' +
  '◯●●●●◯●●' +
  '◯◯●◯◯●●◯',
  J:
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯●●●●◯◯◯' +
  '◯●●●◯◯◯◯',
  ot:
  '◯●●◯◯◯◯◯' +
  '●◯◯●◯◯◯◯' +
  '◯●●◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯●◯◯' +
  '◯◯◯●●●●●' +
  '◯◯◯◯◯●◯◯' +
  '◯◯◯◯◯◯●●',
  B:
  '●●●●●●◯◯' +
  '●●●●●●●◯' +
  '●●◯◯◯◯●●' +
  '●●●●●●●◯' +
  '●●●●●●●◯' +
  '●●◯◯◯◯●●' +
  '●●●●●●●◯' +
  '●●●●●●◯◯',
}

/**
 * Convert a graphical bitmap (like above) made of 64 unicode characters to a list of
 * 8 integers.
 */
const toBitmap = str => str
  .substr(0, 64)
  .split('')
  .map(c => c === '●' ? 1 : 0)
  .reduce((lines, c) => {
    const currentLine = lines[lines.length - 1]
    if (!currentLine || currentLine.length >= 8) {
      lines.push([c])
    } else {
      currentLine.push(c)
    }
    return lines
  }, [])
  .map(line => {
    let int = 0
    line.reverse().forEach((bit, idx) => {
      int = int | (bit << idx)
    })
    return int
  })

// Our display configuration, use the first (blank) Bitmap for all three displays
const icons = [
  0,
  0,
  0
]

// MQTT
console.log('Connecting ...')
const client = mqtt.connect('mqtt://test.mosquitto.org')
client.on('connect', () => {
  console.log('Connected.')
  console.log('Press 1, 2, or 3 ...')

  // Cycle through the available bitmaps when pressing the 1,2,3 keys
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit()
    } else {
      icons[(+key.sequence) - 1] = (icons[(+key.sequence) - 1] + 1) % Object.keys(Bitmaps).length
      const msg = {
        icons: [
          Bitmaps[Object.keys(Bitmaps)[icons[0]]],
          Bitmaps[Object.keys(Bitmaps)[icons[1]]],
          Bitmaps[Object.keys(Bitmaps)[icons[2]]]
        ].map(toBitmap)
      }
      client.publish('espruino-jotb-2018/icons', JSON.stringify(msg))
      console.log(msg)
    }
  })
})
client.on('error', err => {
  console.error(err)
})
client.on('reconnect', () => {
  console.error('reconnecting ...')
})

