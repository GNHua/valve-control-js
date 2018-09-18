'use strict';

const {remote, ipcRenderer} = require('electron');

const inputInletValve = document.querySelector('input#inlet-valve');
const inputDC = document.querySelector('input#DC');
const inputOutletValve = document.querySelector('input#outlet-valve');
const buttonClose = document.querySelector('button#close');
const buttonSet = document.querySelector('button#set');
let window = remote.getCurrentWindow();

buttonClose.addEventListener('click', (e) => {
  window.close();
});

buttonSet.addEventListener('click', (e) => {
  let inletValve = parseInt(inputInletValve.value, 10);
  let DC = parseInt(inputDC.value, 10);
  let outletValve = parseInt(inputOutletValve.value, 10);
  ipcRenderer.send('set-5-phase-pump', inletValve, DC, outletValve);
  window.close();
});