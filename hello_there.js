import {PythonShell} from 'python-shell';

generateMP3("hello there", "hello.mp3")
function generateMP3(arg1, arg2){
   console.log("arg1: "+ arg1);
   console.log("arg2: "+ arg2);

   let options={
         scriptPath: "/home/pi/server",
         args:[arg1, arg2]
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
