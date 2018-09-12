'use strict';

const SerialPort = require('serialport');

class ValveControlBase extends SerialPort {
  constructor(port) {
    super(port, {baudRate: 115200});
    // this.getEEPROMSettings();
    this.on('open', function() {
      console.log('Port opennnn');
    });

    this.on('data', function(data) {
      switch (this.lastCommand) {
        case 0x07:
          this.cycleCompleted = data.readUInt32LE(0);
          this.valveStates = [];
          for (let i=0; i<this.settings_.REG_NUM; i++) {
            for (let j=0; j<8; j++) {
              this.valveStates[8*i+j] = ((data[i] >> j) & 1);
            }
          }
          break;
        case 0x0E:
          this.settings_ = {
            EEPROM_RESET_FLAG: data[0],
            REG_NUM: data[1],
            STATE_NUM: data[2],
            PHASE_NUM: data[3],
            BEFORE_PHASE_NUM: data[4],
            AFTER_PHASE_NUM: data[5]
          };
          break;
      }
    });

    this.on('error', function(err) {
      console.log('Error', err);
      process.exit(1);
    });
  }

  write(command) {
    this.lastCommand = command[0];
    super.write(command);
  }

  setRegNum(n) {
    this.write([0, n]);
  }

  setTotalPhases(totalPhases, totalBeforePhases, totalAfterPhases) {
    this.write([1, totalPhases, totalBeforePhases, totalAfterPhases]);
  }

  setOperation(index, on=[], off=[]) {
    let onInt = 0;
    let offInt = 0;
    for (let i of on)  { onInt  |= (1 << (i-1)); }
    for (let i of off) { offInt |= (1 << (i-1)); }
    maskInt = onInt | offInt;

    let onBytes = [];
    let maskBytes = [];
    for (let i=0; i<this.settings_.REG_NUM; i++) {
      onBytes[this.settings_.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.settings_.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
    }
    this.write([0x02, index].concat(onBytes).concat(maskBytes));
  }

  setPhase(offset, operationIndex) {
    this.write([0x03, offset, operationIndex]);
  }

  setBeforePhase(offset, operationIndex) {
    this.write([0x04, offset, operationIndex]);
  }

  setAfterPhase(offset, operationIndex) {
    this.write([0x05, offset, operationIndex]);
  }

  start(cycles, phaseIntervalMillis) {
    const cmd = Buffer.from(0x06);
    const cyclesBuf = Buffer.allocUnsafe(4);
    const phaseIntervalMillisBuf = Buffer.allocUnsafe(4);
    cyclesBuf.writeUInt32LE(cycles, 0);
    phaseIntervalMillisBuf.writeUInt32LE(phaseIntervalMillis, 0);
    this.write(Buffer.concat([cmd, cyclesBuf, phaseIntervalMillisBuf]));
  }

  stop() {
    this.write([0x07]);
  }

  controlValve(on=[], off=[]) {
    let onInt = 0;
    let offInt = 0;
    for (let i of on)  { onInt  |= (1 << (i-1)); }
    for (let i of off) { offInt |= (1 << (i-1)); }
    maskInt = onInt | offInt;

    let onBytes = [];
    let maskBytes = [];
    for (let i=0; i<this.settings_.REG_NUM; i++) {
      onBytes[this.settings_.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.settings_.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
    }
    this.write([0x08].concat(onBytes).concat(maskBytes));
  }

  clearShiftRegister() {
    this.write([0x09]);
  }

  clear() {
    this.write([0x0A]);
  }

  updateEEPROM(addr, data) {
    this.write([0x0B, addr].concat(data));
  }

  restart() {
    this.write([0x0C]);
  }

  getEEPROMSettings() {
    this.flush();
    this.write([0x0E]);
  }
}

function createPort(selectedPort) {
  const openOptions = {
    baudRate: 115200,
    // dataBits: args.databits,
    // parity: args.parity,
    // stopBits: args.stopbits,
  };

  const port = new ValveControlBase(selectedPort);
  setTimeout(function() {
    port.getEEPROMSettings();
  }, 2000);
  return port;
}

const port = createPort('/dev/tty.wchusbserial1420');