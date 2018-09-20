'use strict';

const SerialPort = require('serialport');
const EventEmitter = require('events');
const fs = require('fs');
const readline = require('readline');

class ValveControlBase extends SerialPort {
  constructor(port) {
    super(port, {baudRate: 115200}, () => {
      setTimeout(() => {
        this.getEEPROMSettings();
      }, 2000);
    });

    this.on('data', (data) => {
      switch (this.lastCommand) {
        case 0x06:
          this.cycleCompleted = -1;
          this.valveStates = [];
          for (let i=this.arduinoParams.REG_NUM-1; i>=0; i--) {
            for (let j=0; j<8; j++) {
              this.valveStates.push((data[i] >>> j) & 1);
            }
          }
          this.emit('device-stopped-completed');
          break;
        case 0x07:
          this.cycleCompleted = data.readUInt32LE(0);
          this.valveStates = [];
          for (let i=this.arduinoParams.REG_NUM-1; i>=0; i--) {
            for (let j=0; j<8; j++) {
              this.valveStates.push((data[i+4] >>> j) & 1);
            }
          }
          this.emit('device-stopped-completed');
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
          this.emit('device-ready');
          break;
      }
    });

    this.on('error', (err) => {
      // TODO: handle error differently
      console.log('Error', err);
      process.exit(1);
    });
  }

  write(data, encoding, callback) {
    return new Promise((resolve, reject) => {
      let temp = super.write(data, encoding, (err) => {
        if (!err) {
          if (callback) {
            callback.call(this);
          }
          resolve(temp);
        } else {
          if (callback) {
            callback.call(this, err);
          }
        }
      });
    });
  }

  setRegNum(n) {
    return this.write([0, n], () => {
      this.getEEPROMSettings();
    });
  }

  setTotalPhases(totalPhases, totalBeforePhases, totalAfterPhases) {
    return this.write([0x01, totalPhases, totalBeforePhases, totalAfterPhases]);
  }

  makeOnBytesMaskBytes(on=[], off=[]) {
    let onInt  = 0;
    let offInt = 0;
    for (let i of on)  { onInt  |= (1 << (i-1)); }
    for (let i of off) { offInt |= (1 << (i-1)); }
    let maskInt = onInt | offInt;

    let onBytes = [];
    let maskBytes = [];
    for (let i=0; i<this.arduinoParams.REG_NUM; i++) {
      onBytes[this.arduinoParams.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.arduinoParams.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
    }
    return [...onBytes, ...maskBytes];
  }

  setOperation(index, on=[], off=[]) {
    let onBytesMaskBytes = this.makeOnBytesMaskBytes(on, off);
    return this.write([0x02, index, ...onBytesMaskBytes]);
  }

  setPhase(offset, operationIndex) {
    return this.write([0x03, offset, ...operationIndex]);
  }

  setBeforePhase(offset, operationIndex) {
    return this.write([0x04, offset, ...operationIndex]);
  }

  setAfterPhase(offset, operationIndex) {
    return this.write([0x05, offset, ...operationIndex]);
  }

  start(cycles, phaseIntervalMillis) {
    this.lastCommand = 0x06;
    const cmd = Buffer.from([0x06]);
    const cyclesBuf = Buffer.allocUnsafe(4);
    const phaseIntervalMillisBuf = Buffer.allocUnsafe(4);
    cyclesBuf.writeUInt32LE(cycles, 0);
    phaseIntervalMillisBuf.writeUInt32LE(phaseIntervalMillis, 0);
    return this.write(Buffer.concat([cmd, cyclesBuf, phaseIntervalMillisBuf]));
  }

  stop() {
    this.lastCommand = 0x07;
    return this.write([0x07]);
  }

  controlValve(on=[], off=[]) {
    let onBytesMaskBytes = this.makeOnBytesMaskBytes(on, off);
    return this.write([0x08, ...onBytesMaskBytes]);
  }

  clearShiftRegister() {
    return this.write([0x09]);
  }

  clear() {
    return this.write([0x0A]);
  }

  updateEEPROM(addr, data) {
    return this.write([0x0B, addr].concat(data));
  }

  restart() {
    return this.write([0x0C]);
  }

  getEEPROMSettings() {
    this.lastCommand = 0x0E;
    this.flush();
    return this.write([0x0E]);
  }
}

class ValveControlDevice extends ValveControlBase {
  controlSingleValve(i, on) {
    if (on) {
      this.controlValve([i], []);
    } else {
      this.controlValve([], [i]);
    }
  }

