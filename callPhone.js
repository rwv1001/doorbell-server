import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
const port = new SerialPort({ path: '/dev/ttyS0', baudRate: 115200 });
const parser =  new ReadlineParser({ delimiter: '\n'});
port.pipe(parser);

const phone_number = '07453758526'
const power_key = 6
const rec_buff = ''



import { init } from 'raspi';
import { DigitalOutput } from 'raspi-gpio';
import * as child from 'child_process';




init(() => {
    const relay = new DigitalOutput('P1-18');
    sim_power_on()
    console.log('start listening on serial')
    parser.on("data", (line) => {
      console.log("data, got line: " + line)
      if(line.startsWith("VOICE CALL: BEGIN")) {
         relay.write(1);
      }
      if(line.startsWith("VOICE CALL: END")) {
         relay.write(0);
      }
    });
    setTimeout(() => {
      console.log("Let's try to make a call");
      port.write(`AT+CLVL=2\r\n`);
      setTimeout(() => {
       port.write(`ATD${phone_number};\r\n`);
       setTimeout(() => { 
         console.log("Writing AT+CECH=?\r\n");
         port.write(`AT+SIDET=0\r\n`);
       }, 15000)
      },2000)

    }, 24000)
});

function sim_power_on(){
    const output = new DigitalOutput('P1-31');
    //const relay = new DigitalOutput('P1-18');

    console.log('begin sim_power_on()')
    setTimeout(() => {
      output.write(1);
      console.log('set to HIGH')
      //relay.write(1);
      setTimeout(() => {
        output.write(0)
        console.log('set to LOW')
        //relay.write(0)
        setTimeout(() => {
        console.log('SIM7600X is ready')
        }, 20000)
      },2000)  
    }, 100)


}








