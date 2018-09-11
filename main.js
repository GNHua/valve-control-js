const electron = require('electron')
const path = require('path')
const url = require('url')
// const SerialPort = require('serialport')
const SerialPort = require('serialport/test')
const MockBinding = SerialPort.Binding
// Create a port and enable the echo and recording.
MockBinding.createPort('/dev/ROBOT', { echo: true, record: true })

const {app, BrowserWindow, ipcMain} = electron

let mainWindow
let device

app.on('ready', function() {
  // the main window does not show first 
  mainWindow = new BrowserWindow({show: false})
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'index.html'),
    protocol: 'file',
    slashes: true
  }))
  mainWindow.once('ready-to-show', function() {
    mainWindow.show()
    mainWindow.webContents.send('connect')
  })

  // create main menu
  require('./mainMenu')

  mainWindow.on('closed', function() {
    app.quit()
  })
})

ipcMain.on('start-cycles', function(e, cycles) {
  // TODO: replace the next line with actual code
  console.log(cycles)
})

ipcMain.on('usb-port', function(e, port) {
  // TODO: connect to USB port
  console.log(port)
  device = new SerialPort('/dev/ROBOT', function (err) {
    if (err) {
      return console.log('Error: ', err.message);
    }
  })
  require('./device')
})

module.exports = {
  'mainWindow': mainWindow,
  'device': device
}