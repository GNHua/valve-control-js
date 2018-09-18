'use strict';

const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
// TODO: use actual valve control module
const {ValveControlDevice} = require('./valve_control_dummy.js');
const {mainMenu, emptyMenu} = require('./mainMenu.js');


process.env.NODE_ENV = 'dev'

let mainWindow;
let connectWindow;
let toggleValveWindow;
let fivePhasePumpWindow;

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
    Menu.setApplicationMenu(mainMenu);
  });

  Menu.setApplicationMenu(emptyMenu);
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
    Menu.setApplicationMenu(mainMenu);
  });

  Menu.setApplicationMenu(emptyMenu);
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
    Menu.setApplicationMenu(mainMenu);
  });

  Menu.setApplicationMenu(emptyMenu);
}

ipcMain.on('device-connect', (e, port) => {
  app.device = new ValveControlDevice(port);
  app.device.on('device-ready', (e) => {
    let valveNum = app.device.arduinoParams.REG_NUM * 8;
    mainWindow.webContents.send('device-ready', valveNum);
  });
  connectWindow.close();
});

ipcMain.on('cancel-connect', (e) => {
  app.quit();
});

ipcMain.on('valve-control', (e, i, on) => {
  app.device.controlSingleValve(i, on);
});

ipcMain.on('program-selected', (e, fileName) => {
  console.log(fileName); // TODO: remove this line
  app.device.makeProgrammableCycle(fileName);
  app.device.uploadProgram();
});

ipcMain.on('start-stop-cycles', (e, toStart, cycles, phaseIntervalMillis) => {
  if (toStart) {
    app.device.start(cycles, phaseIntervalMillis); // TODO: uncomment this line
  } else {
    app.device.stop(); // TODO: uncomment this line
  }
});

ipcMain.on('load-built-in', (e, builtInProgramIndex) => {
  switch (builtInProgramIndex) {
    case 1:
      createToggleValveWindow();
      break;
    case 2:
      create5PhasePumpWindow();
      break;
  }
});

ipcMain.on('set-toggle-valve', (e, valve) => {
  // console.log('set-toggle-valve', valve); // TODO: remove this line
  mainWindow.webContents.send('set-toggle-valve', valve);
  app.device.loadToggleValveProgram(valve); // TODO: uncomment this line
});

ipcMain.on('set-5-phase-pump', (e, inletValve, DC, outletValve) => {
  // console.log('set-5-phase-pump', inletValve, DC, outletValve); // TODO: remove this line
  mainWindow.webContents.send('set-5-phase-pump', inletValve, DC, outletValve);
  app.device.load5PhasePumpProgram(inletValve, DC, outletValve); // TODO: uncomment this line
});
