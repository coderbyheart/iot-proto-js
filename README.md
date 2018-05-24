# Prototyping products for the Internet of Things using JavaScript

Source code examples used in my presention on Prototyping products for the Internet of Things using JavaScript

## NFC Card Reader Example

This example uses an the [Adafruit PN532 NFC/RFID controller breakout board](https://www.adafruit.com/product/364).

Connect `SCL` on the reader to the `B6` pin of the Espruino.   
Connect `SDA` on the reader to the `B7` pin of the Espruino.  
Connect `5V` on the reader to the `5V` pin of the Espruino (left of the `3.3V`).  
Connect `GND` next to the `SCL` pin on the reader to the `GND` pin of the Espruino.

![NFC wiring](https://farm1.staticflickr.com/977/28425769188_4765503bc3_k_d.jpg)

## Display Example

The example uses three [Adafruit Mini 8x8 LED Matrix w/I2C Backpack](https://www.adafruit.com/product/870).

They are hooked in parallel:

![Display Wiring](https://farm1.staticflickr.com/902/41407730335_514b9c5e40_k_d.jpg)

The second display has the `A0` jumper soldered (so it has the address `0x71`),
The third display has the `A1` jumper soldered (so it has the address `0x72`).

I use a free MQTT broker from [cloudmqtt.com](https://www.cloudmqtt.com/), copy the file [`./display/cloudmqtt.com/.env.dist`](./display/cloudmqtt.com/.env.dist) to `./display/cloudmqtt.com/.env` and enter your details.

Now you can run `node client.js` in the `./display/cloudmqtt.com` folder.
