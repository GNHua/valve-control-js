'use strict';

const {app, Menu, dialog, BrowserWindow} = require('electron');

// create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click(menuItem, focusedWindow, event) {
          createOpenFileWindow(focusedWindow);
        }
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
          focusedWindow.close();
        }
      },
      {
        label: 'Start'
      },
      {
        label: 'Stop'
      },
      {
        label: 'Shift Register',
        submenu: [
          {
            label: '1',
            type: 'radio'
          },
          {
            label: '2',
            type: 'radio'
          },
          {
            label: '3',
            type: 'radio'
          },
          {
            label: '4',
            type: 'radio'
          },
          {
            label: '5',
            type: 'radio'
          },
          {
            label: '6',
            type: 'radio'
          }
        ]
      },
      {
        label: 'Serial',
        submenu: [
          {
            label: 'Reset Input'
          },
          {
            label: 'Reset Output'
          }
        ]
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Documentation',
        click () {
          electron.shell.openExternal('https://electronjs.org');
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
        click(item, focusedWindow) {
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
  // TODO: add code here
  dialog.showOpenDialog(
    new BrowserWindow({
      show: false,
      alwaysOnTop: true,
      parent: focusedWindow,
      modal: true
    }),
    {
      title: 'Choose a program',
      multiSelections: false,
      modal: true
    },
    (filePaths) => {
      let fileName = filePaths[0];
      console.log(fileName);
    }
  );
}

// build menu from template
const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
const emptyMenu = new Menu();

module.exports = {
  mainMenu: mainMenu,
  emptyMenu: emptyMenu
};