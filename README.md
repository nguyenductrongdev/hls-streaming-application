# Introduction
The minimal livestream application based on HLS technology

# Setup
Check for current installation:
```sh
node -v # check for node version
npm -v # check for npm version, I recommend the node version >= 20
ffmpeg -version # check for ffmpeg version
```
Installing the necessary packages and starting the application:
```sh
sudo apt install nodejs npm -y # install nodejs and npm if not already installed
sudo apt install ffmpeg -y # install ffmpeg if not already installed
git clone https://github.com/nguyenductrongdev/hls-streaming-application.git
cd hls-streaming-application
npm install # install all application dependencies/packages
npm start # start the application
```
Replace all the `192.168.2.128` by actual local VM IP on `lives.ejs`, `views.ejs`, `lives.html`  
Notice: For security reasons, the media stream only acceces by localhost or https protocol, so the `GET /views` will not be working properly, please use the `lives.html` instead if accessing from another host.

# Personal note
Apply new conf: `systemctl reload nginx`  
Check nginx conf: `sudo nginx -t`  
NginX conf location: `/etc/nginx/nginx.conf`  
Find by filename: `sudo find / -type d -name "ngx_rtmp_module"`
