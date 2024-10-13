const express = require("express");
const wav = require("wav");
const atob = require("atob");

const app = express();
const port = process.env.PORT || 4000;

// Array to store the concatenated Float32 audio data
let accumulatedAudio = [];
// Middleware to parse JSON
app.use(express.json({ limit: "50mb" }));

// Endpoint to receive and process audio data
app.post("/upload-audio", (req, res) => {
  const base64Data = req.body.data; // Base64 encoded audio data
  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert Uint8Array to Float32Array
  const float32Array = new Float32Array(bytes.buffer);
  // Append the new audio chunk to the accumulated audio array
  accumulatedAudio = accumulatedAudio.concat(Array.from(float32Array));
  // accumulatedAudio = accumulatedAudio.concat(Array.from(generateSineWave(440, 2)));  // 440 Hz tone, 2 seconds long
  res.status(200).send("Audio chunk added successfully");
});

app.get("/clear-audio", (req, res) => {
  clearData();
  res.status(200).send("Audio data cleared");
});

app.get("/get-audio32", (req, res) => {
  var output = new Uint8Array(accumulatedAudio.length);

  for (var i = 0; i < float32Array.length; i++) {
    var tmp = Math.max(-1, Math.min(1, float32Array[i]));
    tmp = tmp < 0 ? tmp * 0x8000 : tmp * 0x7fff;
    tmp = tmp / 256;
    output[i] = tmp + 128;
  }

  res.status(200).send(output);
});

// Endpoint to download the concatenated WAV file
app.get("/download-audio", (req, res) => {
  if (accumulatedAudio.length > 0) {
    // Convert the accumulated Float32 array to a 16-bit PCM format
    const totalAudioLength = accumulatedAudio.length;
    const float32Array = new Float32Array(accumulatedAudio); // Convert back to Float32Array

    // Convert Float32Array to 16-bit PCM (WAV standard)
    const int16Array = new Int16Array(totalAudioLength);
    for (let i = 0; i < totalAudioLength; i++) {
      int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767; // Scale to 16-bit PCM
    }

    // Create a WAV writer but write to a buffer instead of a file
    const wavWriter = new wav.Writer({
      channels: 1,
      sampleRate: 44100,
      bitDepth: 16,
    });

    let wavBuffer = Buffer.alloc(0); // Initialize an empty buffer

    wavWriter.on("data", (chunk) => {
      wavBuffer = Buffer.concat([wavBuffer, chunk]); // Append each chunk to the buffer
    });

    wavWriter.write(Buffer.from(int16Array.buffer));
    wavWriter.end(() => {
      // Send the combined WAV file as a response
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Disposition", 'attachment; filename="output.wav"');
      res.send(wavBuffer);
    });
  } else {
    res.status(404).send("No audio data available for download");
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
};

let clearData = () => {
  accumulatedAudio = [];
};
// Test by appending this generated sine wave to accumulatedAudio

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
