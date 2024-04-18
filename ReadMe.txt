#This server processes doorbell button input data and informs web clients who is at the door
#It also converts the text messages to mp3 files when the settings are updated
#It also mp3 files through the doorbell speaker

#Start the service - it starts automatically on bootup
sudo systemctl start doorbell-server.service

#Command to use after updating /home/pi/server/doorbell-server.service
sudo systemctl daemon-reload

#See server status
sudo systemctl status doorbell-server.service

#See server logs
journalctl -u doorbell-server.service -f
