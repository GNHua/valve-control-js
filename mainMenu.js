'use strict';

const {app, Menu, MenuItem, dialog, shell} = require('electron');

// create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    id: 'file',
    submenu: [
      {
        label: 'Open...',
        id: 'open',
        accelerator: 'CmdOrCtrl+O',
        click(menuItem, focusedWindow, event) { createOpenFileWindow(focusedWindow); }
      }
    ]
  },
  {
    label: 'Device',
    submenu: [
      {
        label: 'Restart Arduino',
        click() { app.device.restart(); }
      },
      {
        label: 'Turn Off All',
        click(menuItem, focusedWindow, event) {
          app.device.clearShiftRegister();
          focusedWindow.webContents.send('clear-shift-register');
        }
      },
      {
        label: 'Flush Serial Port',
        click() { app.device.flush(); }
      },
      {
        label: 'Shift Register',
        id: 'shift-register',
        submenu: [] // populated below
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Documentation',
        click () {
          shell.openExternal('https://github.com/GNHua/valve-control-js');
        }
      }
      // TODO: add update
    ]
  }
];

if(process.platform == 'darwin') {
  mainMenuTemplate.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  });
}

if(process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: 'CmdOrCtrl+I',
        click(menuItem, focusedWindow, event) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}

function createOpenFileWindow(focusedWindow) {
  Menu.setApplicationMenu(emptyMenu);
  dialog.showOpenDialog(
    focusedWindow,
    {
      title: 'Choose a program',
      multiSelections: false
    },
    (filePaths) => {
      if (filePaths) {
        let fileName = filePaths[0];
        app.device.makeProgrammableCycle(fileName);
        app.device.uploadProgram();
        focusedWindow.webContents.send('program-selected', fileName);
      }
      Menu.setApplicationMenu(mainMenu);
    }
  );
}

function changeShiftRegisterNum(focusedWindow, n) {
  if (app.device.arduinoParams.REG_NUM === n) {
    return;
  }
  app.device.setRegNum(n);
  let valveNum = n * 8;
  focusedWindow.webContents.send('device-ready', valveNum);
}

// build menu from template
const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

for (let i=1; i<=6; i++) {
  const subMenuSR = mainMenu.getMenuItemById('shift-register');
  subMenuSR.submenu.append(
    new MenuItem({
      label: String(i),
      id: 'shift-register-' + i,
      type: 'radio',
      click(menuItem, focusedWindow, event) {
        changeShiftRegisterNum(focusedWindow, i);
      }
    })
  );
}

module.exports = {
  mainMenu: mainMenu
};