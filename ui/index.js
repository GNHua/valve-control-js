'use strict';

const {ipcRenderer} = require('electron');
const $ = require('jquery');
require('popper.js');
require('bootstrap');

// add individual valve control
const formValveControl = document.querySelector('#form-valve-control');
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

// start cycles
const formStartCycle = document.querySelector('#form-start-cycle');
formStartCycle.addEventListener('submit', (e) => {
  e.preventDefault();
  const cycles = document.querySelector('#cycles').value;
  ipcRenderer.send('start-cycles', cycles);
});

