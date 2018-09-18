'use strict';

const EventEmitter = require('events');


class ValveControlDevice extends EventEmitter {
  constructor(port) {
    super();

    console.log(port);
    this.arduinoParams = {REG_NUM: 4};
    setTimeout(() => {
      this.emit('device-ready');
      console.log('device ready');
    }, 100);
  }

  controlSingleValve(i, on) {
    let state = on ? 'on' : 'off';
    console.log('valve', i, state);
  }

  makeProgrammableCycle(file) {
    console.log('load', file);
  }

  uploadProgram() {
    console.log(`upload program`);
  }

  start(cycles, phaseIntervalMillis) {
    console.log('start cycles', cycles, phaseIntervalMillis);
  }

  stop() {
    console.log('stop cycles');
  }

  loadToggleValveProgram(valve) {
    console.log('load built-in program: toggle valve', valve);
  }

  load5PhasePumpProgram(inletValve, DC, outletValve) {
    console.log('load built-in program: pump', inletValve, DC, outletValve);
  }

  restart() {
    console.log('Aruidno restart');
  }

  clearShiftRegister() {
    console.log('Clear Shift Register');
  }

  setRegNum(n) {
    this.arduinoParams.REG_NUM = n;
    console.log('change reg num to', n);
  }

  flush() {
    console.log('flush');
  }
}

module.exports = {
  ValveControlDevice: ValveControlDevice
};
