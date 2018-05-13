// Settings

const MATRIX_1 = 0x70
const MATRIX_2 = 0x71
const MATRIX_3 = 0x72
const WIFI_NAME = 'changeme'
const WIFI_PASSWORD = 'changeme'

// Create an AWS IoT Thing and enter the details here
const thingId = 'espruino'
// Change the AWS IoT endpoint
const tlsOptions = url.parse('mqtts://xxx.iot.us-east-1.amazonaws.com:8883')
// Paste the private key
tlsOptions.key = atob('MIIEFAxxx3eg==')
// Paste the certificate
tlsOptions.cert = atob('MIIDWxxxmjQ==')
// This is the root CA Certificate: https://docs.aws.amazon.com/iot/latest/developerguide/managing-device-certs.html
tlsOptions.ca = atob('MIIE0zCCA7ugAwIBAgIQGNrRniZ96LtKIVjNzGs7SjANBgkqhkiG9w0BAQUFADCByjELMAkGA1UEBhMCVVMxFzAVBgNVBAoTDlZlcmlTaWduLCBJbmMuMR8wHQYDVQQLExZWZXJpU2lnbiBUcnVzdCBOZXR3b3JrMTowOAYDVQQLEzEoYykgMjAwNiBWZXJpU2lnbiwgSW5jLiAtIEZvciBhdXRob3JpemVkIHVzZSBvbmx5MUUwQwYDVQQDEzxWZXJpU2lnbiBDbGFzcyAzIFB1YmxpYyBQcmltYXJ5IENlcnRpZmljYXRpb24gQXV0aG9yaXR5IC0gRzUwHhcNMDYxMTA4MDAwMDAwWhcNMzYwNzE2MjM1OTU5WjCByjELMAkGA1UEBhMCVVMxFzAVBgNVBAoTDlZlcmlTaWduLCBJbmMuMR8wHQYDVQQLExZWZXJpU2lnbiBUcnVzdCBOZXR3b3JrMTowOAYDVQQLEzEoYykgMjAwNiBWZXJpU2lnbiwgSW5jLiAtIEZvciBhdXRob3JpemVkIHVzZSBvbmx5MUUwQwYDVQQDEzxWZXJpU2lnbiBDbGFzcyAzIFB1YmxpYyBQcmltYXJ5IENlcnRpZmljYXRpb24gQXV0aG9yaXR5IC0gRzUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCvJAgIKXo1nmAMqudLO07cfLw8RRy7K+D+KQL5VwijZIUVJ/XxrcgxiV0i6CqqpkKzj/i5Vbext0uz/o9+B1fs70PbZmIVYc9gDaTY3vjgw2IIPVQT60nKWVSFJuUrjxuf6/WhkcIzSdhDY2pSS9KP6HBRTdGJaXvHcPaz3BJ023tdS1bTlr8Vd6Gw9KIl8q8ckmcY5fQGBO+QueQA5N06tRn/Arr0PO7gi+s3i+z016zy9vA9r911kTMZHRxAy3QkGSGT2RT+rCpSx4/VBEnkjWNHiDxpg8v+R70rfk/Fla4OndTRQ8Bnc+MUCH7lP59zuDMKz10/NIeWiu5T6CUVAgMBAAGjgbIwga8wDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYwbQYIKwYBBQUHAQwEYTBfoV2gWzBZMFcwVRYJaW1hZ2UvZ2lmMCEwHzAHBgUrDgMCGgQUj+XTGoasjY5rw8+AatRIGCx7GS4wJRYjaHR0cDovL2xvZ28udmVyaXNpZ24uY29tL3ZzbG9nby5naWYwHQYDVR0OBBYEFH/TZafC3ey78DAJ80M5+gKvMzEzMA0GCSqGSIb3DQEBBQUAA4IBAQCTJEowX2LP2BqYLz3q3JktvXf2pXkiOOzEp6B4Eq1iDkVwZMXnl2YtmAl+X6/WzChl8gGqCBpH3vn5fJJaCGkgDdk+bW48DW7Y5gaRQBi5+MHt39tBquCWIMnNZBU4gcmU7qKEKQsTb47bDN0lAtukixlE0kF6BWlKWE9gyn6CagsCqiUXObXbf+eEZSqVir2G3l6BFoMtEMze/aiCKm0oHw0LxOXnGiYZ4fQRbxC1lfznQgUy286dUV4otp6F01vvpX1FQHKOtw5rDgb7MzVIcbidJ4vEZV8NhnacRHr2lVz2XTIIM6RUthg/aFzyQkqFOFSDX9HoLPKsEdao7WNq')

