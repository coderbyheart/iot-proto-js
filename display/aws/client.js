'use strict'

// Enter your API Gateway Endpoint
const endpoint = 'https://xxx.execute-api.us-east-1.amazonaws.com/dev/'
// Enter your API Key
const API_KEY = 'changemen'
const fetch = require('node-fetch')

const BitMaps = {
  I:
  '◯◯●●●●◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯●●●●◯◯',
  O:
  '◯◯◯◯◯◯◯◯' +
  '◯◯◯◯◯◯◯◯' +
  '◯◯●●●●◯◯' +
  '◯●●●●●●◯' +
  '◯●●◯◯●●◯' +
  '◯●●◯◯●●◯' +
  '◯●●●●●●◯' +
  '◯◯●●●●◯◯',
  T:
  '●●●●●●●●' +
  '●●●●●●●●' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯' +
  '◯◯◯●●◯◯◯',
  Nordic:
  '◯●◯◯◯●●◯' +
  '●●●◯●◯●●' +
  '●◯●●◯◯●●' +
  '●◯◯●●◯●●' +
  '●◯◯◯●●●●' +
  '●◯●◯◯●●●' +
  '◯●●●●◯●●' +
  '◯◯●◯◯●●◯',
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
  CF:
  '●◯●◯◯●◯●' +
  '◯●●◯◯●●◯' +
  '●●◯●●◯●●' +
  '◯◯●◯◯●◯◯' +
  '◯◯●◯◯●◯◯' +
  '●●◯●●◯●●' +
  '◯●●◯◯●●◯' +
  '●◯●◯◯●◯●'
}

const rotate = str => {
  const w = Math.sqrt(str.length)
  const rotated = []
  str.split('').forEach((s, idx) => {
    const row = w - (idx % w) - 1
    const col = Math.floor(idx / w)
    rotated[row * w + col] = s
  })
  return rotated.join('')
}

fetch(
  `${endpoint}/device/espruino`, {
    method: 'PUT',
    body: `${BitMaps.I}\n${BitMaps['❤']}\n${BitMaps.Nordic}`,
    headers: {
      'x-api-key': API_KEY
    }
  })
  .then(res => {
    console.log(res.status)
    return res.text()
  })
  .then(text => {
    console.log(text)
  })
