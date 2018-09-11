'use strict';

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

class ValveControlBase extends SerialPort {
  constructor(port) {
    super(port, {baudRate: 115200});
    this.getEEPROMSettings();
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
    for (let i=0; i<this.settings.REG_NUM; i++) {
      onBytes[this.settings.REG_NUM-i-1] = (onInt >>> i*8) & 0xFF;
      maskBytes[this.settings.REG_NUM-i-1] = (maskInt >>> i*8) & 0xFF;
    }
    this.write([0x02, index].concat(onBytes).concat(maskBytes));
  }

  getEEPROMSettings() {
    this.flush();
    this.write([0x0E]);
    setTimeout(function () {
      let res = this.read();
      this.settings = {
        EEPROM_RESET_FLAG: res[0],
        REG_NUM: res[1],
        STATE_NUM: res[2],
        PHASE_NUM: res[3],
        BEFORE_PHASE_NUM: res[4],
        AFTER_PHASE_NUM: res[5]
      };
    }, 100);
  }
}

    // def setPhase(self, offset, operationIndex):
    //     """Copy data to ``phase` array, starting from ``offset``.
        
    //     :param int offset: offset in the ``phase`` array
    //     :param list operationIndex: a list of operation index (int)
    //     """
    //     data = b''
    //     for i in operationIndex:
    //         data += i.to_bytes(1, 'little')
    //     self.send(b'\x03' + offset.to_bytes(1, 'little') + data)

    // def setBeforePhase(self, offset, operationIndex):
    //     """Copy data to ``phase` array, starting from ``offset``.
        
    //     :param int offset: offset in the ``beforePhase`` array
    //     :param list operationIndex: a list of operation index (int)
    //     """
    //     data = b''
    //     for i in operationIndex:
    //         data += i.to_bytes(1, 'little')
    //     self.send(b'\x04' + offset.to_bytes(1, 'little') + data)

    // def setAfterPhase(self, offset, operationIndex):
    //     """Copy data to ``phase` array, starting from ``offset``.
        
    //     :param int offset: offset in the ``afterPhase`` array
    //     :param list operationIndex: a list of operation index (int)
    //     """
    //     data = b''
    //     for i in operationIndex:
    //         data += i.to_bytes(1, 'little')
    //     self.send(b'\x05' + offset.to_bytes(1, 'little') + data)

    // def start(self, cycles, phaseIntervalMillis):
    //     """Start cycles.
        
    //     :param int cycles: number of cycles to run
    //     :param int phaseIntervalMillis: the interval in milliseconds between 
    //                                     different phases in a cycle. NOTE: This 
    //                                     is the cycle period. 
    //     """
    //     cycles = cycles.to_bytes(4, 'little')
    //     phaseIntervalMillis = phaseIntervalMillis.to_bytes(4, 'little')
    //     self.send(b'\x06' + cycles + phaseIntervalMillis)

    // def stop(self):
    //     """Stop running cycles"""
    //     res = self.send(b'\x07', wait=0.2)
    //     cycleCompleted = int.from_bytes(res[:4], 'little')
    //     temp = int.from_bytes(res[4:4+self.settings['REG_NUM']], 'big')
    //     valveStates = []
    //     for i in range(8*self.settings['REG_NUM']):
    //         valveStates.append((temp >> i) & 1)
    //     return cycleCompleted, valveStates

    // def controlValves(self, on=(), off=()):
    //     """Control vlaves manually.
        
    //     :param list on: a list of valve numbers (int) to turn on
    //     :param list off: a list of valve numbers (int) to turn off
    //     """
    //     onBytes = 0
    //     for i in on:
    //         onBytes |= (1 << (i-1))
    //     offBytes = 0
    //     for i in off:
    //         offBytes |= (1 << (i-1))
    //     maskBytes = onBytes | offBytes
        
    //     data = onBytes.to_bytes(self.settings['REG_NUM'], 'big')
    //     mask = maskBytes.to_bytes(self.settings['REG_NUM'], 'big')
    //     self.send(b'\x08' + data + mask)

    // def clearShiftRegister(self):
    //     """Reset shift register outputs"""
    //     self.send(b'\x09')

    // def clear(self):
    //     """Reset shift register outputs and all parameters"""
    //     self.send(b'\x0A')

    // def updateEEPROM(self, addr, data):
    //     """Set the parameters in EEPROM. 
        
    //     :param int addr: address in EEPROM, range 0-255
    //     :param data bytes: the data to write onto EEPROM
    //     """
    //     self.send(b'\x0B' + int(addr).to_bytes(1, 'little') + data)

    // def restart(self):
    //     """Restart Arduino. 
    //     It does not do anything to the peripheral circuits. 
    //     """
    //     self.send(b'\x0C')



// function createPort(selectedPort) {
//   const openOptions = {
//     baudRate: args.baud,
//     dataBits: args.databits,
//     parity: args.parity,
//     stopBits: args.stopbits,
//   }

//   const port = new SerialPort(selectedPort, openOptions)
//   const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

//   process.stdin.resume()
//   process.stdin.setRawMode(true)
//   process.stdin.on('data', s => {
//     if (s[0] === 0x03) {
//       port.close()
//       process.exit(0)
//     }
//     if (args.localecho) {
//       if (s[0] === 0x0d) {
//         process.stdout.write('\n')
//       } else {
//         process.stdout.write(s)
//       }
//     }
//     port.write(s)
//   })

//   parser.on('data', function(data) {

//   });

//   port.on('data', data => {

//   });

//   port.on('error', err => {
//     console.log('Error', err)
//     process.exit(1)
//   })
// }