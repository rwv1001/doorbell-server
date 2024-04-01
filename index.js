

import { createServer } from "http"
import { Server } from "socket.io"

const httpServer = createServer()

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
})

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
const port = new SerialPort({ path: '/dev/ttyUSB5', baudRate: 115200 });
const parser =  new ReadlineParser({ delimiter: '\n'});
port.pipe(parser);


import { init } from 'raspi';
import { DigitalOutput } from 'raspi-gpio';
import {PythonShell} from 'python-shell';
import axios from 'axios';



init(() => {


    const output = new DigitalOutput('P1-16');

//  output.write(true);
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
    }});


    io.on('connection', socket => {
      console.log(`User ${socket.id} connected`)
      socket.on('updateSettings', (id, newJSONData, oldJSONData) => {
        console.log('update settings please!')
        console.log('id: '+ id)
        console.log('newJSON: ' + newJSONData)
        console.log('oldJSON: ' + oldJSONData)
        const newData = JSON.parse(newJSONData);
        const oldData = JSON.parse(oldJSONData);
        console.log("new data is: " + newData);
        console.log("old data is: " + oldData); 
        if(newData.name!= oldData.name) {
          console.log("name has changed to "+ newData.name);
          var arg1 = newData.name + " did not answer. Please try someone else.";
          var arg2 = id+"-noAnswer.mp3"
          generateMP3(arg1, arg2);
        }
        if(newData.RequestMsg!= oldData.RequestMsg) {
          console.log("RequestMsg has changed to "+ newData.RequestMsg);
          var arg1 = newData.RequestMsg;
          var arg2 = id+"-RequestMsg.mp3";
          generateMP3(arg1, arg2);
        }
        if(newData.WaitMsg!=oldData.WaitMsg) {
          console.log("WaitMsg has changed to "+ newData.WaitMsg);
          var arg1 = newData.WaitMsg;
          var arg2 = id+"-WaitMsg.mp3";
          generateMP3(arg1, arg2);
        }
        if(newData.ReplyMsg!=oldData.ReplyMsg) {
          console.log("ReplyMsg has changed to "+ newData.ReplyMsg);
          var arg1 = newData.ReplyMsg;
          var arg2 = id+"-ReplyMsg.mp3";
          generateMP3(arg1, arg2);
        }
        if(newData.ResponseMsg!=oldData.ResponseMsg) {
          console.log("ResponseMsg has changed to "+ newData.ResponseMsg);
          var arg1 = newData.ResponseMsg;
          var arg2 = id+"-ResponseMsg.mp3";
          generateMP3(arg1, arg2);
        }
     

        const result = axios.put("http://192.168.1.47:3000/settings/"+id,{
          name:newData.name,
          RequestMsg:newData.RequestMsg,
          WaitMsg:newData.WaitMsg,
          ReplyMsg:newData.ReplyMsg,
          ResponseMsg:newData.ResponseMsg,
          Phone:newData.Phone,
          PhoneNumber:newData.PhoneNumber
        });

         
      });
    });


//    socket.on('message', data => {
//        console.log(data)
//        io.emit('message', `${socket.id.substring(0, 5)}: ${data}`)
//    })
    
})

function generateMP3(arg1, arg2){
   console.log("arg1: "+ arg1);
   console.log("arg2: "+ arg2);
 
   let options={
         scriptPath: "/home/pi/server",
         args:[arg1, "/home/pi/vue3-doorbell-receiver/src/assets/"+arg2]
       }
       PythonShell.run("TextToAudio.py", options, (err,res)=>{
         if(err){
            console.log(err)
         }
         if(res){
            console.log("We are here")
            console.log(res)
         }
       })
   console.log("generateMP3 complete")
}



httpServer.listen(3500, () => console.log('listening on port 3500'))
