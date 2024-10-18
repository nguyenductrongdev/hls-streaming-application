const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const { exec } = require('child_process');

const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3107;
const PUBLIC_PATH = path.join(__dirname, 'public');
const HLS_PATH = path.join(PUBLIC_PATH, 'livestreams');

// Middleware to add CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.static(PUBLIC_PATH));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app
    .post("/api/lives", (req, res) => {
        let roomId = uuidv4();
        return res.json({
            id: roomId,
            hostlink: `/lives?roomId=${roomId}`,
            viewlink: `/views?roomId=${roomId}`
        });
    })
    .get("/api/lives/:roomId", (req, res) => {
        let { roomId } = req.params;
        return res.json({
            id: roomId,
            hostlink: `/lives?roomId=${roomId}`,
            viewlink: `/views?roomId=${roomId}`
        });
    });

app.get("/", (req, res) => {
    return res.render('index');
});

app.get("/lives", (req, res) => {
    return res.render('lives');
});

app.get("/views", (req, res) => {
    return res.render('views');
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const m3u8Filename = 'streaming.m3u8';
    const mp4Filename = 'record.mp4';
    let roomId;
    let livestreamDir;
    let ffmpegCommand;
    let inputStream;

    ws.on('message', (message) => {
        let isSegment = false;
        try {
            JSON.parse(message).topic;
        } catch (e) {
            isSegment = true;
        }

        if (!isSegment) {
            roomId = JSON.parse(message).data;
            livestreamDir = path.join(HLS_PATH, roomId);

            if (!fs.existsSync(livestreamDir)) {
                fs.mkdirSync(livestreamDir, { recursive: true });
            }

            // Create a new PassThrough stream for FFmpeg
            inputStream = new PassThrough();

            // Start FFmpeg to convert the WebSocket stream to HLS
            ffmpegCommand = ffmpeg(inputStream)
                .inputFormat('webm')
                .videoCodec('copy')
                .audioCodec('copy')
                .outputOptions([
                    '-hls_time 10',
                    '-hls_list_size 0',
                    '-hls_flags delete_segments+append_list',
                ])
                .output(path.join(livestreamDir, m3u8Filename))
                .on('start', () => {
                    console.log(`FFmpeg started for livestream ID: ${roomId}`);
                })
                .on('error', (err) => {
                    console.error(`FFmpeg error for livestream ID ${roomId}:`, err);
                })
                .run(); // Start FFmpeg
        } else {
            // Assume it's binary data from the MediaRecorder (WebM segments)
            if (inputStream) {
                inputStream.write(message);
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected for livestream ID: ${roomId}`);
        if (inputStream) {
            inputStream.end(); // End the FFmpeg input stream
        }
        const command = `ffmpeg -i ${path.join(livestreamDir, m3u8Filename)} -c copy ${path.join(livestreamDir, mp4Filename)}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`FFmpeg stderr: ${stderr}`);
                return;
            }

            console.log(`FFmpeg stdout: ${stdout}`);
            console.log('Video merging completed successfully.');
        });
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for livestream ID ${roomId}:`, error);
        if (inputStream) {
            inputStream.end(); // End the stream on error
        }
    });
});
