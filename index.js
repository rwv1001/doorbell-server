import { createServer } from "http";
import { Server } from "socket.io"
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
import { init } from 'raspi';
import { DigitalOutput } from 'raspi-gpio';
import {PythonShell} from 'python-shell';
import axios from 'axios';
import { uuid } from 'vue-uuid'
import moment from 'moment';
import fs from "fs";
import * as child from 'child_process';
import {useDateFormat, useNow} from "@vueuse/core";
import util from "util";




const exec = util.promisify(child.exec);
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: ["https://cambdoorbell.duckdns.org","https://test.cambdoorbell.duckdns.org","https://socket.cambdoorbell.duckdns.org","http://cambdoorbell.duckdns.org:8080","http://192.168.1.47:8080","https://192.168.1.47:8080"],
        methods: ["GET", "POST"], // Add any other HTTP methods you want to allow
        allowedHeaders: ["Content-Type"], // Add any other headers you want to allow
        credentials: true // If you need to send cookies or use authentication
//          origin: "*"
    }
})


const assets_path = '/home/pi/vue3-doorbell-receiver/src/assets/';
const TIME_OUT_DURATION = 1/2*60;
const INTERCOM_TIME_OUT_DURATION = 60;
const MESSAGE_TIME_OUT_DURATION = 10;
const BUTTON_GENERATOR = 0;
const CALL_FETCH_TIMEOUT = 3000;
const ASSETS_DIR = "/home/pi/vue3-doorbell-receiver/src/assets/"
var message_tick = 0; 
var idle = true;
var request_answered = false;
var current_button = 0;
var waiting_for_gui_response = 0;
var message_list = [];
var intercomClientId = 0;
var current_message_uuid = 0;
var until = new Date(); 
var new_press = true;
var new_message_timeout= moment();
var mp3MessageToBrowser ='';
var userGenerator = 0;
const MAX_MESSAGES = 5;
var heart_beat_tick = 0;
const names = [];
const RequestMsgs = [];
const WaitMsgs = [];
const ReplyMsgs = [];
const ResponseMsgs = [];
const IntercomMsgs = [];
const NoAnswerFiles = [];
const RequestMsgFiles = [];
const WaitMsgFiles = [];
const ReplyMsgFiles = [];
const ResponseMsgFiles = [];
const IntercomMsgFiles = [];
var loaded_json_data = false;

//const audioContext = new AudioContext();
//const fileReader = new FileReader();

// Set up file reader on loaded end event
//fileReader.onloadend = () => {
//    const arrayBuffer = fileReader.result
    // Convert array buffer into audio buffer
///    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {    
      // Do something with audioBuffer
//      console.log(audioBuffer)    
//    })      
//}


