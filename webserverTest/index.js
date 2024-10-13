const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
let counter = 0;
const frames = [];
let aggregatedFrames = null;

app.use(express.json({ limit: "50mb" })); // Increase limit if you're sending larger audio chunks

// Helper function to decode base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

app.get("/", (req, res) => {
  counter++;
  res.send("");
});

app.get('/download-audio', (req, res) => {
  // Send as a downloadable file
  const aggregatedFrames = aggregateFrames(frames, 44100);
  res.setHeader('Content-Disposition', 'attachment; filename="audio.wav"');
  res.setHeader('Content-Type', 'audio/wav');
  res.send(Buffer.from(aggregatedFrames));
});

app.post("/", (req, res) => {
  // Check if req.body.data is base64 encoded, and decode it
  if (req.body.data) {
    const decodedBuffer = base64ToArrayBuffer(req.body.data); // Convert base64 to ArrayBuffer
    frames.push(decodedBuffer);
    res.status(200).send('Data Received');
  } else {
    res.status(400).send('Invalid data');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Function to aggregate audio frames into one WAV buffer
const aggregateFrames = (frameBuffers, sampleRate) => {
  const totalPCMDataLength = frameBuffers.reduce(
    (sum, frame) => sum + frame.byteLength,
    0
  );

  const finalBuffer = new ArrayBuffer(44 + totalPCMDataLength);
  const finalView = new DataView(finalBuffer);

  // Write WAV header
  writeWAVHeader(finalView, totalPCMDataLength, sampleRate);

  // Copy PCM data from each frame
  let offset = 44;
  frameBuffers.forEach((frameBuffer) => {
    const pcmData = new Uint8Array(frameBuffer);
    new Uint8Array(finalBuffer, offset).set(pcmData);
    offset += pcmData.length;
  });

  return finalBuffer;
};

// Function to write WAV header
const writeWAVHeader = (view, pcmDataLength, sampleRate) => {
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmDataLength, true); // File size - 8 bytes
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample / 8)
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, pcmDataLength, true); // Data sub-chunk size
};

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
