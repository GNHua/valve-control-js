'use strict';

const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {ValveControlDevice} = require('./valve_control.js');
const mainMenu = require('./mainMenu.js');

process.env.NODE_ENV = 'dev'

let mainWindow;
let connectWindow;
let toggleValveWindow;
let fivePhasePumpWindow;
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

// create toggle valve window
function createToggleValveWindow() {
  toggleValveWindow = new BrowserWindow({
    width: 300,
    height: 90,
    title: 'Set Toggle Valve',
    parent: mainWindow,
    modal: true
  });

  toggleValveWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'setToggleValve.html'),
    protocol: 'file',
    slashes: true
  }));

  toggleValveWindow.on('closed', () => {
    toggleValveWindow = null;
  });
}

// create set 5 phase pump window
function create5PhasePumpWindow() {
  fivePhasePumpWindow = new BrowserWindow({
    width: 300,
    height: 230,
    title: 'Set 5 Phase Pump',
    parent: mainWindow,
    modal: true
  });

  fivePhasePumpWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'set5PhasePump.html'),
    protocol: 'file',
    slashes: true
  }));

  fivePhasePumpWindow.on('closed', () => {
    fivePhasePumpWindow = null;
  });
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

ipcMain.on('cancel-connect', (e) => {
  app.quit();
});

ipcMain.on('valve-control', (e, i, on) => {
  device.controlSingleValve(i, on);
});

ipcMain.on('program-selected', (e, fileName) => {
  // TODO: remove this line
  console.log(fileName);
  device.makeProgrammableCycle(fileName);
  device.uploadProgram();
});

ipcMain.on('start-stop-cycles', (e, toStart, cycles, phaseIntervalMillis) => {
  if (toStart) {
    // TODO: remove this line
    console.log('start', cycles, phaseIntervalMillis);
    // device.start(cycles, phaseIntervalMillis);
  } else {
    // TODO: remove this line
    console.log('stop');
    // device.stop();
  }
});

ipcMain.on('load-built-in', (e, indexBuiltIn) => {
  switch (indexBuiltIn) {
    case 1:
      createToggleValveWindow();
      break;
    case 2:
      create5PhasePumpWindow();
      break;
  }
});

ipcMain.on('set-toggle-valve', (e, valve) => {
  // TODO: remove this line
  console.log('set-toggle-valve', valve);
  mainWindow.webContents.send('set-toggle-valve', valve);
  // device.loadToggleValveProgram(valve);
});

ipcMain.on('set-5-phase-pump', (e, inletValve, DC, outletValve) => {
  // TODO: remove this line
  console.log('set-5-phase-pump', inletValve, DC, outletValve);
  mainWindow.webContents.send('set-5-phase-pump', inletValve, DC, outletValve);
  // device.load5PhasePumpProgram(inletValve, DC, outletValve);
});

module.exports = {
  mainWindow: mainWindow,
  device: device
};