getFTDIPath().then(
FTDIPath => {console.log("getFTDIPath() return "+ FTDIPath)
FTDIPath = '/dev/ttyS0'
setTimeout(() => {console.log("1 second timeout")
init(() => {
    const output = new DigitalOutput('P1-16');
    const port = new SerialPort({ path: FTDIPath, baudRate: 115200 });
    const parser =  new ReadlineParser({ delimiter: '\n'});
    port.pipe(parser);
    fetchData()
    

//  output.write(true);
    parser.on("data", (line) => {console.log(line)
    heart_beat_tick++;
    if(heart_beat_tick %100 == 0 && !loaded_json_data){
      console.log('Try to fetch data')
      fetchData()
    } 

    if(heart_beat_tick %100 == 0 && !offer){
      console.log('We have no offer, so reset offer')
      io.emit('resetOffer')
      
    }
    
 
    if(isNaN(line) || parseInt(line)>10 || parseInt(line)<1){
        //console.log("Either line not a number or is outside of range")
        if(idle == false) {
           let now = new Date();
           let remaining = moment.duration(Date.parse(until) - now)
           console.log("The remaining time for emitting message list is "+ remaining)
           if(remaining > 0  ){
              message_tick++;
              if(message_tick %4 == 0) {
                 io.emit('messageListMsg', current_message_uuid, message_list, mp3MessageToBrowser, userGenerator, intercomClientId)
              }
           } else {
                if(!request_answered) {
                   let mp3_file_name = NoAnswerFiles[current_button-1];
                   playMP3(mp3_file_name)
                }
                request_answered = false;
                console.log("now idle")
                current_button = 0;
                idle = true;
                message_list = [];
                mp3MessageToBrowser = '';
                waiting_for_gui_response = 0;
                current_message_uuid = 0;
                intercomClientId = 0;
                userGenerator = 0;
                io.emit('messageListMsg', current_message_uuid, message_list, mp3MessageToBrowser, userGenerator, intercomClientId)
           }
        } else {
          if(heart_beat_tick %4 == 0){
            console.log('idle message sent, current_message_uuid = '+ current_message_uuid);
            io.emit('messageListMsg', current_message_uuid, message_list, mp3MessageToBrowser, userGenerator, intercomClientId)
          }

        }
        new_press = true;

        // console.log("We got something else")
        output.write(0);

    }
    else {
        buttonPress(parseInt(line).toString(),output)
    }

    });
    let offer = null
    let offererSocketId = 0;
    let offererUserName = 0;
    // = [
      // offererUserName
      // offer
      // offerIceCandidates
      // answererUserName
      // answer
      // answererIceCandidates
    //];
    const connectedSockets = [
       //username, socketId
    ];
    io.on('connection', socket => {
      let offerer = false;
      const userName = socket.handshake.auth.userName;
      const password = socket.handshake.auth.password;
      console.log("New connection username is: "+ userName)
      connectedSockets.push({
        socketId: socket.id,
        userName
      })
      console.log("number of elements in connectedSockets = " + connectedSockets.length)
      if(offer){
        console.log("Sending out sendOff");
        if(offer.offereUserName === userName){
          offererSocketId = socket.id;
          offerer = true;
        }
        socket.emit('sendOffer',offer);
      } else {
        console.log("No offer to send");
      }
      
      socket.on('newOffer',newOffer=>{
        console.log("***************** Handling new offer ****************************")
        offer={
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        }
        offererSocketId=socket.id;
        offerer = true;
        socket.emit('sendOfferAcknowledgment')
        console.log("newoffer Handler: offererSocketId = " + offererSocketId)
        // console.log(newOffer.sdp.slice(50))
        //send out to all connected sockets EXCEPT the caller
        console.log("Broadcasting sendOffer")
        socket.broadcast.emit('sendOffer',offer)
      })
      socket.on('newAnswer',(offerObj,ackFunction)=>{
        console.log("Handling newAnswer")
        console.log(offerObj);
        //emit this answer (offerObj) back to CLIENT1
        //in order to do that, we need CLIENT1's socketid
        const socketToAnswer = connectedSockets.find(s=>s.userName === offerObj.offererUserName)
        if(!socketToAnswer){
            console.log("No matching socket")
            return;
        }
        //we found the matching socket, so we can emit to it!
        const socketIdToAnswer = socketToAnswer.socketId;
        console.log("newAnswer Handler: socketIdToAnswer = " + socketIdToAnswer +",  offererSocketId = " +  offererSocketId)
        //we find the offer to update so we can emit it
        if(!offer){
            console.log("No OfferToUpdate")
            return;
        }
        //send back to the answerer all the iceCandidates we have already collected
        ackFunction(offer.offerIceCandidates);
        offer.answer = offerObj.answer
        console.log("Setting offer.answererUserName to " + userName)
        offer.answererUserName = userName
        //socket has a .to() which allows emiting to a "room"
        //every socket has it's own room
        console.log("emitting answerResponse")
        socket.to(socketIdToAnswer).emit('answerResponse',offer)
        console.log("newAnswer offer after update:")
        console.log(offer);
      })
      socket.on('sendIceCandidateToSignalingServer',iceCandidateObj=>{
        console.log("Handling sendIceCandidateToSignalingServer")
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
        console.log("didIOffer = " + didIOffer + ", iceUserName = " + iceUserName )
        // console.log(iceCandidate);
        if(didIOffer){
            //this ice is coming from the offerer. Send to the answerer
            if(offer && offer.offererUserName === iceUserName){
                offer.offerIceCandidates.push(iceCandidate)
                // 1. When the answerer answers, all existing ice candidates are sent
                // 2. Any candidates that come in after the offer has been answered, will be passed through
                if(offer.answererUserName){
                    //pass it through to the other socket
                    const socketToSendTo = connectedSockets.find(s=>s.userName === offer.answererUserName);
                    console.log("didIOffer = true, username = " + offer.answererUserName + ", socketToSendTo = " + socketToSendTo.socketId +",  offererSocketId = " +  offererSocketId)
                    if(socketToSendTo){
                        console.log("Send receivedIceCandidateFromServer message")
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
                    }else{
                        console.log("Ice candidate recieved but could not find answere")
                    }
                }
            }
        }else{
            //this ice is coming from the answerer. Send to the offerer
            //pass it through to the other socket
            if(offer){
               const socketToSendTo = connectedSockets.find(s=>s.userName === offer.offererUserName);
               console.log("didIOffer = false, username = " + offer.offererUserName + ", socketIdToSendTo = " + socketToSendTo.socketId +",  offererSocketId = " +  offererSocketId)
               if(socketToSendTo){
                   console.log("Send receivedIceCandidateFromServer message from answerer")
                   socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
               }else{
                   console.log("Ice candidate recieved but could not find offerer")
               }
            }
            else {
               console.log("There is no offerer!")
            }
        }
        // console.log(offers)
      })
      socket.on('hangupReset', function() {
         console.log('Handling hangupReset')
         if(offer){
           const socketToSendTo = connectedSockets.find(s=>s.userName === offer.offererUserName);
           console.log("Emit resetOffer, socketToSendTo = "+ socketToSendTo.socketId + ", offererSocketId ="+offererSocketId )
           socket.to(socketToSendTo.socketId).emit('resetOffer')
           socket.emit('hangupResponse')
         } 
      })
      //socket.on('requestOffer', function() {
      //   console.log('Handle requestOffer')
      //   if(offer){
      //     socket.emit('sendOffer',offer);           
      //   } else {

      //   }
      //})

      socket.on('disconnect', function() {
         console.log('Got disconnect!');
         offererSocketId = 0;
         let index = connectedSockets.findIndex(socketObj => socketObj.socketId === socket.id);
         connectedSockets.splice(index, 1);
         console.log("Disconnect: number of elements in connectedSockets = " + connectedSockets.length)
      });
      console.log(`User ${socket.id} connected`)
      socket.on('answered', (id)=> {
        console.log('Answered received with id '+ id);
        request_answered = true;
        if(loaded_json_data) {
          console.log("answered: json data available")
          addMessage(ResponseMsgs[id-1], ResponseMsgFiles[id-1], id)
          
          let mp3_file_name = ReplyMsgFiles[id-1];
          playMP3(mp3_file_name)          
        }
      });
      socket.on('updateIntercomClientId', (newIntercomClientId,  currentUserId) => {
        console.log('updatingClientId to '+ newIntercomClientId)
        console.log('currentUserId for intercom is '+ currentUserId)
        request_answered = true;
        intercomClientId = newIntercomClientId;
        if(newIntercomClientId != 0) {
          socket.join(newIntercomClientId);
          until = moment().add(INTERCOM_TIME_OUT_DURATION, 'seconds');
          console.log("updateIntercomClientId: calling fetch set to true")
          if(loaded_json_data) {
            console.log("answered: json data available")
            addMessage(IntercomMsgs[currentUserId-1], IntercomMsgFiles[currentUserId-1], currentUserId)
          }
        }
      });
      socket.on('webClientAudioData', (data) => {
//        fileReader.readAsArrayBuffer(data)
        console.log("We have received audio data");
      }) 

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
          var arg2 = id+"-noAnswer-"+getRandomNumber()+".mp3"
          newData.noAnswerFile = arg2;
          NoAnswerFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-noAnswer-*");
          child.exec("rm -f " +assets_path+ id+"-noAnswer-*");
          generateMP3(arg1, arg2);
        } else {
          newData.noAnswerFile=NoAnswerFiles[id-1];
        } 
        if(newData.RequestMsg!= oldData.RequestMsg) {
          console.log("RequestMsg has changed to "+ newData.RequestMsg);
          var arg1 = newData.RequestMsg;
          RequestMsgs[id-1] = arg1;
          var arg2 = id+"-RequestMsg-"+getRandomNumber()+".mp3";
          newData.RequestMsgFile = arg2;
          RequestMsgFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-RequestMsg-*");
          child.exec("rm -f " +assets_path+ id+"-RequestMsg-*");
           generateMP3(arg1, arg2);
        } else {
          console.log("I am here!")
          newData.RequestMsgFile=RequestMsgFiles[id-1];
        }
        if(newData.WaitMsg!=oldData.WaitMsg) {
          console.log("WaitMsg has changed to "+ newData.WaitMsg);
          var arg1 = newData.WaitMsg;
          WaitMsgs[id-1] = arg1;
          var arg2 = id+"-WaitMsg-"+getRandomNumber()+".mp3";
          newData.WaitMsgFile = arg2;
          WaitMsgFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-WaitMsg-*");
          child.exec("rm -f " +assets_path+ id+"-WaitMsg-*");
          generateMP3(arg1, arg2);
        } else {
          newData.WaitMsgFile=WaitMsgFiles[id-1];
        }
        if(newData.ReplyMsg!=oldData.ReplyMsg) {
          console.log("ReplyMsg has changed to "+ newData.ReplyMsg);
          var arg1 = newData.ReplyMsg;
          ReplyMsgs[id -1] = arg1;
          var arg2 = id+"-ReplyMsg-"+getRandomNumber()+".mp3";
          newData.ReplyMsgFile = arg2;
          ReplyMsgFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-ReplyMsg-*");
          child.exec("rm -f " +assets_path+ id+"-ReplyMsg-*");
          generateMP3(arg1, arg2);
        } else {
          newData.ReplyMsgFile=ReplyMsgFiles[id-1];
        }
        if(newData.ResponseMsg!=oldData.ResponseMsg) {
          console.log("ResponseMsg has changed to "+ newData.ResponseMsg);
          var arg1 = newData.ResponseMsg;
          ResponseMsgs[id-1] = arg1;
          var arg2 = id+"-ResponseMsg-"+getRandomNumber()+".mp3";
          newData.ResponseMsgFile = arg2;
          ResponseMsgFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-ResponseMsg-*");
          child.exec("rm -f " +assets_path+ id+"-ResponseMsg-*");
          generateMP3(arg1, arg2);
        } else {
          newData.ResponseMsgFile=ResponseMsgFiles[id-1];
        }
        if(newData.IntercomMsg!=oldData.IntercomMsg) {
          console.log("IntercomMsg has changed to "+ newData.IntercomMsg);
          var arg1 = newData.IntercomMsg;
          IntercomMsgs[id-1] = arg1;
          var arg2 = id+"-IntercomMsg-"+getRandomNumber()+".mp3";
          newData.IntercomMsgFile = arg2;
          IntercomMsgFiles[id-1] = arg2;
          console.log("calling: rm -f "+ assets_path+id+"-IntercomMsg-*");
          child.exec("rm -f " +assets_path+ id+"-IntercomMsg-*");
          generateMP3(arg1, arg2);
        } else {
          newData.IntercomMsgFile=IntercomMsgFiles[id-1];
        }     
        console.log("Axios update")
         const result = axios.put("http://cambdoorbell.duckdns.org:3000/settings/"+id,{
           name:newData.name,
           RequestMsg:newData.RequestMsg,
           WaitMsg:newData.WaitMsg,
           ReplyMsg:newData.ReplyMsg,
           ResponseMsg:newData.ResponseMsg,
           IntercomMsg:newData.IntercomMsg,
           NoAnswerFile:newData.noAnswerFile,
           RequestMsgFile:newData.RequestMsgFile,
           WaitMsgFile:newData.WaitMsgFile,
           ReplyMsgFile:newData.ReplyMsgFile,
           ResponseMsgFile:newData.ResponseMsgFile,
           IntercomMsgFile:newData.IntercomMsgFile,
           Phone:newData.Phone,
           PhoneNumber:newData.PhoneNumber,
          }).catch(error => console.error(error));
      });
      
    });


//    socket.on('message', data => {
//        console.log(data)
//        io.emit('message', `${socket.id.substring(0, 5)}: ${data}`)
//    })
    
})
}, 1000);
})
async function getFTDIPath() {
    try {
        const { stdout } = await exec('find /sys/bus/usb/devices/usb*/ -name dev');
        const sysdevpaths = stdout.split('\n').filter(Boolean);

        for (const sysdevpath of sysdevpaths) {
            const syspath = sysdevpath.toString().replace(/\/dev(?!.*\/dev)/, "");
            const { stdout: udevInfo } = await exec(`udevadm info -q property --export -p ${syspath}`);
            const properties = udevInfo.split('\n').filter(Boolean);

            const idSerialProperty = properties.find(prop => prop.startsWith('ID_SERIAL='));

            if (idSerialProperty && idSerialProperty.includes('FTDI')) {
                const devProperty =  properties.find(prop => prop.startsWith('DEVNAME='));
                if(devProperty && devProperty.includes('ttyUSB')){
                   const match = devProperty.match(/'([^']+)'/);
                   if(match){
                    return match[1]
                   }
                }

            }
        }
        console.log("No FTDI device found");
        // If no FTDI device found
        return null;
    } catch (error) {
        console.error('Error retrieving device name:', error.message);
        return null;
    }
}

