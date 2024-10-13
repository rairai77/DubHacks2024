@component
export class AudioRecorder extends BaseScriptComponent {
    @input audioTrackAsset: AudioTrackAsset
    @input remoteServiceModule: RemoteServiceModule

    private audioFrame
    private microphoneAudioProvider
    private sampleRate = 44100; // Set to your sample rate
    private processedAudio;
    //private microphoneAudioProvider = global.scene.create
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
        this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    }

    onStart() {
        this.microphoneAudioProvider = this.audioTrackAsset.control as MicrophoneAudioProvider
        this.microphoneAudioProvider.sampleRate = this.sampleRate;
        this.microphoneAudioProvider.start()
        this.audioFrame = new Float32Array(this.microphoneAudioProvider.maxFrameSize);
    }
    

    onUpdate() {
        const audioFrameShape = this.microphoneAudioProvider.getAudioFrame(this.audioFrame)
        // print(audioFrameShape)
        if (audioFrameShape.x === 0) {
            return;
        }

        // do something with data
        // const wavBuffer = encodeWAV(this.audioFrame, this.sampleRate);
        // const base64Audio = arrayBufferToBase64(wavBuffer);
        // this.processedAudio = base64Audio;
        this.postData(this.audioFrame, audioFrameShape.x);
    }
    
    float32ArrayToBase64(float32Array: Float32Array, length: number) {
        return base64ArrayBuffer(float32Array.buffer, 0, length);
        // const uint8Array = new Uint8Array(float32Array.buffer, 0, length * 4);

        // let binaryString = '';
        // for (let i = 0; i < uint8Array.byteLength; i++) {
        //     binaryString += String.fromCharCode(uint8Array[i]);
        // }
        // return base64(binaryString);
        // return this.customBtoa(binaryString);  // Custom btoa function
    }
    // customBtoa(uint8Array) {
    //     const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    //     let result = '';
    //     let byteRemainder = uint8Array.length % 3;
    //     let mainLength = uint8Array.length - byteRemainder;
    
    //     // Convert each chunk of 3 bytes into 4 base64 characters
    //     for (let i = 0; i < mainLength; i += 3) {
    //         let chunk = (uint8Array[i] << 16) | (uint8Array[i + 1] << 8) | uint8Array[i + 2];
    //         result += base64Chars[(chunk >> 18) & 63];
    //         result += base64Chars[(chunk >> 12) & 63];
    //         result += base64Chars[(chunk >> 6) & 63];
    //         result += base64Chars[chunk & 63];
    //     }
    
    //     // Handle remaining bytes (padding)
    //     if (byteRemainder === 1) {
    //         let chunk = uint8Array[mainLength] << 16;
    //         result += base64Chars[(chunk >> 18) & 63];
    //         result += base64Chars[(chunk >> 12) & 63];
    //         result += '==';  // Two padding characters for 1 remaining byte
    //     } else if (byteRemainder === 2) {
    //         let chunk = (uint8Array[mainLength] << 16) | (uint8Array[mainLength + 1] << 8);
    //         result += base64Chars[(chunk >> 18) & 63];
    //         result += base64Chars[(chunk >> 12) & 63];
    //         result += base64Chars[(chunk >> 6) & 63];
    //         result += '=';  // One padding character for 2 remaining bytes
    //     }
    
    //     return result;
    // } 
    postData(data: Float32Array, length: number) {
        print(Math.min(...data) + " " + Math.max(...data));
        const base64Data = this.float32ArrayToBase64(data, length);  // Convert Float32Array to base64
        print(data.buffer);
        print(data.byteOffset)
        print(data.byteLength);
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
        request.setHeader('Content-Type', 'application/json');
        request.url = "https://dubhacks2024.onrender.com/upload-audio";
        // request.url = "http://localhost:4000/upload-audio";
        request.body = '{"data": "' + base64Data + '"}';
    
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("RESPONSE BODY: " + response.body);
        });
    }
    // postData(data) {
    //     const request = RemoteServiceHttpRequest.create()
    //     request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
    //     request.setHeader('Content-Type', 'application/json');
    //     request.url = "https://dubhacks2024.onrender.com/"
    //     request.body = '{"data": "'+data+'"}';
    //     // print(data)
    //     this.remoteServiceModule.performHttpRequest(request, (response) => {
    //         // print("STATUS CODE: " + response.statusCode)
    //         // print("HEADERS: " + JSON.stringify(response.headers))
    //         print("RESPONSE BODY: " + response.body)
    //         })
    // }
  
}

