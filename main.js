'use strict';

const electron = require('electron');
const path = require('path');
const url = require('url');
const {ValveControlDevice} = require('./valve_control.js');
const mainMenu = require('./mainMenu.js');

const {app, BrowserWindow, Menu, ipcMain} = electron;
process.env.NODE_ENV = 'dev'

let mainWindow;
let connectWindow;
let device;

app.on('ready', () => {
  // the main window does not show first 
  mainWindow = new BrowserWindow({show: false});
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'index.html'),
    protocol: 'file',
    slashes: true
  }));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    createConnectWindow();
  });

  mainWindow.on('closed', () => {
    app.quit();
  });
});

// create connect window
function createConnectWindow() {
  connectWindow = new BrowserWindow({
    width: 600,
    height: 400,
    title: 'Connect',
    parent: mainWindow,
    modal: true
  });

  connectWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'connect.html'),
    protocol: 'file',
    slashes: true
  }));

  connectWindow.on('closed', () => {
    connectWindow = null;
  });

  // disable menu
  // TODO: change mainWindow to null for production
  Menu.setApplicationMenu(mainMenu);
}

ipcMain.on('device-connect', (e, port) => {
  device = new ValveControlDevice(port);
  device.on('device-ready', (e) => {
    let valveNum = device.arduinoParams.REG_NUM * 8;
    mainWindow.webContents.send('device-ready', valveNum);
  });
  connectWindow.close();
  // Menu.setApplicationMenu(mainMenu);
});

ipcMain.on('close-connect-window', (e) => {
  app.quit();
});

ipcMain.on('valve-control', (e, i, on) => {
  device.controlSingleValve(i, on);
});

ipcMain.on('start-cycles', (e, cycles) => {
  // TODO: replace the next line with actual code
  console.log(cycles);
});

module.exports = {
  mainWindow: mainWindow,
  device: device,
};