function fetchData() {
    console.log('calling fetchData')
    fetch('http://cambdoorbell.duckdns.org:3000/settings').then(res => res.json()).then(data => {
      data.forEach(value =>{
         names.push(value["name"])
         RequestMsgs.push(value["RequestMsg"])
         WaitMsgs.push(value["WaitMsg"])
         ReplyMsgs.push(value["ReplyMsg"])
         ResponseMsgs.push(value["ResponseMsg"])
         IntercomMsgs.push(value["IntercomMsg"])
         NoAnswerFiles.push(value["NoAnswerFile"])
         RequestMsgFiles.push(value["RequestMsgFile"])
         WaitMsgFiles.push(value["WaitMsgFile"])
         ReplyMsgFiles.push(value["ReplyMsgFile"])
         ResponseMsgFiles.push(value["ResponseMsgFile"])
         IntercomMsgFiles.push(value["IntercomMsgFile"])
      })
      names.forEach(value=> {
         console.log(value)
      })
      RequestMsgs.forEach(value=> {
         console.log(value)
      })
      WaitMsgs.forEach(value=> {
         console.log(value)
      })
      ReplyMsgs.forEach(value=> {
         console.log(value)
      })
      ResponseMsgs.forEach(value=> {
         console.log(value)
      })
      IntercomMsgs.forEach(value=> {
         console.log(value)
      })
      RequestMsgFiles.forEach(value=> {
         console.log(value)
      })
      WaitMsgFiles.forEach(value=> {
         console.log(value)
      })
      ReplyMsgFiles.forEach(value=> {
         console.log(value)
      })
      ResponseMsgFiles.forEach(value=> {
         console.log(value)
      })
      IntercomMsgFiles.forEach(value=> {
         console.log(value)
      })

      console.log("loaded json data");
      loaded_json_data = true;
    }).catch(err => console.log(err.message))
    console.log('loaded_json_data = '+loaded_json_data);
}

