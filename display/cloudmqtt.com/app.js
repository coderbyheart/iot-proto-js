// Settings

const MATRIX_1 = 0x70;
const MATRIX_2 = 0x71;
const MATRIX_3 = 0x72;
const WIFI_NAME = 'changeme';
const WIFI_PASSWORD = 'changeme';
const THING_ID = 'espruino-jotb-2018'; // change me, maybe

// MQTT client settings for connecting to cloudmqtt.com
const MQTT_HOST = 'xx.cloudmqtt.com';
const MQTT_USERNAME = 'changeme';
const MQTT_PASSWORD = 'changeme';
const MQTT_PORT = 16385;

// Modules
const wifi = require('EspruinoWiFi');

// Matrix
I2C1.setup({scl: B8, sda: B9});

/**
 * Rotates an 8-bit binary value right one bit.
 *
 * Example: 0b00000011 -> 0b10000001
 *
 * @param value. 8-bit unsidgned integer (0-127).
 * @returns {uint8} rotated value
 */
const rotate = function (value) {
  //Shift everything right 1 bit
  //Then shift last bit over if switched on it'll switch on 2^7
  const rotated = (value >> 1) | (value << 7);
  //return the 8-bit value
  return new Uint8Array([rotated])[0];
};

const drawIcon = function (display, bitmap){
  const doubled = [];
  ([].concat(bitmap)).reverse().forEach(function(line) {
    doubled.push(line, line);
  });
  I2C1.writeTo(display, 0, new Uint8Array(doubled.map(rotate)));
};

// LEDs
let led1Blink;
let led1State = false;

// Main

let mqtt;

const mqttOptions = {
  client_id: THING_ID,
  keep_alive: 60,
  port: MQTT_PORT,
  clean_session: true,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
};

const init = function() {
  // LEDs
  digitalWrite(LED1, 0);
  led1Blink = setInterval(function () {
    led1State = !led1State;
    digitalWrite(LED2, led1State);
  }, 500);
  // Matrix
  [MATRIX_1, MATRIX_2, MATRIX_3].forEach(function(display) {
    I2C1.writeTo(display, 0x21); // turn on oscillator
    I2C1.writeTo(display, 0x81); // disp on
    I2C1.writeTo(display, 0xE0 | 0); // 0-15
    I2C1.writeTo(display, 0, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  });
  // Connect to wifi
  wifi.connect(WIFI_NAME, {password: WIFI_PASSWORD}, function (err) {
    if (err) {
      console.log('Wifi connection error', err);
      if (led1Blink) {
        led1Blink = clearInterval(led1Blink);
      }
      digitalWrite(LED1, 1);
      digitalWrite(LED2, 0);
      return;
    }
    console.log('Connected to Wifi!');
    if (led1Blink) {
      led1Blink = clearInterval(led1Blink);
    }
    led1Blink = setInterval(function () {
      led1State = !led1State;
      digitalWrite(LED2, led1State);
    }, 250);

    const baseShadowTopic = THING_ID;

    mqtt = require('MQTT').create(MQTT_HOST, mqttOptions);
    mqtt.on('connected', function () {
      if (led1Blink) {
        led1Blink = clearInterval(led1Blink);
      }
      digitalWrite(LED2, 1);
      console.log('connected to MQTT...');
      console.log(baseShadowTopic + '/icons');
      mqtt.subscribe(baseShadowTopic + '/icons');
    });
    mqtt.on('disconnected', function () {
      console.log('disconnected from MQTT ...');
      if (led1Blink) {
        led1Blink = clearInterval(led1Blink);
      }
      digitalWrite(LED1, 1);
      digitalWrite(LED2, 0);
    });
    mqtt.on('publish', function (pub) {
      console.log('\nNew message received: ');
      console.log('topic: ' + pub.topic);
      console.log('message: ' + pub.message);
      const m = JSON.parse(pub.message);
      if (m && m.icons) {
        drawIcon(MATRIX_1, m.icons[0]);
        drawIcon(MATRIX_2, m.icons[1]);
        drawIcon(MATRIX_3, m.icons[2]);
      }
    });

    setTimeout(function () {
      console.log('Connecting to MQTT');
      console.log(MQTT_HOST, mqttOptions);
      mqtt.connect();
    }, 1000);
  });
};

init();
