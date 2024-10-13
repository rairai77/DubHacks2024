"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioRecorder = void 0;
var __selfType = requireType("./AudioRecorder");
function component(target) { target.getTypeName = function () { return __selfType; }; }
let AudioRecorder = class AudioRecorder extends BaseScriptComponent {
    //private microphoneAudioProvider = global.scene.create
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart());
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    }
    onStart() {
        this.microphoneAudioProvider = this.audioTrackAsset.control;
        this.microphoneAudioProvider.sampleRate = this.sampleRate;
        this.microphoneAudioProvider.start();
        this.audioFrame = new Float32Array(this.microphoneAudioProvider.maxFrameSize);
    }
    onUpdate() {
        const audioFrameShape = this.microphoneAudioProvider.getAudioFrame(this.audioFrame);
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
    float32ArrayToBase64(float32Array, length) {
        return base64ArrayBuffer(float32Array.buffer, 0, length * 4);
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
    postData(data, length) {
        // print(Math.min(...data) + " " + Math.max(...data));
        const base64Data = this.float32ArrayToBase64(data, length); // Convert Float32Array to base64
        // print(data.buffer);
        // print(data.byteOffset)
        // print(data.byteLength);
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
        request.setHeader('Content-Type', 'application/json');
        request.url = "https://dubhacks2024.onrender.com/upload-audio";
        // request.url = "http://localhost:4000/upload-audio";
        request.body = '{"data": "' + base64Data + '"}';
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            // print("RESPONSE BODY: " + response.body);
        });
    }
    __initialize() {
        super.__initialize();
        this.sampleRate = 44100;
    }
};
exports.AudioRecorder = AudioRecorder;
exports.AudioRecorder = AudioRecorder = __decorate([
    component
], AudioRecorder);
function base64ArrayBuffer(arrayBuffer, byteOffset, byteLength) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var bytes = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;
    var a, b, c, d;
    var chunk;
    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1
        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1
        base64 += encodings[a] + encodings[b] + '==';
    }
    else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1
        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }
    return base64;
}
//# sourceMappingURL=AudioRecorder.js.map