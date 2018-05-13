'use strict'

const AWS = require('aws-sdk')

const Bitmaps = {
  Blank:
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯' +
    '◯◯◯◯◯◯◯◯'
}

const errorHandler = callback => error => {
  console.error(error)
  callback(null, {
    statusCode: 500,
    body: JSON.stringify(error)
  })
}

const successHandler = callback => () => {
  callback(null, {
    statusCode: 202
  })
}

/**
 * Convert a graphical bitmap (like above) made of 64 unicode characters to a list of
 * 8 integers.
 */
const toBitmap = str => str
  .substr(0, 64)
  .split('')
  .map(c => c === '●' ? 1 : 0)
  .reduce((lines, c) => {
    const currentLine = lines[lines.length - 1]
    if (!currentLine || currentLine.length >= 8) {
      lines.push([c])
    } else {
      currentLine.push(c)
    }
    return lines
  }, [])
  .map(line => {
    let int = 0
    line.reverse().forEach((bit, idx) => {
      int = int | (bit << idx)
    })
    return int
  })

module.exports = {
  write: (event, context, callback) => {
    const thingName = event.pathParameters.id
    const bitmaps = (event.body || '')
      .split('\n')
      .concat(Bitmaps.Blank, Bitmaps.Blank, Bitmaps.Blank)
      .slice(0, 3)
      .map(toBitmap)

    const iotdata = new AWS.IotData({endpoint: process.env.IOT_ENDPOINT})

    iotdata
      .updateThingShadow({
        thingName,
        payload: JSON.stringify({
          state: {
            desired: {
              icon: bitmaps
            }
          }
        })
      })
      .promise()
      .then(successHandler(callback))
      .catch(errorHandler(callback))
  }
}
