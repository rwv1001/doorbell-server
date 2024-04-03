import util from "util";
import * as child from 'child_process';

const exec = util.promisify(child.exec);

async function getDevName() {
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

        // If no FTDI device found
        return null;
    } catch (error) {
        console.error('Error retrieving device name:', error.message);
        return null;
    }
}

// Example usage
getDevName()
    .then(result => {
        if (result) {
            console.log('Device path:', result);
        } else {
            console.log('No FTDI device found.');
        }
    })
    .catch(err => {
        console.error('Error:', err.message);
    });