function getRandomNumber() {
    // Generate a random integer between 1 and 9 (inclusive)
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}

function buttonPress(button_number, output){
        idle = false;
        if(new_press) {
           new_press = false;
           current_button = button_number;
           let mp3_file_name = WaitMsgFiles[button_number-1];
           playMP3(mp3_file_name)
        }
        let now = new Date();
        let new_message_remain = moment.duration(Date.parse(new_message_timeout) - now)
        console.log("new_message_remain: " +  new_message_remain)
        if(waiting_for_gui_response != parseInt(button_number) || new_message_remain < 0 ){
           new_message_timeout = moment().add(MESSAGE_TIME_OUT_DURATION, 'seconds');
           message_tick=0;
           until = moment().add(TIME_OUT_DURATION, 'seconds');
           waiting_for_gui_response = parseInt(button_number);
           console.log("waiting for gui response: "+waiting_for_gui_response)
           if(loaded_json_data) {
               addMessage(RequestMsgs[button_number-1], RequestMsgFiles[button_number-1], BUTTON_GENERATOR)
           }
        } else {
            message_tick++;
            if(message_tick %4 == 0) {
                io.emit('messageListMsg', current_message_uuid, message_list, mp3MessageToBrowser, userGenerator, intercomClientId )
            }
        }
        console.log("Ring bell")
        output.write(1);
} 



