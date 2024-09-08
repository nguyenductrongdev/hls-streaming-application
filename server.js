const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { PassThrough } = require('stream');

const app = express();
const port = 3107;
const HLS_PATH = path.join(__dirname, 'public');

// Middleware to add CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow specific methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get("/lives", (req, res) => {
    return res.render('lives');
});

app.get("/views", (req, res) => {
    return res.render('views');
});

const wss = new WebSocket.Server({ server: app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}) });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Create a pass-through stream to pipe WebSocket data to FFmpeg
    const inputStream = new PassThrough();

    // Set up FFmpeg to convert the input stream to HLS
    const ffmpegCommand = ffmpeg(inputStream)
        .inputFormat('webm') // Assuming the input format is WebM
        .outputOptions([
            '-c:v libx264', // Codec for video
            '-c:a aac', // Codec for audio
            '-f hls', // Format for HLS
            '-hls_time 10', // Segment length in seconds
            '-hls_list_size 0', // Unlimited playlist size
            '-hls_segment_filename', path.join(HLS_PATH, 'segment_%03d.ts') // Path for segment files
        ])
        .output(path.join(HLS_PATH, 'index.m3u8'))
        .on('end', () => {
            console.log('HLS conversion completed');
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
        })
        .run();

    ws.on('message', (data) => {
        inputStream.write(data);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        inputStream.end();
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
