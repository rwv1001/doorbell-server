To create image:
docker build -t doorbell-server .

To run:
docker run -d -p 3500:3500  --device /dev/gpiomem --privileged -v /home/pi/vue3-doorbell-receiver/src/assets:/app/assets -e NODE_ENV=production -e TZ=$(cat /etc/timezone) --name doorbell-server doorbell-server
docker update --restart unless-stopped doorbell-server
