const express = require('express');
const wav = require('wav');
const atob = require('atob');

const app = express();
const port = 3000;

// Variable to store the WAV file buffer in memory
let wavFileBuffer = null;

// Middleware to parse JSON
app.use(express.json({ limit: '50mb' }));

// Endpoint to receive and process audio data
app.post('/upload-audio', (req, res) => {
    const base64Data = req.body.data;  // Base64 encoded audio data
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Uint8Array to Float32Array
    const float32Array = new Float32Array(bytes.buffer);

    // Convert Float32Array to 16-bit PCM (WAV standard)
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;  // Scale to 16-bit PCM
    }

    // Create a WAV writer but write to a buffer instead of a file
    const wavWriter = new wav.Writer({
        channels: 1,
        sampleRate: 44100,
        bitDepth: 16
    });

    let wavBuffer = Buffer.alloc(0);  // Initialize an empty buffer

    wavWriter.on('data', (chunk) => {
        wavBuffer = Buffer.concat([wavBuffer, chunk]);  // Append each chunk to the buffer
    });

    wavWriter.write(Buffer.from(int16Array.buffer));
    wavWriter.end(() => {
        wavFileBuffer = wavBuffer;  // Store the complete WAV file in memory
        res.status(200).send('Audio processed successfully');
    });
});

// Endpoint to download the WAV file
app.get('/download-audio', (req, res) => {
    if (wavFileBuffer) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Disposition', 'attachment; filename="output.wav"');
        res.send(wavFileBuffer);
    } else {
        res.status(404).send('No audio file available for download');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});