function addMessage(text_msg, mp3message_to_browser, user_generator){
           current_message_uuid = uuid.v4();
           userGenerator = user_generator
           mp3MessageToBrowser = mp3message_to_browser
           const current_time = useDateFormat(useNow(), "HH:mm:ss").value;
           let new_msg = "("+current_time+") " + text_msg;
           console.log("New Message is: "+new_msg);
           console.log("mp3 to browser is: "+ mp3message_to_browser+", and usergenerator is " + userGenerator);
           message_list.push(new_msg)
           if(message_list.length >  MAX_MESSAGES) {
              message_list.splice(0,1);
           }
           io.emit('messageListMsg', current_message_uuid, message_list, mp3MessageToBrowser, userGenerator, intercomClientId)
}

function playMP3(mp3_file_name){
//           if(fs.existsSync(mp3_file_name)) {
             console.log("play file " +  mp3_file_name);
             io.emit('playfile', mp3_file_name)
//             child.exec("play " + mp3_file_name + " tempo 1.2");
 //          } else {
 //            console.log("Can't find file " + mp3_file_name);
 //          }
}


function generateMP3(arg1, arg2){
   console.log("arg1: "+ arg1);
   console.log("arg2: "+ arg2);
 
   let options={
         scriptPath: "/home/pi/server",
         args:[arg1, ASSETS_DIR+arg2]
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
