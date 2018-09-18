'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog} = remote;
const fs = require('fs'); 
// const $ = require('jquery');
// require('popper.js');
require('bootstrap');


// add individual valve control
const formValveControl = document.querySelector('div#valve-control');

// TODO: read the actual number of valves from device
ipcRenderer.on('device-ready', (e, valveNum) => {
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

    formValveControl.appendChild(span);
  }
});


const buttonChooseProgram = document.querySelector('button#choose-program-file');
const inputFileName = document.querySelector('input#program-filename');
const buttonStartStop = document.querySelector('button#start-stop-cycles');

// open a program file
buttonChooseProgram.addEventListener('click', (e) => {
  dialog.showOpenDialog({title: 'Choose a program', multiSelections: false}, (filePaths) => {
    let fileName = filePaths[0];
    inputFileName.value = fileName;
    ipcRenderer.send('program-selected', fileName);
    buttonStartStop.removeAttribute('disabled');
  });
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
});

ipcRenderer.on('set-5-phase-pump', (e, inletValve, DC, outletValve) => {
  inputFileName.value = `Built-in Program: 5-Phase Valve (inlet valve: ${inletValve}, DC: ${DC}, outlet valve: ${outletValve})`;
});
