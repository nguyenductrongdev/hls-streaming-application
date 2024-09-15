# Introduction
The simple livestream application based on HLS technology

# Quick note
Some note in development time
```
ffmpeg -i rtmp://localhost/live/40db75fa-9895-4f33-9763-d8038e2eb0f7 -c copy -f hls /usr/local/nginx/html/hls/40db75fa-9895-4f33-9763-d8038e2eb0f7.m3u8
```
```
systemctl reload nginx
```
Check nginx conf
```
sudo nginx -t
```
```
rm /etc/nginx/nginx.conf
```
## Copy
```
sudo cp /home/ndtrong/hls/tools/nginx.conf /etc/nginx/nginx.conf
```
## Find
```
sudo find / -type d -name "ngx_rtmp_module"
```
