'use strict';

const {ipcRenderer} = require('electron');
const SerialPort = require('serialport');


const tbody = document.querySelector('tbody');

// show all the USB ports in connect window
SerialPort.list().then((ports) => {
  for (let i=0; i<ports.length; i++) {

    let tr = document.createElement('tr');

    let th = document.createElement('th');
    th.scope = 'row';
    th.appendChild(document.createTextNode(i+1));

    let td1 = document.createElement('td');
    td1.className = 'USB-port';
    td1.appendChild(document.createTextNode(ports[i].comName));

    let td2 = document.createElement('td');
    // TODO: add port info to td2

    tr.appendChild(th);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  }
});


const buttonConnect = document.querySelector('button#connect');

tbody.addEventListener('click', (e) => {
  const row = e.target.parentNode;
  if (row.classList.contains('table-success')) {
    row.classList.remove('table-success');
    buttonConnect.setAttribute('disabled', true);
  } else {
    row.classList.add('table-success');
    buttonConnect.removeAttribute('disabled');
  }
});

buttonConnect.addEventListener('click', (e) => {
  const td = document.querySelector('tr.table-success > td.USB-port');
  const port = td.innerHTML;
  ipcRenderer.send('device-connect', port);
});

tbody.addEventListener('dblclick', (e) => {
  const td = e.target.parentNode.querySelector('td.USB-port');
  const port = td.innerHTML;
  ipcRenderer.send('device-connect', port);
});


const buttonClose = document.querySelector('button#close');

buttonClose.addEventListener('click', (e) => {
  ipcRenderer.send('cancel-connect');
});

