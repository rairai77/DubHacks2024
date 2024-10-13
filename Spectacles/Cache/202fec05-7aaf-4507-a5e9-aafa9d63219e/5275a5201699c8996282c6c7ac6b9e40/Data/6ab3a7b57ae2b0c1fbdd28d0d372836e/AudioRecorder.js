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
        this.postData(this.audioFrame);
    }
    float32ArrayToBase64(float32Array) {
        const uint8Array = new Uint8Array(float32Array.buffer, float32Array.byteOffset, float32Array.byteLength);
        let binaryString = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        return this.customBtoa(binaryString); // Custom btoa function
    }
    customBtoa(uint8Array) {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let byteRemainder = uint8Array.length % 3;
        let mainLength = uint8Array.length - byteRemainder;
        // Convert each chunk of 3 bytes into 4 base64 characters
        for (let i = 0; i < mainLength; i += 3) {
            let chunk = (uint8Array[i] << 16) | (uint8Array[i + 1] << 8) | uint8Array[i + 2];
            result += base64Chars[(chunk >> 18) & 63];
            result += base64Chars[(chunk >> 12) & 63];
            result += base64Chars[(chunk >> 6) & 63];
            result += base64Chars[chunk & 63];
        }
        // Handle remaining bytes (padding)
        if (byteRemainder === 1) {
            let chunk = uint8Array[mainLength] << 16;
            result += base64Chars[(chunk >> 18) & 63];
            result += base64Chars[(chunk >> 12) & 63];
            result += '=='; // Two padding characters for 1 remaining byte
        }
        else if (byteRemainder === 2) {
            let chunk = (uint8Array[mainLength] << 16) | (uint8Array[mainLength + 1] << 8);
            result += base64Chars[(chunk >> 18) & 63];
            result += base64Chars[(chunk >> 12) & 63];
            result += base64Chars[(chunk >> 6) & 63];
            result += '='; // One padding character for 2 remaining bytes
        }
        return result;
    }
    postData(data) {
        print(Math.min(...data) + " " + Math.max(...data));
        const base64Data = this.float32ArrayToBase64(data); // Convert Float32Array to base64
        print(data.buffer);
        print(data.byteOffset);
        print(data.byteLength);
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
        request.setHeader('Content-Type', 'application/json');
        request.url = "https://dubhacks2024.onrender.com/upload-audio";
        request.url = "";
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
//# sourceMappingURL=AudioRecorder.js.map