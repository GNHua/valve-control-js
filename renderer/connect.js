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

    tr.appendChild(th);
    tr.appendChild(td1);
    tbody.appendChild(tr);
  }
});


const buttonConnect = document.querySelector('button#connect');

tbody.addEventListener('click', (e) => {
  if (e.target.tagName.toLowerCase() === 'tbody') {
    return;
  }
  const clickedRow = e.target.parentNode;
  if (clickedRow.classList.contains('table-success')) {
    clickedRow.classList.remove('table-success');
    buttonConnect.setAttribute('disabled', true);
  } else {
    clickedRow.parentNode.childNodes.forEach((row) => {
      if (row.classList) {
        row.classList.remove('table-success');
      }
    });
    clickedRow.classList.add('table-success');
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