// Modules

const wifi = require('EspruinoWiFi')

// Matrix

I2C1.setup({scl: B8, sda: B9})

/**
 * Rotates an 8-bit binary value right one bit.
 *
 * Example: 0b00000011 -> 0b10000001
 *
 * @param value. 8-bit unsidgned integer (0-127).
 * @returns {uint8} rotated value
 */
const rotate = function (value) {
  // Shift everything right 1 bit
  // Then shift last bit over if switched on it'll switch on 2^7
  const rotated = (value >> 1) | (value << 7)
  // return the 8-bit value
  return new Uint8Array([rotated])[0]
}

const drawIcon = function (display, bitmap) {
  const doubled = [];
  ([].concat(bitmap)).reverse().forEach(function (line) {
    doubled.push(line, line)
  })
  I2C1.writeTo(display, 0, new Uint8Array(doubled.map(rotate)))
}

// LEDs
let led1Blink
let led1State = false

// Main

let mqtt

const mqttHost = tlsOptions.host
const mqttOptions = {
  client_id: thingId,
  keep_alive: 60,
  port: tlsOptions.port,
  clean_session: true
}

const onInit = function () {
  // LEDs
  digitalWrite(LED1, 0)
  led1Blink = setInterval(function () {
    led1State = !led1State
    digitalWrite(LED2, led1State)
  }, 500)
  memUsage();
  // Matrix
  [MATRIX_1, MATRIX_2, MATRIX_3].forEach(function (display) {
    I2C1.writeTo(display, 0x21) // turn on oscillator
    I2C1.writeTo(display, 0x81) // disp on
    I2C1.writeTo(display, 0xE0 | 0) // 0-15
    I2C1.writeTo(display, 0, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
  })
  // Connect to wifi
  wifi.connect(WIFI_NAME, {password: WIFI_PASSWORD}, function (err) {
    if (err) {
      console.log('Wifi connection error', err)
      if (led1Blink) {
        clearInterval(led1Blink)
      }
      digitalWrite(LED1, 1)
      digitalWrite(LED2, 0)
      return
    }
    console.log('Connected to Wifi!')
    if (led1Blink) {
      clearInterval(led1Blink)
    }
    led1Blink = setInterval(function () {
      led1State = !led1State
      digitalWrite(LED2, led1State)
    }, 250)
    memUsage()
    // Connect to IoT
    require('tls')
      .connect(tlsOptions, function (res) {
        console.log('tls connected')
        delete tlsOptions.ca
        delete tlsOptions.cert
        delete tlsOptions.key

        const baseShadowTopic = '$aws/things/' + thingId + '/shadow'

        mqtt = require('MQTT').create(mqttHost, mqttOptions)
        mqtt.on('connected', function () {
          if (led1Blink) {
            clearInterval(led1Blink)
          }
          digitalWrite(LED2, 1)
          console.log('connected to AWS IoT Service...')
          memUsage()
          console.log(baseShadowTopic)
          mqtt.subscribe(baseShadowTopic + '/update/delta')
          setTimeout(function () {
            // Report empty state, force delta
            mqtt.publish(baseShadowTopic + '/update', '{"state":{"reported":{"icon":null}}}')
          }, 250)
          // mqtt.subscribe('devices/' + thingId);
          // mqtt.subscribe(thingId);
          // mqtt.publish(thingId, JSON.stringify({message: 'Hello from ' + thingId}));
        })
        mqtt.on('disconnected', function () {
          console.log('disconnected from AWS IoT Service...')
          if (led1Blink) {
            clearInterval(led1Blink)
          }
          digitalWrite(LED1, 1)
          digitalWrite(LED2, 0)
        })
        mqtt.on('publish', function (pub) {
          console.log('\nNew message received: ')
          console.log('topic: ' + pub.topic)
          console.log('message: ' + pub.message)
          const m = JSON.parse(pub.message)
          if (m.state) {
            if (m.state.icon) {
              drawIcon(MATRIX_1, m.state.icon[0])
              drawIcon(MATRIX_2, m.state.icon[1])
              drawIcon(MATRIX_3, m.state.icon[2])
            }
            mqtt.publish(baseShadowTopic + '/update', JSON.stringify({state: {reported: m.state}}))
          }
        })

        setTimeout(function () {
          console.log('Connecting to MQTT')
          console.log(mqttHost, mqttOptions)
          mqtt.connect(res)
        }, 1000)
      })
  })
}

const memUsage = function () {
  const mem = process.memory()
  console.log(mem)
  console.log('Mem usage: ', Math.round((mem.usage / mem.total) * 100))
}

onInit()
