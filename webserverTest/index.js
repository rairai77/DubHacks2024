const express = require('express');
const wav = require('wav');
const atob = require('atob');
const { Transcribe, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // Use require here
const axios = require('axios');
require('dotenv').config(); 


const app = express();
const port = process.env.PORT || 4000;

// Initialize AWS Transcribe
const transcribeService = new Transcribe({
    credentials: {
        // Use environment variables for security
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,

        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },

    // Update to your region
    region: 'us-west-2'
});

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: 'us-west-2'
})

let accumulatedAudio = [];
let accumulateAudio32 = [];
let transcripts = "";
let outputText = "";
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
        downloadAudio();
    }
});
  
// Endpoint to clear audio data
app.get('/clear-audio', (req, res) => {
    clearData();
    res.status(200).send('Audio data cleared');
});

// app.get('/get-audio32', (req, res) => {
//     res.status(200).send(accumulateAudio32.join(','));
// });


// Function to download audio, upload to S3, and start transcription
async function downloadAudio() {
    if (accumulatedAudio.length > 0) {
        // Convert the accumulated Float32 array to a 16-bit PCM format
        const totalAudioLength = accumulatedAudio.length;
        const float32Array = new Float32Array(accumulatedAudio); // Convert back to Float32Array

        // Convert Float32Array to 16-bit PCM (WAV standard)
        const int16Array = new Int16Array(totalAudioLength);
        for (let i = 0; i < totalAudioLength; i++) {
            int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767; // Scale to 16-bit PCM
            if (int16Array[i] >= 32000 || int16Array[i] <= -32000) {
                int16Array[i] = int16Array[i - 1];
            }
        }

        // Create a WAV writer but write to a buffer instead of a file
        const wavWriter = new wav.Writer({
            channels: 1,
            sampleRate: 44100,
            bitDepth: 16
        });

        let wavBuffer = Buffer.alloc(0); // Initialize an empty buffer

        wavWriter.on('data', (chunk) => {
            wavBuffer = Buffer.concat([wavBuffer, chunk]); // Append each chunk to the buffer
        });

        wavWriter.write(Buffer.from(int16Array.buffer));
        clearData();
        wavWriter.end(async () => {
            // Set up parameters for S3 upload and transcription job
            const key = `input-file-${Date.now()}.wav`;
            const command = new PutObjectCommand({
                Bucket: 'dubhackstranscribe',
                Key: key,
                Body: wavBuffer,
                ContentType: 'audio/wav'
            });
            

            try {
                // Upload the WAV file to S3
                const uploadResult = await s3.send(command);
                
                const mediaFileUri = `https://dubhackstranscribe.s3.us-west-2.amazonaws.com/${key}`;
                // Parameters for the transcription job
                const transcriptionParams = {
                    TranscriptionJobName: `TranscriptionJob-${Date.now()}`, // Unique job name
                    Media: {
                        MediaFileUri: mediaFileUri // Use the S3 file location
                    },
                    OutputBucketName: 'dubhackstranscribeoutput', // Update with your output bucket
                    MediaFormat: 'wav', // Assuming you are using 'wav'
                    IdentifyLanguage: true  
                };

                // Start the transcription job
                await startJob(transcriptionParams);
            } catch (error) {
                console.error('Error uploading to S3 or starting transcription:', error);
            }
        });
    } else {
        console.error('No audio data available for download');
    }
}

// Start transcription job with dynamic params
const startJob = async (transcriptionParams) => {
    try {
        const data = await transcribeService.send(
            new StartTranscriptionJobCommand(transcriptionParams)
        ) 
        const jobName = transcriptionParams.TranscriptionJobName;
        // Poll the job status until it is complete
        pollJobStatus(jobName);
    } catch (err) {
        error.log("Error", err);
    }
};

const pollJobStatus = async (jobName) => {
    const getJobParams = { TranscriptionJobName: jobName };
    
    const checkStatus = async () => {
        try {
            const data = await transcribeService.send(
                new GetTranscriptionJobCommand(getJobParams)
            );
            const jobStatus = data.TranscriptionJob.TranscriptionJobStatus;
            
            if (jobStatus === "COMPLETED") {
                // Call processTranscriptionResults once job is completed
                processTranscriptionResults(jobName);
            } else if (jobStatus === 'FAILED') {
                console.error(`Transcription job ${jobName} failed.`);
            } else {
                setTimeout(checkStatus, 1000); // Retry after 5 seconds if not completed
            }
        } catch (err) {
            console.error('Error checking job status:', err);
        }
    };

    // Start checking the status
    checkStatus();
};

// Generate a simple sine wave as a test audio input
// let generateSineWave = (frequency, duration, sampleRate = 44100) => {
//     const samples = duration * sampleRate;
//     const sineWave = new Float32Array(samples);
//     for (let i = 0; i < samples; i++) {
//         sineWave[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
//     }
//     return sineWave;
// }

const processTranscriptionResults = async (jobName) => {
    try {
        // Add a small delay to allow the transcription to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Fetch the transcription result from S3
        const getObjectParams = {
            Bucket: 'dubhackstranscribeoutput', // Your output bucket name
            Key: `${jobName}.json`  // Use the job name to locate the correct file
        };

        // Retrieve the object from S3
        const command = new GetObjectCommand(getObjectParams);
        const { response } = await s3.send(command);
        

        // Extract the first transcript value
        const firstTranscript = response.data.results.transcripts[0].transcript;

        // Add it to the transcripts array
        transcripts += " " + firstTranscript;
        const wordCount = transcripts.trim().split(/\s+/).length;

        if (wordCount >= 10) {
            outputText = transcripts;

            transcripts = ""; // Keep only the last 10 words
            
        }
        console.log('Current Transcripts:', transcripts.join(' ')); // Logs the concatenated transcripts
    } catch (error) {
        console.error('Error fetching or processing transcription results:', error);
    }
};

app.get('/get-output', (req, res) => {
    res.status(200).send(outputText);
});

let clearData = () => {
    accumulatedAudio = [];
    accumulateAudio32 = [];
}

let clearTranscripts = () => {
    transcripts = [];
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
