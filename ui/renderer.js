const {ipcRenderer} = require('electron')
const $ = require('jquery')
require('popper.js')
require('bootstrap')
const SerialPort = require('serialport')

$('#connectWindow').on('click', '.clickable-row', function(e) {
  if($(this).hasClass('table-success')) {
    $(this).removeClass('table-success')
  } else {
    $(this).addClass('table-success').siblings().removeClass('table-success')
  }
})

// show all the USB ports in a modal window
ipcRenderer.on('connect', function() {
  let tbody = document.querySelector('#connectWindow tbody')
  SerialPort.list(function(err, ports) {
    for(let i=0; i<ports.length; i++) {
      
      let tr = document.createElement('tr')
      tr.className = 'clickable-row'

      let th = document.createElement('th')
      th.scope = 'row'
      th.appendChild(document.createTextNode(i+1))

      let td1 = document.createElement('td')
      td1.className = 'USB-port'
      td1.appendChild(document.createTextNode(ports[i].comName))

      let td2 = document.createElement('td')
      // TODO: add port info to td2

      tr.appendChild(th)
      tr.appendChild(td1)
      tr.appendChild(td2)
      tbody.appendChild(tr)
    }
    $('#connectWindow').modal('show')
  })
})

$('#connectWindow').on('hidden.bs.modal', function(e) {
  let tbody = document.querySelector('#connectWindow tbody')
  tbody.innerHTML = ''
})

$('#btn-connect-USB').on('click', function(e) {
  $('#connectWindow .table-success :nth-child(2)').each(function(index) {
    ipcRenderer.send('usb-port', $(this).text())
  })
  $('#connectWindow').modal('hide')
})
// TODO: add dblclick to connect

// add individual valve control
const formValveControl = document.querySelector('#form-valve-control')
// TODO: read the actual number of valves from device
for(let i=1; i<=32; i++) {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.className = 'valve-control'
  input.id = 'valve-control' + i
  const inputText = document.createTextNode(i + '\t')
  formValveControl.appendChild(input)
  formValveControl.appendChild(inputText)
}

// start cycles
const formStartCycle = document.querySelector('#form-start-cycle')
formStartCycle.addEventListener('submit', function(e) {
  e.preventDefault()
  const cycles = document.querySelector('#cycles').value
  ipcRenderer.send('start-cycles', cycles)
})

