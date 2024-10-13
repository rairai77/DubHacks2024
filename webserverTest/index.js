const express = require('express');
const wav = require('wav');
const atob = require('atob');
const AWS = require('aws-sdk');
const axios = require('axios');
require('dotenv').config(); // Import dotenv to use environment variables

const app = express();
const port = process.env.PORT || 4000;

// Initialize AWS Transcribe
const transcribeService = new AWS.TranscribeService({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variables for security
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-west-2' // Update to your region
});

let accumulatedAudio = [];
let accumulateAudio32 = [];
app.use(express.json({ limit: '50mb' }));

app.post('/upload-audio', (req, res) => {
    const base64Data = req.body.data; 
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const float32Array = new Float32Array(bytes.buffer);
    accumulateAudio32.push(float32Array);
    accumulatedAudio = accumulatedAudio.concat(Array.from(float32Array));
    res.status(200).send('Audio chunk added successfully');

    if (accumulatedAudio.length > 44100 * 5) {
        accumulatedAudio = accumulatedAudio.slice(accumulatedAudio.length - 44100 * 5);
        console.log("Accumulated 5s");
    }
});

// Endpoint to start the transcription job
app.post('/start-transcription', async (req, res) => {
    const timestamp = Date.now(); // Get the current timestamp
    const audioFileUri = `s3://dubhackstranscribe/input-file-${timestamp}.wav`; // Unique filename

    const params = {
        TranscriptionJobName: `TranscriptionJob-${timestamp}`, // Unique job name
        LanguageCode: 'en-US', // Specify your language code
        Media: {
            MediaFileUri: audioFileUri
        },
        OutputBucketName: 'dubhackstranscribeoutput' // Update with your output bucket
    };

    try {
        await transcribeService.startTranscriptionJob(params).promise();
        
        // Make a GET request to clear the audio
        const clearAudioResponse = await axios.get('https://dubhacks2024.onrender.com/clear-audio'); // Update with your server URL
        console.log(clearAudioResponse.data); // Log response from clear audio

        res.status(200).send('Transcription job started and audio cleared');
    } catch (error) {
        console.error('Error starting transcription job:', error);
        res.status(500).send('Failed to start transcription job');
    }
});

// Endpoint to clear audio data
app.get('/clear-audio', (req, res) => {
    clearData();
    res.status(200).send('Audio data cleared');
});

app.get('/get-audio32', (req, res) => {
    res.status(200).send(accumulateAudio32.join(','));
});

// Endpoint to download the concatenated WAV file
app.get('/download-audio', (req, res) => {
    if (accumulatedAudio.length > 0) {
        // Convert the accumulated Float32 array to a 16-bit PCM format
        const totalAudioLength = accumulatedAudio.length;
        const float32Array = new Float32Array(accumulatedAudio);  // Convert back to Float32Array

        // Convert Float32Array to 16-bit PCM (WAV standard)
        const int16Array = new Int16Array(totalAudioLength);
        for (let i = 0; i < totalAudioLength; i++) {
            int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;  // Scale to 16-bit PCM
            if(int16Array[i] >= 32000 || int16Array[i] <= -32000){
                int16Array[i] = int16Array[i-1];
            }
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
            // Send the combined WAV file as a response
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Disposition', 'attachment; filename="output.wav"');
            res.send(wavBuffer);
        });
    } else {
        res.status(404).send('No audio data available for download');
    }
});

// Generate a simple sine wave as a test audio input
let generateSineWave = (frequency, duration, sampleRate = 44100) => {
    const samples = duration * sampleRate;
    const sineWave = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        sineWave[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }
    return sineWave;
}

let clearData = () => {
    accumulatedAudio = [];
    accumulateAudio32 = [];
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
