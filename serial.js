import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
const parser =  new ReadlineParser({ delimiter: '\n'});
port.pipe(parser);


import { init } from 'raspi';
import { DigitalOutput } from 'raspi-gpio';



init(() => {


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
      case 2:
        console.log("We got 2")
        output.write(1);
        // code block
        break;
      case 3:
        console.log("We got 3")
        output.write(1);
        // code block
        break;
      case 4:
        console.log("We got 4")
        output.write(1);
        // code block
        break;
      case 5:
        console.log("We got 5")
        output.write(1);
        // code block
        break;
      case 6:
        console.log("We got 6")
        output.write(1);
        // code block
        break;
      case 7:
        console.log("We got 7")
        output.write(1);
        // code block
        break;
      case 8:
        console.log("We got 8")
        output.write(1);
        // code block
        break;
      case 9:
        console.log("We got 9")
        output.write(1);
        // code block
        break;
      case 10:
        console.log("We got 10")
        output.write(1);
        // code block
        break;
      default:
        console.log("We got something else")
        output.write(0);
        // code block
    }
});
});









