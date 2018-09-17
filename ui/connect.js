'use strict';

const {ipcRenderer} = require('electron');
const $ = require('jquery');
require('popper.js');
require('bootstrap');
const SerialPort = require('serialport');

$('.container-fluid').on('click', '.clickable-row', function(e) {
  console.log($(this));
  if($(this).hasClass('table-success')) {
    $(this).removeClass('table-success');
    $('#btn-connect').prop('disabled', true);
  } else {
    $(this).addClass('table-success').siblings().removeClass('table-success');
    $('#btn-connect').prop('disabled', false);
  }
});

// show all the USB ports in connect window
let tbody = document.querySelector('tbody');
SerialPort.list().then((ports) => {
  for (let i=0; i<ports.length; i++) {

    let tr = document.createElement('tr');
    tr.className = 'clickable-row';

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

$('#btn-connect').on('click', function(e) {
  $('.table-success :nth-child(2)').each(function(index) {
    let port = $(this).text();
    ipcRenderer.send('device-connect', port);
  });
});

tbody.addEventListener('dblclick', function(e) {
  let port = e.target.parentNode.children[1].innerHTML;
  ipcRenderer.send('device-connect', port);
});

$('#btn-close').on('click', (e) => {
  ipcRenderer.send('close-connect-window');
});

