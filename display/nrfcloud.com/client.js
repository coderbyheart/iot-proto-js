const {fetch} = require('fetch-ponyfill')()
const readline = require('readline')
const debounce = require('lodash.debounce')

const apiKey = 'YOUR_API_KEY' // (1)
const deviceId = 'c0ec4d2f-30fe-4a9b-9c80-ffec973ea61d' // (2)
const endpoint = 'https://api.nrfcloud.com/v1'

const Bitmaps = {
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
  cota:
    '◯●●◯◯●◯◯' +
    '●◯◯◯●◯●◯' +
    '◯●●◯◯●◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '●●●◯◯●◯◯' +
    '◯●◯◯●●●◯' +
    '◯●◯◯●◯●◯' +
    '◯◯◯◯◯◯◯◯',
  delk:
    '●●◯◯●●●◯' +
    '●◯●◯●●◯◯' +
    '●●◯◯●●●◯' +
    '◯◯◯◯◯◯◯◯' +
    '●◯◯◯●◯●◯' +
    '●◯◯◯●●◯◯' +
    '●●●◯●◯●◯' +
    '◯◯◯◯◯◯◯◯',
  HH:
    '◯◯●◯●◯◯◯' +
    '◯◯●●●◯◯◯' +
    '◯◯●◯●◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯●◯●◯◯◯' +
    '◯◯●●●◯◯◯' +
    '◯◯●◯●◯◯◯' +
    '◯◯◯◯◯◯◯◯',
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

// Our display configuration
const icons = [
  -1,
  -1,
  -1
]

const updateDisplay = debounce(async idx => {
  const w = await fetch(`${endpoint}/device/${deviceId}/state`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      desired: {
        [`icon${idx + 1}`]: toBitmap(Bitmaps[Object.keys(Bitmaps)[icons[idx]]])
      }
    })
  })
  if (w.status >= 200 && w.status < 300) {
  } else {
    const error = new Error(w.statusText)
    error.response = w
    throw error
  }
}, 400)

// Cycle through the available bitmaps when pressing the 1,2,3 keys
console.log('Press 1, 2, or 3 ...')
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
process.stdin.on('keypress', async (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit()
  } else {
    const idx = (+key.sequence) - 1
    icons[idx] = (icons[idx] + 1) % Object.keys(Bitmaps).length
    updateDisplay(idx)
  }
})
