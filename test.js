'use strict';

const args = require('commander')

function makeNumber(input) {
  return Number(input)
}

args.option('-b, --baud <baudrate>', 'Baud rate default: 9600', makeNumber, 9600).parse(process.argv)

function createPort(selectedPort) {
  const openOptions = {
    baudRate: args.baud,
    // dataBits: args.databits,
    // parity: args.parity,
    // stopBits: args.stopbits,
  }

  console.log(openOptions)
}

createPort('COM1')