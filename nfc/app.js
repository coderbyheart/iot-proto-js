// Wifi
const wifi = require('EspruinoWiFi')
const WIFI_NAME = 'changeme'
const WIFI_PASSWORD = 'changeme'

// Slack
const SLACK_HOOK_PATH = '/services/xxx/xxx/xxx'

let blinkState = 0
let connected = false
let connectingInterval = setInterval(function () {
  blinkState = !blinkState
  digitalWrite(LED2, blinkState)
}, 250)

wifi.connect(WIFI_NAME, {password: WIFI_PASSWORD}, function (err) {
  if (err) {
    console.log('Wifi connection error', err)
    setInterval(function () {
      blinkState = !blinkState
      digitalWrite(LED1, blinkState)
    }, 250)
    return
  }
  clearInterval(connectingInterval)
  console.log('Connected to Wifi!')
  connected = true
  toggleLock()

  // NFC
  I2C1.setup({scl: B6, sda: B7}) // NFC Reader

  var nfc = require('PN532').connect(I2C1)

  nfc.SAMConfig() // start listening
  function waitForCard () {
    // console.log("Waiting for card...");
    nfc.findCards(function (card) {
      const id = JSON.stringify(card)
      if (id === '[4,227,23,119,179,170,0]') { // Nordic
        let locked = toggleLock()
        announce('Markus', locked)
      } else if (id === '[4,51,125,71,221,250,0]') {
        let locked = toggleLock()
        announce('Ivan', locked)
      } else {
        console.log('Card not recognized:', id)
      }
    })
  }

  setInterval(waitForCard, 1000)
})

// Logic

let locked = true

function toggleLock () {
  locked = !locked
  console.log(locked ? 'locked' : 'unlocked')
  if (locked) {
    digitalWrite(LED1, 1)
    digitalWrite(LED2, 0)
  } else {
    digitalWrite(LED1, 0)
    digitalWrite(LED2, 1)
  }
  return locked
}

const http = require('http')

function announce (who, locked) {
  const content = JSON.stringify({
    text: who + ' has ' + (locked ? 'left' : 'entered')
  })
  console.log(content)
  if (!connected) {
    console.log('Announce: not connected.')
    return
  }
  http.request({
    host: 'hooks.slack.com',
    port: '443',
    path: SLACK_HOOK_PATH,
    protocol: 'https:',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': content.length
    }
  })
    .end(content)
}
