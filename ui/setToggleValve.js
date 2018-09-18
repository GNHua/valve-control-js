'use strict';

const {remote, ipcRenderer} = require('electron');


const inputValve = document.querySelector('input');
const buttonClose = document.querySelector('button#close');
const buttonSet = document.querySelector('button#set');
let window = remote.getCurrentWindow();

buttonClose.addEventListener('click', (e) => {
  window.close();
});

buttonSet.addEventListener('click', (e) => {
  let valve = parseInt(inputValve.value, 10);
  ipcRenderer.send('set-toggle-valve', valve);
  window.close();
});