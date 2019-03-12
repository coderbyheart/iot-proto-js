# Store dust sensor data on nRF Connect for Cloud

> In this example we are using the 
> [nRF Connect for Cloud Device API](https://docs.api.nrfcloud.com/), 
> which is a free service for protyping IoT products and is built on top 
> of [AWS IoT](https://aws.amazon.com/iot/), to store dust sensor readings.
>
> The API is device-agnostic and can store data from any kind of device.
>
> In this example we use an [Espruino Wifi](https://www.espruino.com/WiFi)
> (firmware version 2v01).
> The Espruino will connect to the AWS IoT MQTT broker using TLS, and 
> regularly publish temperatore and dust sensor readings.

## Prepare your account

Go to [nrfcloud.com](https://nrfcloud.com/) and register a new account.

Head over to the [handbook](https://docs.api.nrfcloud.com/) and acquire 
your API token, you need to replace it in the following examples with
the `YOUR_API_KEY` string.

> I will use [httpie](https://github.com/jakubroztocil/httpie) in the 
> following examples.

Fetch the information about the MQTT broker to use:

```bash
http https://api.nrfcloud.com/v1/info \
  Authorization:"Bearer YOUR_API_KEY"
```

The response looks like this:

```json
{
    "mqttEndpoint": "a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com",
    "mqttTopicPrefix": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/",
    "topics": {
        "alerts": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/a/alerts",
        "connections": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/a/connections",
        "gateways": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/a/gateways",
        "messagesPrefix": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/",
        "notifications": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/a/alerts/notifications"
    }
}
```

## Prepare the Espruino

![Espruino Wifi with dust and temperature sensors attached](https://farm8.staticflickr.com/7882/47307044212_22fe41f7a2_k_d.jpg)

> (1) Connect the temperature sensore and set the correct pin you used. See https://www.espruino.com/DHT22 for more information on connecting the sensor.

> (2) Connect the SDS011 sensor and set the correct pins you used. See https://luftdaten.info/en/construction-manual/#komponenten-schaltung for more information on connecting the sensor.

> (3) Insert your Wifi SSID and password.

> (4) use the `mqttEndpoint` (in this example `a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com`) 
> in the `tlsOptions`.

> (5) use the `messagesPrefix` (in this example `prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/`) 
> for `messagesPrefix`.

Register a new device. This will be used to represent the Espruino:

```bash
http POST https://api.nrfcloud.com/v1/devices \
  Authorization:"Bearer YOUR_API_KEY"
```

Now fetch your list of devices and look for the `Generic` device
that has just been created:

```bash
http https://api.nrfcloud.com/v1/devices \
  Authorization:"Bearer YOUR_API_KEY"
```

You will receive the device information in response.

```json
{
    "items": [{
      "$meta": {
          "createdAt": "2018-09-30T14:35:26.697Z",
          "version": "1.0"
      },
      "id": "14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "name": "14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "tags": [],
      "type": "Generic"
    }],
    "total": 1
}
```

> (6) use the `id` (in this example `14c6fcb2-9480-437a-aae2-a9c2784b05aa`) 
> as `thingId`.

Now use the `id` to request a certificate which will be used on the 
Espruino to connect to the AWS IoT MQTT broker.

```bash
http POST https://api.nrfcloud.com/v1/device/14c6fcb2-9480-437a-aae2-a9c2784b05aa/certifcates \
  Authorization:"Bearer YOUR_API_KEY"
```

The response looks like this:

```json
{
    "certificate": "-----BEGIN CERTIFICATE-----\nMIIDWTCCAkGgAwIBAgIUAeQBZU0oobXj155fi9lcFL3W7MIwDQYJKoZIhvcNAQEL\n-----END CERTIFICATE-----\n",
    "id": "arn:aws:iot:us-east-1:363127674753:cert/ed03de0b2444e013b57c472efca90397c0001c647f6836cc342852dc71a0e3bc",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAw1/JGTfQUAB1ofzLsb9cITmTB4ave+2nQb3qMioeWF5VK982\n-----END RSA PRIVATE KEY-----\n",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw1/JGTfQUAB1ofzLsb9c\n-----END PUBLIC KEY-----\n"
}
```

> (7) insert the `privateKey` (it starts with `-----BEGIN RSA PRIVATE KEY-----` in this example) 

> *Important:* replace the newlines and the leading and ending markers before pasting the value:
> ```diff
> - -----BEGIN CERTIFICATE-----\nMIIDWTCCAkGgAwIBAgIUAeQBZU0oobXj155\nfi9lcFL3W7MIwDQYJKoZIhvcNAQEL\n-----END CERTIFICATE-----\n
> + MIIDWTCCAkGgAwIBAgIUAeQBZU0oobXj155fi9lcFL3W7MIwDQYJKoZIhvcNAQEL
> ```

> (8) insert the `certificate` (it starts with `-----BEGIN CERTIFICATE-----` in this example) 

## Start the Espruino

Now save the app to the Espruino. In order to save memory please enable
*Modules uploaded as functions*, *JavaScript compiler*, and select
*Direct to Flash (execute code at boot)* as the *Save on Send* option.

The Espruino should now connect to your WiFi and to the AWS IoT MQTT
broker:

```
Running onInit()...
Connecting to WiFi
{
  "ip": "192.168.50.67",
  "mac": "5c:cf:7f:c0:ca:47"
 }
Connecting to a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com
tls connected
Connecting to MQTT
mqtt connected
pm2.5: 0.2	pm10: 0.3
pm2.5: 0.3	pm10: 0.3
temp: 22.9	rh: 19.1
pm2.5: 0.3	pm10: 0.3
pm2.5: 0.3	pm10: 0.3
pm2.5: 0.3	pm10: 0.3
pm2.5: 0.3	pm10: 0.3
pm2.5: 0.3	pm10: 0.3
pm2.5: 0.2	pm10: 0.2
pm2.5: 0.2	pm10: 0.2
prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/14c6fcb2-9480-437a-aae2-a9c2784b05aa
{"temp":{"temp":22.9,"rh":19.1},"dust":{"pm2_5":0.2,"pm10":0.2}}
```

If everything worked the green LED will be on and after 60 seconds the Espruino will publish the first reading on MQTT.

## Fetch historical messages

Using the API you can now [request the messages](http://petstore.swagger.io/?url=https://docs.api.nrfcloud.com/rest-api.yaml#/Messages/getMessages) your device has sent:


```bash
http https://api.nrfcloud.com/v1/messages \
  Authorization:"Bearer YOUR_API_KEY" \
  inclusiveStart==2018-01-01T00:00:00.000Z \
  exclusiveEnd==2099-01-01T00:00:00.000Z \
  topics==prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/14c6fcb2-9480-437a-aae2-a9c2784b05aa
```

Remember to replace the value for `topics` in this example with your device topic: `topics==${messagesPrefix}/${thingId}`.

```json
{
  "items": [
    {
      "topic": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "deviceId": "14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "receivedAt": "2019-03-12T14:48:50.500Z",
      "message": {
        "temp": {
          "temp": 22.9,
          "rh": 18.7
        },
        "dust": {
          "pm2_5": 0.2,
          "pm10": 0.5
        }
      },
      "tenantId": "4583e834-2804-42c7-a940-8c79f2ce9cba"
    },
    {
      "topic": "prod/4583e834-2804-42c7-a940-8c79f2ce9cba/m/14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "deviceId": "14c6fcb2-9480-437a-aae2-a9c2784b05aa",
      "receivedAt": "2019-03-12T14:47:50.302Z",
      "message": {
        "temp": {
          "temp": 22.9,
          "rh": 19.1
        },
        "dust": {
          "pm2_5": 0.2,
          "pm10": 0.2
        }
      },
      "tenantId": "4583e834-2804-42c7-a940-8c79f2ce9cba"
    }
  ],
  "total": 107,
  "nextStartKey": "Dnf..."
}
```

That's it! You can now leave your device running and can build for example a web app, which shows displays this data.

_Happy connecting!_