  sleepBetweenWrite() {
    return new Promise((resolve, reject) => {
      // must wait for 10 ms between write
      setTimeout(() => {resolve();}, 10);
    });
  }

  async uploadProgram() {
    await this.setTotalPhases(
      this.valveSequence.phase.length,
      this.valveSequence.beforePhase.length,
      this.valveSequence.afterPhase.length
    );
    await this.sleepBetweenWrite();

    for (let i=0; i<this.valveSequence.operations.length; i++) {
      let valveOn = this.valveSequence.operations[i][0];
      let valveOff = this.valveSequence.operations[i][1];
      await this.setOperation(i, valveOn, valveOff);
      await this.sleepBetweenWrite();
    }

    let rowSize = 20;
    for (let i=0; i<this.valveSequence.phase.length; i+=rowSize) {
      let endIndex = Math.min(this.valveSequence.phase.length, i+rowSize);
      await this.setPhase(i, this.valveSequence.phase.slice(i, endIndex));
      await this.sleepBetweenWrite();
    }
    for (let i=0; i<this.valveSequence.beforePhase.length; i+=rowSize) {
      let endIndex = Math.min(this.valveSequence.beforePhase.length, i+rowSize);
      await this.setBeforePhase(i, this.valveSequence.beforePhase.slice(i, endIndex));
      await this.sleepBetweenWrite();
    }
    for (let i=0; i<this.valveSequence.afterPhase.length; i+=rowSize) {
      let endIndex = Math.min(this.valveSequence.afterPhase.length, i+rowSize);
      await this.setAfterPhase(i, this.valveSequence.afterPhase.slice(i, endIndex));
      await this.sleepBetweenWrite();
    }
  }

  loadProgram(file) {
    let ps = new ProgrammableSequence(file);
    ps.once('done', () => {
      if (ps.wrongLines.length === 0) {
        this.valveSequence = ps;
        this.uploadProgram();
      } else {
        return ps.wrongLines;
      }
    });
  }

  loadToggleValveProgram(valve) {
    this.valveSequence = new ToggleValveSequence(valve);
    this.uploadProgram();
  }

  load5PhasePumpProgram(inletValve, DC, outletValve) {
    this.valveSequence = new FivePhasePumpSequence(inletValve, DC, outletValve);
    this.uploadProgram();
  }
}

class ProgrammableSequence extends EventEmitter {
  constructor(file) {
    super();
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
    lineReader.on('line', (line) => {
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
    });

    lineReader.on('close', () => {
      this.parsingStatus = null;
      this.emit('done');
    });
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
    let notNumber = valveOn.concat(valveOff).filter((value) => {
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

class ToggleValveSequence {
  constructor(valve) {
    this.operations = [
      [[valve], []],
      [[], [valve]]
    ];
    this.phase = [0, 1];
    this.beforePhase = [];
    this.afterPhase = [];
  }
}

class FivePhasePumpSequence {
  constructor(inletValve, DC, outletValve) {
    this.operations = [
      [[outletValve], []],
      [[DC], []],
      [[inletValve], []],
      [[], [inletValve, DC]],
      [[], [outletValve]]
    ];
    this.phase = [3, 2, 4, 1, 0];
    this.beforePhase = [0, 1, 2];
    this.afterPhase = [0];
  }
}


module.exports = {
  ValveControlBase: ValveControlBase,
  ValveControlDevice: ValveControlDevice,
  ProgrammableSequence: ProgrammableSequence,
  ToggleValveSequence: ToggleValveSequence,
  FivePhasePumpSequence: FivePhasePumpSequence
};
