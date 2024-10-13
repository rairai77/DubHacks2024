const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
let counter = 0;
const frames = [];

app.use(express.json());

app.get("/", (req, res) => {
  counter++;
  res.send("Howdy Neighbor " + counter);
});
app.post("/", (req, res) => {
  frames.push(req.body.data);
  res.send(aggregateFrames(frames, 44100));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
const aggregateFrames = (frameBuffers, sampleRate) => {
  // Total length of all PCM data
  const totalPCMDataLength = frameBuffers.reduce(
    (sum, frame) => sum + frame.byteLength,
    0,
  );

  // Create a new buffer for the final WAV file (44 bytes for header + total PCM data length)
  const finalBuffer = new ArrayBuffer(44 + totalPCMDataLength);
  const finalView = new DataView(finalBuffer);

  // Write the WAV header
  writeWAVHeader(finalView, totalPCMDataLength, sampleRate);

  // Copy each frame's PCM data into the final buffer (starting after the 44-byte header)
  let offset = 44;
  frameBuffers.forEach((frameBuffer) => {
    const pcmData = new Uint8Array(frameBuffer);
    new Uint8Array(finalBuffer, offset).set(pcmData);
    offset += pcmData.length;
  });

  return finalBuffer;
};

// Function to write the WAV header
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

// Example of how to use it
// Assume `frames` is an array of PCM audio frame buffers, each containing 0.3s of audio data
const sampleRate = 44100; // Example sample rate

// Aggregate all frames into a single WAV file buffer
const finalWavBuffer = aggregateFrames(frames, sampleRate);

// Now you can send this `finalWavBuffer` as the aggregated audio