function base64ArrayBuffer(arrayBuffer, byteOffset: number, byteLength: number) {
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
    var bytes         = new Uint8Array(arrayBuffer,byteOffset,byteLength)
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder
  
    var a, b, c, d
    var chunk
  
    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]
  
      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    
    return base64
  }


// const float32ToPCM = (float32Array) => {
//     const buffer = new ArrayBuffer(float32Array.length * 2); // 16-bit PCM
//     const view = new DataView(buffer);
  
//     float32Array.forEach((sample, index) => {
//       const clampedSample = Math.max(-1, Math.min(1, sample)); // clamp the value between -1 and 1
//       view.setInt16(index * 2, clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7FFF, true); // convert to 16-bit PCM
//     });
  
//     return buffer;
//   };
  
//   const encodeWAV = (float32Array, sampleRate) => {
//     const pcmData = float32ToPCM(float32Array);
//     const buffer = new ArrayBuffer(44 + pcmData.byteLength);
//     const view = new DataView(buffer);
  
//     /* RIFF chunk descriptor */
//     writeString(view, 0, 'RIFF');
//     view.setUint32(4, 36 + pcmData.byteLength, true); // File size - 8
//     writeString(view, 8, 'WAVE');
  
//     /* fmt sub-chunk */
//     writeString(view, 12, 'fmt ');
//     view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
//     view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
//     view.setUint16(22, 1, true); // NumChannels (1 for mono)
//     view.setUint32(24, sampleRate, true); // SampleRate
//     view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
//     view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample / 8)
//     view.setUint16(34, 16, true); // BitsPerSample (16)
  
//     /* data sub-chunk */
//     writeString(view, 36, 'data');
//     view.setUint32(40, pcmData.byteLength, true);
  
//     // Write PCM data
//     new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));
  
//     return buffer;
//   };
  
//   const writeString = (view, offset, string) => {
//     for (let i = 0; i < string.length; i++) {
//       view.setUint8(offset + i, string.charCodeAt(i));
//     }
//   };
//   const arrayBufferToBase64 = (buffer) => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
//     const bytes = new Uint8Array(buffer);
//     let base64 = '';
//     let i;
  
//     for (i = 0; i < bytes.length; i += 3) {
//       const byte1 = bytes[i];
//       const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
//       const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
  
//       const enc1 = byte1 >> 2;
//       const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
//       const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
//       const enc4 = byte3 & 63;
  
//       if (i + 1 >= bytes.length) {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + '==';
//       } else if (i + 2 >= bytes.length) {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
//       } else {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
//       }
//     }
  
//     return base64;
//   }; 
//   const arrayBufferToBase64 = (arrayBuffer) => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
//     let binaryString = '';
//     const bytes = new Uint8Array(arrayBuffer);
//     const len = bytes.byteLength;
  
//     for (let i = 0; i < len; i++) {
//       binaryString += String.fromCharCode(bytes[i]);
//     }
  
//     let base64 = '';
//     let i = 0;
  
//     while (i < binaryString.length) {
//       const byte1 = binaryString.charCodeAt(i++) & 0xff;
//       const byte2 = i < binaryString.length ? binaryString.charCodeAt(i++) & 0xff : 0;
//       const byte3 = i < binaryString.length ? binaryString.charCodeAt(i++) & 0xff : 0;
  
//       const enc1 = byte1 >> 2;
//       const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
//       const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
//       const enc4 = byte3 & 63;
  
//       if (isNaN(byte2)) {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + '==';
//       } else if (isNaN(byte3)) {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
//       } else {
//         base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
//       }
//     }
  
//     return base64;
//   };
  
  // Example usage: