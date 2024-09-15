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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.static(HLS_PATH));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

    // Create a PassThrough stream to handle WebSocket data
    const inputStream = new PassThrough();

    // Start FFmpeg to convert the incoming WebSocket stream to HLS segments
    const ffmpegCommand = ffmpeg(inputStream)
        .inputFormat('webm') // Assuming the input format is WebM
        .videoCodec('copy')   // Copy the video codec directly (no re-encoding)
        .audioCodec('copy')   // Copy the audio codec directly (no re-encoding)
        .outputOptions([
            '-hls_time 5',
            '-hls_list_size 0',
            '-hls_flags delete_segments+append_list',
        ])
        .output(path.join(HLS_PATH, 'record.m3u8'))
        .on('start', () => {
            console.log('FFmpeg started');
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
        })
        .run(); // Start FFmpeg

    ws.on('message', (data) => {
        inputStream.write(data); // Write WebSocket data to the PassThrough stream
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        inputStream.end(); // End the stream to signal FFmpeg to stop
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        inputStream.end(); // End the stream on error
    });
});
