const {ipcMain} = require('electron')

const {device} = require('./main')

let deviceResponse
let deviceSettings = {}

// device.on('readable', function () {
//   deviceResponse = device.read()
// })

// get settings stored in Arduino EEPROM
device.write([0x0E], function() {
  deviceSettings.EEPROM_RESET_FLAG = deviceResponse[0]
  deviceSettings.REG_NUM           = deviceResponse[1]
  deviceSettings.STATE_NUM         = deviceResponse[2]
  deviceSettings.PHASE_NUM         = deviceResponse[3]
  deviceSettings.BEFORE_PHASE_NUM  = deviceResponse[4]
  deviceSettings.AFTER_PHASE_NUM   = deviceResponse[5]
})

ipcMain.on('set-total-phases', function(e, totalPhases, totalBeforePhases, totalAfterPhases) {
  device.write([1, totalPhases, totalBeforePhases, totalAfterPhases])
})

ipcMain.on('set-operation', function(e, index, on, off) {
  
})


//     def setOperation(self, index, on=(), off=()):
//         """Set operation data.
        
//         :param int index: phase index in the `state` array in Arduino code
//         :param list on: a list of valve numbers (int) to turn on
//         :param list off: a list of valve number (int) to turn off
//         """
//         onBytes = 0
//         for i in on:
//             onBytes |= (1 << (i-1))
//         offBytes = 0
//         for i in off:
//             offBytes |= (1 << (i-1))
//         maskBytes = onBytes | offBytes
        
//         data = onBytes.to_bytes(self.settings['REG_NUM'], 'big')
//         mask = maskBytes.to_bytes(self.settings['REG_NUM'], 'big')
//         self.send(b'\x02' + index.to_bytes(1, 'little') + data + mask)

//     def setPhase(self, offset, operationIndex):
//         """Copy data to ``phase` array, starting from ``offset``.
        
//         :param int offset: offset in the ``phase`` array
//         :param list operationIndex: a list of operation index (int)
//         """
//         data = b''
//         for i in operationIndex:
//             data += i.to_bytes(1, 'little')
//         self.send(b'\x03' + offset.to_bytes(1, 'little') + data)

//     def setBeforePhase(self, offset, operationIndex):
//         """Copy data to ``phase` array, starting from ``offset``.
        
//         :param int offset: offset in the ``beforePhase`` array
//         :param list operationIndex: a list of operation index (int)
//         """
//         data = b''
//         for i in operationIndex:
//             data += i.to_bytes(1, 'little')
//         self.send(b'\x04' + offset.to_bytes(1, 'little') + data)

//     def setAfterPhase(self, offset, operationIndex):
//         """Copy data to ``phase` array, starting from ``offset``.
        
//         :param int offset: offset in the ``afterPhase`` array
//         :param list operationIndex: a list of operation index (int)
//         """
//         data = b''
//         for i in operationIndex:
//             data += i.to_bytes(1, 'little')
//         self.send(b'\x05' + offset.to_bytes(1, 'little') + data)

//     def start(self, cycles, phaseIntervalMillis):
//         """Start cycles.
        
//         :param int cycles: number of cycles to run
//         :param int phaseIntervalMillis: the interval in milliseconds between 
//                                         different phases in a cycle. NOTE: This 
//                                         is the cycle period. 
//         """
//         cycles = cycles.to_bytes(4, 'little')
//         phaseIntervalMillis = phaseIntervalMillis.to_bytes(4, 'little')
//         self.send(b'\x06' + cycles + phaseIntervalMillis)

//     def stop(self):
//         """Stop running cycles"""
//         res = self.send(b'\x07', wait=0.2)
//         cycleCompleted = int.from_bytes(res[:4], 'little')
//         temp = int.from_bytes(res[4:4+self.settings['REG_NUM']], 'big')
//         valveStates = []
//         for i in range(8*self.settings['REG_NUM']):
//             valveStates.append((temp >> i) & 1)
//         return cycleCompleted, valveStates

//     def controlValves(self, on=(), off=()):
//         """Control vlaves manually.
        
//         :param list on: a list of valve numbers (int) to turn on
//         :param list off: a list of valve numbers (int) to turn off
//         """
//         onBytes = 0
//         for i in on:
//             onBytes |= (1 << (i-1))
//         offBytes = 0
//         for i in off:
//             offBytes |= (1 << (i-1))
//         maskBytes = onBytes | offBytes
        
//         data = onBytes.to_bytes(self.settings['REG_NUM'], 'big')
//         mask = maskBytes.to_bytes(self.settings['REG_NUM'], 'big')
//         self.send(b'\x08' + data + mask)

//     def clearShiftRegister(self):
//         """Reset shift register outputs"""
//         self.send(b'\x09')

//     def clear(self):
//         """Reset shift register outputs and all parameters"""
//         self.send(b'\x0A')

//     def updateEEPROM(self, addr, data):
//         """Set the parameters in EEPROM. 
        
//         :param int addr: address in EEPROM, range 0-255
//         :param data bytes: the data to write onto EEPROM
//         """
//         self.send(b'\x0B' + int(addr).to_bytes(1, 'little') + data)

//     def restart(self):
//         """Restart Arduino. 
//         It does not do anything to the peripheral circuits. 
//         """
//         self.send(b'\x0C')

//     def getEEPROMSettings(self):
//         """Get the settings in EEPROM.
        
//         There are 6 bytes in total. 
//         Byte 0: EEPROM_RESET_FLAG
//         Byte 1: REG_NUM
//         Byte 2: STATE_NUM
//         Byte 3: PHASE_NUM
//         Byte 4: BEFORE_PHASE_NUM
//         Byte 5: AFTER_PHASE_NUM
//         """
//         res = self.send(b'\x0E', wait=0.1)[:-2]
//         return {
//             'EEPROM_RESET_FLAG': res[0], 
//             'REG_NUM': res[1], 
//             'STATE_NUM': res[2], 
//             'PHASE_NUM': res[3],
//             'BEFORE_PHASE_NUM': res[4],
//             'AFTER_PHASE_NUM': res[5]
//         }
