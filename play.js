import * as child from 'child_process';

var mp3_file_name="/home/pi/vue3-doorbell-receiver/src/assets/1-WaitMsg.mp3"
child.exec("play " + mp3_file_name + " tempo 1.2", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
