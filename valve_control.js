'use strict';

const SerialPort = require('serialport');
const fs = require('fs');
const readline = require('readline');

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
          for (let i=0; i<this.arduinoParams.REG_NUM; i++) {
            for (let j=0; j<8; j++) {
              this.valveStates[8*i+j] = ((data[i] >> j) & 1);
            }
          }
          break;
        case 0x0E:
          this.arduinoParams = {
            EEPROM_RESET_FLAG: data[0],
            REG_NUM: data[1],
            STATE_NUM: data[2],
            PHASE_NUM: data[3],
            BEFORE_PHASE_NUM: data[4],
            AFTER_PHASE_NUM: data[5]
          };
          console.log(this.arduinoParams);
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
    for (let i=0; i<this.arduinoParams.REG_NUM; i++) {
      onBytes[this.arduinoParams.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.arduinoParams.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
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
    for (let i=0; i<this.arduinoParams.REG_NUM; i++) {
      onBytes[this.arduinoParams.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.arduinoParams.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
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

class ValveControlDevice extends ValveControlBase {
  controlSingleValve(i, on) {
    if (on) {
      this.controlValve(on=[i]);
    } else {
      this.controlValve(off=[i]);
    }
  }


}

class ProgrammableSequence {
  constructor(file) {
    this.operations = [];
    this.phase = [];
    this.beforePhase = [];
    this.afterPhase = [];
    this.wrongLines = [];
    this.parsingStatus = null;

    this.parseFile(file);
  }

  parseFile(file) {
    // 0: parsing started
    // 1: parsing CYCLE
    // 2: parsing BEFORE
    // 3: parsing AFTER

    this.parsingStatus = 0;

    const lineReader = readline.createInterface({
      input: fs.createReadStream(file, {autoClose: true})
    });

    let lineNum = 0;
    lineReader.on('line', function(line) {
      lineNum++;
      let line_ = line.trim().toUpperCase();
      if (line_) {
        switch (line_) {
          case 'CYCLE':
            this.parsingStatus = 1;
            break;
          case 'BEFORE':
            this.parsingStatus = 2;
            break;
          case 'AFTER':
            this.parsingStatus = 3;
            break;
          default:
            try {
              this.parseLine(line_);
            }
            catch(error) {
              this.wrongLines.push(lineNum);
            }
            break;
        }
      }
    }.bind(this));

    lineReader.on('close', function() {
      this.parsingStatus = null;
    }.bind(this));
  }

  parseLine(line) {
    let valveOn = [];
    let valveOff = [];
    for (let command of line.split(',')) {
      command = command.trim();
      let valveNum = command.split(' ')
                            .filter(Boolean)
                            .slice(1)
                            .map(Number);
      if (command.startsWith('ON')) {
        valveOn = valveOn.concat(valveNum);
      } else if (command.startsWith('OFF')) {
        valveOff = valveOff.concat(valveNum);
      } else {
        throw new Error('Command must start with "ON" or "OFF"!');
      }
    }

    valveOn = [...new Set(valveOn.sort())];
    valveOff = [...new Set(valveOff.sort())];
    let notNumber = valveOn.concat(valveOff).filter(function(value) {
      return !Number.isInteger(value);
    });
    if (notNumber.length !== 0) {
      throw new Error('Valve number must be a integer!');
    }

    // Check if there are duplicated operation
    let hasDuplicate = false;
    let operationIndex = 0;
    for (let i=0; i<this.operations.length; i++) {
      operationIndex = i;
      let a = (this.operations[i][0].toString() === valveOn.toString());
      let b = (this.operations[i][1].toString() === valveOff.toString());
      hasDuplicate = a && b;
      if (hasDuplicate) break;
    }

    // If there is no duplicated operation, append the new one.
    if (!hasDuplicate) {
      operationIndex = this.operations.length;
      this.operations.push([valveOn, valveOff]);
    }

    // Append operation index to corresponding phases
    switch (this.parsingStatus) {
      case 1:
        this.phase.push(operationIndex);
        break;
      case 2:
        this.beforePhase.push(operationIndex);
        break;
      case 3:
        this.afterPhase.push(operationIndex);
        break;
    }
  }
}

const port = createPort('/dev/tty.wchusbserial1470');
