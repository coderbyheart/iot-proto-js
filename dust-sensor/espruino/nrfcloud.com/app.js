// Connect temperature sensor
const dht = require('DHT22').connect(A0);

// Connect dust sensor
var s = new Serial();
s.setup(9600, { rx: B7, tx: B6 });

// Wifi settings (3)
var WIFI_NAME = 'YOUR_SSID';
var WIFI_OPTIONS = { password: 'YourPassword' };

// Set the AWS IoT endpoint
const tlsOptions = url.parse('mqtts://a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com:8883'); // (4)

// Change to your messagesPrefix
const messagesPrefix = 'prod/??????-????-4???-????-????????????/m/'; // (5)

// Create an AWS IoT Thing and enter the details here
const thingId = '??????-????-4???-????-????????????'; // (6)

// ============================================================================
//                                                         Certificate Handling

// flash memory module
var flash = require('Flash');
// The address of the first free area of flash memory available
var addr = flash.getFree()[0].addr;

/* This writes data to flash, and returns a 'memoryArea' -
a reference to the actual bytes in flash*/
function fwrite(data) {
	var len = data.length;
	while (data.length & 3) data += '\xFF';
	var a = addr;
	flash.write(data, addr);
	addr += data.length;
	return E.memoryArea(a, len);
}

// Our certificates/etc
var okey, ocert, oca;

/* Now erase all data in our flash page, and write the keys one at a time. So we don't mess up our
code upload by blocking Espruino, we'll do each one after a timeout. */
setTimeout(function () {
	// Erase all data in that flash page
	flash.erasePage(addr);
}, 500);
setTimeout(function () {
	okey = fwrite(atob('MIIEpAI...')); // (7)
}, 1000);
setTimeout(function () {
	ocert = fwrite(atob('MIIDW...')); // (8)
}, 1500);
setTimeout(function () {
	// This is the root CA Certificate (RSA 2048 bit key: Amazon Root CA 1): https://docs.aws.amazon.com/iot/latest/developerguide/managing-device-certs.html
	oca = fwrite(atob('MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsFADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTELMAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJvb3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXjca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qwIFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQmjgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUAA4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDIU5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUsN+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vvo/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpyrqXRfboQnoZsG4q5WTP468SQvvG5'));
}, 2000);

//
// ========================
// Temperature sensor logic

let temp;
let rh;

function readTemperature() {
	dht.read(function (a) {
		temp = a.temp;
		rh = a.rh;
		console.log('temp: ' + temp + '\trh: ' + rh);
	});
}

//
// ==================
// Dust sensor

let pm2_5;
let pm10;

// Adapted from https://github.com/katrotz/nova-sds011/blob/c6ae1f6638cbffec70baf93035dfa6b99ec09e60/lib/sds011.js
// See spec here: https://cdn.sparkfun.com/assets/parts/1/2/2/7/5/Laser_Dust_Sensor_Control_Protocol_V1.3.pdf
//
// Message format:
//   0 AA
//   1 Commander No. C0
//   2 DATA 1 PM2.5 Low byte
//   3 DATA 2 PM2.5 High byte
//   4 DATA 3 PM10 Low byte
//   5 DATA 4 PM10 High byte
//   6 DATA 5 0(Reserved)
//   7 DATA 6 0(Reserved)
//   8 Check-sum Check-sum
//   9 message tail AB

function parseMessage(rawBuffer) {
	// Decodes the hex value string
	const buffer = toHex(rawBuffer);

	// crc check
	if (!crcOk(buffer)) {
		return;
	}

	// Extract PM values. Formula from the spec:
	//   PM2.5 value: PM2.5 (ug/m3) = ((PM2.5 High byte *256) + PM2.5 low byte) / 10
	//   PM10 value: PM10 (ug/m3) = ((PM10 high byte*256) + PM10 low byte) / 10
	const pm2_5 = (parseInt(buffer[2], 16) | (parseInt(buffer[3], 16) << 8)) / 10.0;
	const pm10 = (parseInt(buffer[4], 16) | (parseInt(buffer[5], 16) << 8)) / 10.0;

	return {
		pm2_5: pm2_5,
		pm10: pm10
	};
}

// Check-sum: Check-sum=DATA1+DATA2+...+DATA6
function crc(buffer) {
	const part = buffer.slice(2, 8);

	var calcCrc = part.reduce(function (prev, curr) {
		return prev + parseInt(curr, 16);
	}, 0);

	calcCrc &= 0xFF;

	return calcCrc.toString(16);
}

// Compare calculated checksum with the checksum in the buffer
function crcOk(buffer) {
	const novaCrc = buffer[8];
	const calcCrc = crc(buffer);

	return calcCrc === novaCrc;
}

function toHex(buf) {
	var result = [];

	for (var i = 0; i < buf.length; i++) {
		result.push(('0' + buf[i].charCodeAt(0).toString(16)).slice(-2));
	}
	return result;
}

//
// =======================
// Connect to nrfcloud.com

var wifi;

function onConnected(err) {
	if (err) throw err;
	wifi.getIP(function (e, ip) {
		console.log(ip);
		tlsOptions.key = okey;
		tlsOptions.cert = ocert;
		tlsOptions.ca = oca;

		console.log('Connecting to ' + tlsOptions.host);
		require('tls')
			.connect(tlsOptions, function (res) {
				console.log('tls connected');

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
					main(mqtt);
					LED2.set();
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

//
// ============
// main routine

const topic = messagesPrefix + thingId;

function publishReadings(mqtt) {
	const msg = JSON.stringify({
		temp: {
			temp: temp,
			rh: rh,
		},
		dust: {
			pm2_5: pm2_5,
			pm10: pm10,
		}
	});
	console.log(topic, msg);
	mqtt.publish(topic, msg);
}

function main(mqtt) {
	// Enable temperature reading
	setInterval(readTemperature, 10000);

	// Enable dust sensor reading
	let b = [];
	s.on('data', function (data) {
		const code = data.charCodeAt(0).toString(16);
		if (code === 'aa') {
			b = [];
		}
		for (let i = 0; i < data.length; i++) {
			b.push(data[i]);
		}
		if (code === 'ab') {
			const pmValues = parseMessage(b);
			if (!pmValues) {
				console.log('Failed to parse buffer [' + toHex(b) + ']');
			} else {
				pm2_5 = pmValues.pm2_5;
				pm10 = pmValues.pm10;
				console.log('pm2.5: ' + pm2_5 + '\tpm10: ' + pm10);
			}
		}
	});

	// Continuously publish
	setInterval(publishReadings.bind(undefined, mqtt), 60000);
}

//
// =============
// Espruino main

function onInit() {
	setTimeout(function () {
		console.log('Connecting to WiFi');
		wifi = require('EspruinoWiFi');
		wifi.connect(WIFI_NAME, WIFI_OPTIONS, onConnected);
	}, 2500);
}
