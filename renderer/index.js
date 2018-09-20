'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog, Menu} = remote;


// add individual valve control
const divValveControl = document.querySelector('div#valve-control');
const buttonStartStop = document.querySelector('button#start-stop-cycles');

ipcRenderer.on('device-ready', (e, valveNum) => {
  divValveControl.innerHTML = '';
  for(let i=1; i<=valveNum; i++) {
    let span = document.createElement('span');
    span.className = 'switch switch-sm';

    let input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'switch';
    input.id = 'switch-sm-' + i;
    span.appendChild(input);

    let label = document.createElement('label');
    let att = document.createAttribute('for');
    att.value = 'switch-sm-' + i; 
    label.setAttributeNode(att);
    label.innerHTML = i;
    span.appendChild(label);

    input.addEventListener('click', (e) => {
      ipcRenderer.send('valve-control', i, input.checked);
    });

    divValveControl.appendChild(span);
  }
});

ipcRenderer.on('device-stopped-completed', (e, cycleCompleted, valveStates) => {
  const valveSwitches = document.querySelectorAll('input.switch');
  valveSwitches.forEach((valveSwitch, index) => {
    valveSwitch.removeAttribute('disabled');
    valveSwitch.checked = valveStates[index];
    buttonStartStop.innerHTML = 'Start';
  });
});


const buttonChooseProgram = document.querySelector('button#choose-program-file');
const inputFileName = document.querySelector('input#program-filename');

// open a program file
buttonChooseProgram.addEventListener('click', (e) => {
  const currentMenu = Menu.getApplicationMenu();
  Menu.setApplicationMenu(new Menu());
  dialog.showOpenDialog(
    remote.getCurrentWindow(),
    {
      title: 'Choose a program',
      multiSelections: false
    },
    (filePaths) => {
      if (filePaths) {
        let fileName = filePaths[0];
        inputFileName.value = fileName;
        buttonStartStop.removeAttribute('disabled');
        ipcRenderer.send('program-selected', fileName);
      }
      Menu.setApplicationMenu(currentMenu);
    }
  );
});

ipcRenderer.on('program-selected', (e, fileName) => {
  inputFileName.value = fileName;
  buttonStartStop.removeAttribute('disabled');
});


const inputCycles = document.querySelector('input#inlineFormInputGroupCycles');
const inputPhase = document.querySelector('input#inlineFormInputGroupPhase');

// start and stop cycles
buttonStartStop.addEventListener('click', (e) => {
  let cycles = parseInt(inputCycles.value, 10);
  let phaseIntervalMillis = parseInt(inputPhase.value, 10);
  let toStart;

  if (buttonStartStop.innerHTML === 'Start') {
    toStart = true;
    buttonStartStop.innerHTML = 'Stop';
  } else {
    toStart = false;
    buttonStartStop.innerHTML = 'Start';
  }
  const valveSwitches = document.querySelectorAll('input.switch');
  valveSwitches.forEach((valveSwitch) => {
    valveSwitch.setAttribute('disabled', true);
  });
  ipcRenderer.send('start-stop-cycles', toStart, cycles, phaseIntervalMillis);
});


const buttonLoadBuiltIn = document.querySelector('button#load-built-in');
const selectBuiltIn = document.querySelector('select#inputGroupSelectBuiltIn');

buttonLoadBuiltIn.addEventListener('click', (e) => {
  let indexBuiltIn = parseInt(selectBuiltIn.value, 10);
  ipcRenderer.send('load-built-in', indexBuiltIn);
});

ipcRenderer.on('set-toggle-valve', (e, valve) => {
  inputFileName.value = `Built-in Program: Toggle Valve ${valve}`;
  buttonStartStop.removeAttribute('disabled');
});

ipcRenderer.on('set-5-phase-pump', (e, inletValve, DC, outletValve) => {
  inputFileName.value = `Built-in Program: 5-Phase Valve (inlet valve: ${inletValve}, DC: ${DC}, outlet valve: ${outletValve})`;
  buttonStartStop.removeAttribute('disabled');
});

ipcRenderer.on('clear-shift-register', () => {
  const valveSwitches = document.querySelectorAll('input.switch');
  valveSwitches.forEach((valveSwitch) => {
    valveSwitch.checked = false;
  });
});