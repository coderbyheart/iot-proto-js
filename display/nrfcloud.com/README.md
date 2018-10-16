# nRF Connect for Cloud Example

> In this example we are going to implement the display demo using the
> [nRF Connect for Cloud Device API](https://docs.api.nrfcloud.com/), 
> which is a free service for protyping IoT products and is built on top 
> of [AWS IoT](https://aws.amazon.com/iot/).
>
> The Espruino will connect to the AWS IoT MQTT broker using TLS, and 
> will be controlled using a REST API.

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
    "mqttEndpoint": "a1u20ljpdmivkj.iot.us-east-1.amazonaws.com",
    "mqttTopicPrefix": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/",
    "topics": {
        "alerts": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/a/alerts",
        "connections": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/a/connections",
        "gateways": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/a/gateways",
        "messagesPrefix": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/m/",
        "notifications": "dev/336c32a8-af03-42ea-85c9-6d36d2e45caf/a/alerts/notifications"
    }
}
```

## Prepare the Espruino

> (1) use the `mqttEndpoint` (in this example `a1u20ljpdmivkj.iot.us-east-1.amazonaws.com`) 
> in the `tlsOptions` in the Espruino app in line 6. In this example it
> should read: `'mqtts://a1u20ljpdmivkj.iot.us-east-1.amazonaws.com:8883'`

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

> (2) use the `id` (in this example `14c6fcb2-9480-437a-aae2-a9c2784b05aa`) 
> as `deviceId` in the Espruino app in line 5.

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

> (3) use the `privateKey` (it starts with `-----BEGIN RSA PRIVATE KEY-----` in this example) 
> and use it as the value in line 41 of the Espruino app.

> *Important:* replace the newlines and the leading and ending markers before pasting the value:
> ```diff
> - -----BEGIN CERTIFICATE-----\nMIIDWTCCAkGgAwIBAgIUAeQBZU0oobXj155\nfi9lcFL3W7MIwDQYJKoZIhvcNAQEL\n-----END CERTIFICATE-----\n
> + MIIDWTCCAkGgAwIBAgIUAeQBZU0oobXj155fi9lcFL3W7MIwDQYJKoZIhvcNAQEL
> ```

> (4) use the `certificate` (it starts with `-----BEGIN CERTIFICATE-----` in this example) 
> and use it as the value in line 45 of the Espruino app. 

## Start the Espruino

Now save the app to the Espruino. In order to save memory please enable
*Modules uploaded as functions*, *JavaScript compiler*, and select
*Direct to Flash (execute code at boot)* as the *Save on Send* option.

The Espruino should now connect to your WiFi and to the AWS IoT MQTT
broker:

```
WARNING: Function marked with "compiled" uploaded in source form
WARNING: Function marked with "compiled" uploaded in source form
WARNING: Function marked with "compiled" uploaded in source form
Running onInit()...
Saving key
Saving cert
Saving ca
Done!
Connecting to WiFi
{
  "ip": "192.168.1.175",
  "mac": "5c:cf:7f:c0:ca:47"
 }
Connecting to a1u20ljpdmivkj.iot.us-east-1.amazonaws.com
tls connected
Connecting to MQTT
mqtt connected
```

If everything worked the green LED will be on and the three displays
will show a random pattern.

## Run the client

Now we can run the client app that controls what is shown on the displays.

> (1) use your API key as the `apiKey` in line 5 of the client. 

> (2) enter your `deviceId` in line 6 

Install the dependencies and run the client using Node.js:

    git clone https://github.com/coderbyheart/iot-proto-js
    cd iot-proto-js
    npm ci
    node display/nrfcloud.com/client.js

Press the buttons 1, 2, or 3 to change the displayed bitmap. Use Ctrl+C
to exit the client.

