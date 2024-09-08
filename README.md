40db75fa-9895-4f33-9763-d8038e2eb0f7

ffmpeg -i rtmp://localhost/live/40db75fa-9895-4f33-9763-d8038e2eb0f7 -c copy -f hls /usr/local/nginx/html/hls/40db75fa-9895-4f33-9763-d8038e2eb0f7.m3u8
