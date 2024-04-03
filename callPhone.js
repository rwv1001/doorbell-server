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
    var usb_path = '';
    child.exec("./findFTDI", (error, stdout, stderr)=>{
    
    console.log("Error is: "+ error);
    console.log("Stdout is: " + stdout);
    console.log("sterr is: "+stderr);
    if(stdout){
      usb_path = stdout;
    }

    });
    console.log('The usb path is now: '+usb_path);

    const output = new DigitalOutput('P1-16');
    console.log('start listening on serial')
    parser.on("data", (line) => {console.log(line)
    switch(parseInt(line)) {
      case 1:
        console.log("We got 1")
        output.write(1);
        io.emit('message', `We got 1`)
        // code block
        break;
      default:
        console.log("We got something else")
        output.write(0);
        // code block
    }
});
});

function sim_power_on(power_key){


}








