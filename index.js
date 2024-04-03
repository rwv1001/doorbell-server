

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
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
const parser =  new ReadlineParser({ delimiter: '\n'});
port.pipe(parser);


import { init } from 'raspi';
import { DigitalOutput } from 'raspi-gpio';
import {PythonShell} from 'python-shell';
import axios from 'axios';
import { uuid } from 'vue-uuid'
import moment from 'moment';

const assets_path = '/home/pi/vue3-doorbell-receiver/src/assets/';
const TIME_OUT_DURATION = 1/2*60;
const MESSAGE_TIME_OUT_DURATION = 10;
var message_tick = 0; 
var current_button = 0;
var idle = true;
var waiting_for_gui_response = 0;
var waiting_for_call_response = 0;
var gui_responded = 0;
var call_in_progress = 0;
var call_not_answered = 0;
var gui_no_response = 0;
var time_out_time = 0;
var button_data = null;
var message_list = [];
var current_message_uuid = 0;
var calling_fetch = false;
var until = new Date(); 
var new_press = true;
var new_message_timeout= moment();
var mp3_message_to_browser ='';
var user_generator = 0;
const MAX_MESSAGES = 5;
import fs from "fs";
import * as child from 'child_process';
import {useDateFormat, useNow} from "@vueuse/core";
init(() => {

    const output = new DigitalOutput('P1-16');
    

//  output.write(true);
    parser.on("data", (line) => {console.log(line)
    switch(parseInt(line)) {
      case 1:
        var button_number = '1';
        idle = false;
        if(new_press) {
           new_press = false;
           let mp3_file_name = assets_path+button_number+"-WaitMsg.mp3";
           if(fs.existsSync(mp3_file_name)) {
             console.log("play file " +  mp3_file_name);
             child.exec("play " + mp3_file_name + " tempo 1.2");
           } else {
             console.log("Can't find file" + mp3_file_name);
           }
        }
        let now = new Date();
        let new_message_remain = moment.duration(Date.parse(new_message_timeout) - now)
        console.log("new_message_remain: " +  new_message_remain)
        if(waiting_for_gui_response != parseInt(button_number) || new_message_remain < 0 ){
           new_message_timeout = moment().add(MESSAGE_TIME_OUT_DURATION, 'seconds');
           message_tick=0;
           until = moment().add(TIME_OUT_DURATION, 'seconds');
           waiting_for_gui_response = parseInt(button_number);
           if(!calling_fetch){
             calling_fetch = true; 
             fetch('http://192.168.1.47:3000/settings/'+button_number).then(res => res.json()).then(data => {
               button_data = data; 
               current_message_uuid = uuid.v4();
               const current_time = useDateFormat(useNow(), "HH:mm:ss").value;
               let new_msg = "("+current_time+") " + button_data.RequestMsg;
               console.log("New Message is: "+new_msg);
               message_list.push(new_msg)
               if(message_list.length >  MAX_MESSAGES) {
                 message_list.splice(0,1);   
               } 
               mp3_message_to_browser = button_number+"-RequestMsg.mp3";
               user_generator = 0;
               io.emit('message_list', current_message_uuid, message_list, mp3_message_to_browser, user_generator)

               calling_fetch = false;
             }).catch(err => console.log(err.message))
           }

        } else {
            message_tick++;
            if(message_tick %4 == 0) {
                io.emit('message_list', current_message_uuid, message_list, mp3_message_to_browser, user_generator)
            }
        }
        output.write(1);
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
        if(idle == false) {
           let now = new Date();
           let remaining = moment.duration(Date.parse(until) - now)
           if(remaining > 0){
              message_tick++;
              if(message_tick %4 == 0) {
                 io.emit('message_list', current_message_uuid, message_list, mp3_message_to_browser, user_generator)
              }
           } else {
              idle = true;
              message_list = [];
              waiting_for_gui_response = 0;
              waiting_for_call_response = 0;
              gui_responded = 0;
              call_in_progress = 0;
              call_not_answered = 0;
              gui_no_response = 0;
              time_out_time = 0;
              button_data = null;
              message_list = [];
              current_message_uuid = 0;
              io.emit('doorbell_idle')
           }
        }
        new_press = true;

        console.log("We got something else")
        output.write(0);
        // code block
    }});


    io.on('connection', socket => {
      console.log(`User ${socket.id} connected`)
      socket.on('answered', (id)=> {
        console.log('Answered received with id '+ id);
        
      });


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
