'use strict';

const {app, Menu} = require('electron');

// create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click() {
          createOpenFileWindow();
        }
      }
    ]
  },
  {
    label: 'Device',
    submenu: [
      {
        label: 'Restart Arduino'
      },
      {
        label: 'Turn Off All'
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

function createOpenFileWindow() {
  // TODO: add code here
}

// build menu from template
const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

module.exports = mainMenu;
