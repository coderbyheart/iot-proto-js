var WIFI_NAME = "your WiFi SSID";
var WIFI_OPTIONS = { password : "changeme" };

// Change the AWS IoT endpoint
const tlsOptions = url.parse('mqtts://xxxx.iot.us-east-1.amazonaws.com:8883'); // (1)

// Create an AWS IoT Thing and enter the details here
const thingId = 'c0ec4d2f-30fe-4a9b-9c80-ffec973ea61d'; // (2)

var wifi;

// ============================================================================
//                                                         Certificate Handling

// flash memory module
var flash = require("Flash");
// The address of the first free area of flash memory available
var addr = flash.getFree()[0].addr;

/* This writes data to flash, and returns a 'memoryArea' -
a reference to the actual bytes in flash*/
function fwrite(data) {
  var len = data.length;
  while (data.length&3) data+="\xFF";
  var a = addr;
  flash.write(data, addr);
  addr += data.length;
  return E.memoryArea(a,len);
}

// Our certificates/etc
var okey, ocert, oca;

/* Now erase all data in our flash page, and write the keys one at a time. So we don't mess up our
code upload by blocking Espruino, we'll do each one after a timeout. */
setTimeout(function() {
  // Erase all data in that flash page
  flash.erasePage(addr);
}, 500);
setTimeout(function() {
  console.log("Saving privateKey");
  okey = fwrite( atob("MIIEow...")); // (3)
}, 1000);
setTimeout(function() {
  console.log("Saving certificate");
  ocert = fwrite( atob("MIIDW...")); // (4)
}, 1500);
setTimeout(function() {
  console.log("Saving ca");
  // This is the root CA Certificate (RSA 2048 bit key: Amazon Root CA 1): https://docs.aws.amazon.com/iot/latest/developerguide/managing-device-certs.html
  oca = fwrite( atob("MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsFADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTELMAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJvb3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXjca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qwIFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQmjgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUAA4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDIU5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUsN+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vvo/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpyrqXRfboQnoZsG4q5WTP468SQvvG5"));
  console.log("Done!");
}, 2000);

// ============================================================================

// Matrix

/**
 * Rotates an 8-bit binary value right one bit.
 *
 * Example: 0b00000011 -> 0b10000001
 *
 * @param value. 8-bit unsidgned integer (0-127).
 * @returns {uint8} rotated value
 */
const rotate = function (value) {
  "compiled";
  // Shift everything right 1 bit
  // Then shift last bit over if switched on it'll switch on 2^7
  const rotated = (value >> 1) | (value << 7);
  // return the 8-bit value
  return new Uint8Array([rotated])[0];
};

const drawIcon = function (display, bitmap) {
  "compiled";
  const doubled = [];
  ([].concat(bitmap)).reverse().forEach(function (line) {
    doubled.push(line, line);
  });
  I2C1.writeTo(display, 0, new Uint8Array(doubled.map(rotate)));
};

I2C1.setup({scl: B8, sda: B9});

const MATRIX_1 = 0x70;
const MATRIX_2 = 0x71;
const MATRIX_3 = 0x72;

const wifiIcon = [24,102,129,24,36,0,24,24];
const cloudIcon = [0,28,98,129,129,126,0,0];

[MATRIX_1, MATRIX_2, MATRIX_3].forEach(function (display) {
  I2C1.writeTo(display, 0x21); // turn on oscillator
  I2C1.writeTo(display, 0x81); // disp on
  I2C1.writeTo(display, 0xE0 | 0); // 0-15
  drawIcon(display, [255, 255, 255, 255, 255, 255, 255, 255]);
});

function onConnected(err) {
  if (err) throw err;
  wifi.getIP(function(e,ip) {
    console.log(ip);
    drawIcon(MATRIX_1, wifiIcon);
    tlsOptions.key = okey;
    tlsOptions.cert = ocert;
    tlsOptions.ca = oca;

    console.log("Connecting to " + tlsOptions.host);
    require('tls')
      .connect(tlsOptions, function (res) {
        console.log('tls connected');

        const baseShadowTopic = '$aws/things/' + thingId + '/shadow';
        const updateTopic = baseShadowTopic + '/update/delta';
        const getTopic = baseShadowTopic + '/get/accepted';
        const mqttHost = tlsOptions.host;
        const mqttOptions = {
          client_id: thingId,
          keep_alive: 60,
          port: tlsOptions.port,
          clean_session: true
        };
        mqtt = require('MQTT').create(mqttHost, mqttOptions);
        mqtt.on('connected', function () {
          console.log('mqtt connected');
          drawIcon(MATRIX_2, cloudIcon);
          LED2.set();
          mqtt.subscribe(updateTopic);
          mqtt.subscribe(getTopic);
          setTimeout(function () {
            mqtt.publish(baseShadowTopic + '/get', '');
          }, 100);
        });
        mqtt.on('publish', function (pub) {
          console.log('\nNew message received: ');
          console.log('topic: ' + pub.topic);
          console.log('message: ' + pub.message);
          if (pub.topic === updateTopic){
            const m = JSON.parse(pub.message);
            if (m.state.icon1) drawIcon(MATRIX_1, m.state.icon1);
            if (m.state.icon2) drawIcon(MATRIX_2, m.state.icon2);
            if (m.state.icon3) drawIcon(MATRIX_3, m.state.icon3);
            mqtt.publish(baseShadowTopic + '/update', JSON.stringify({state: {reported: m.state}}));
          } else if (pub.topic === getTopic) {
            const m = JSON.parse(pub.message);
            if (m.state && m.state.desired) {
              if (m.state.desired.icon1) drawIcon(MATRIX_1, m.state.desired.icon1);
              if (m.state.desired.icon2) drawIcon(MATRIX_2, m.state.desired.icon2);
              if (m.state.desired.icon3) drawIcon(MATRIX_3, m.state.desired.icon3);
            }
          }
        });
        mqtt.on('disconnected', function () {
          console.log('disconnected from AWS IoT Service...');
          LED1.set();
        });
        console.log('Connecting to MQTT');
        mqtt.connect(res);
      });
  });
}

// For Espruino WiFi
function onInit() {
  setTimeout(function() {
    console.log("Connecting to WiFi");
    wifi = require("EspruinoWiFi");
    wifi.connect(WIFI_NAME, WIFI_OPTIONS, onConnected);
  }, 2500);
}
