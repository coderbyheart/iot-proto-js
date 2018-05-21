'use strict'

/* global digitalWrite LED1 LED2 I2C1 B6 B7 E */

const pn532 = require('PN532')
const http = require('http')
const wifi = require('EspruinoWiFi')

// Config
const SLACK_HOOK = '/services/XXX/YYY/ZZZ'
const WIFI_NAME = 'changeme'
const WIFI_PASSWORD = 'changeme'

// Wifi
let blinkState = 0
let connectingInterval = setInterval(function () {
  blinkState = !blinkState
  digitalWrite(LED2, blinkState)
}, 250)

function connectToWifi (callback) {
  wifi.connect(WIFI_NAME, {password: WIFI_PASSWORD}, function (err) {
    if (err) {
      console.log('Wifi connection error', err)
      setInterval(function () {
        blinkState = !blinkState
        digitalWrite(LED1, blinkState)
      }, 250)
      return callback(err)
    }
    clearInterval(connectingInterval)
    console.log('Connected to Wifi!')
    callback()
  })
}

// NFC
function waitForCard (nfc) {
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

// Slack

function announce (who, locked) {
  const content = JSON.stringify({
    text: who + ' has ' + (locked ? 'left' : 'entered')
  })
  console.log(content)
  http.request({
    host: 'hooks.slack.com',
    port: '443',
    path: SLACK_HOOK,
    protocol: 'https:',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': content.length
    }
  })
    .end(content)
}

// Main
function init () {
  toggleLock()
  connectToWifi(function (err) {
    if (err) return
    // NFC
    I2C1.setup({scl: B6, sda: B7}) // NFC Reader
    const nfc = pn532.connect(I2C1)

    nfc.SAMConfig() // start listening
    setInterval(function () { waitForCard(nfc) }, 1000)
  })
}

E.on('init', init)

init()
