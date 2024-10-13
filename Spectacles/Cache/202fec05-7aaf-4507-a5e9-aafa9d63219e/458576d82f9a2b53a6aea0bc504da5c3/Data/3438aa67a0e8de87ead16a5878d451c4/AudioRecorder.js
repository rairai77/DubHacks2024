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
        const wavBuffer = encodeWAV(this.audioFrame, this.sampleRate);
        const base64Audio = arrayBufferToBase64(wavBuffer);
        this.processedAudio = base64Audio;
        this.postData(this.processedAudio);
    }
    postData(data) {
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
        request.url = "localhost:4000";
        request.body = "data=" + data;
        // print(data)
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            // print("STATUS CODE: " + response.statusCode)
            // print("HEADERS: " + JSON.stringify(response.headers))
            print("RESPONSE BODY: " + response.body);
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
const float32ToPCM = (float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2); // 16-bit PCM
    const view = new DataView(buffer);
    float32Array.forEach((sample, index) => {
        const clampedSample = Math.max(-1, Math.min(1, sample)); // clamp the value between -1 and 1
        view.setInt16(index * 2, clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7FFF, true); // convert to 16-bit PCM
    });
    return buffer;
};
const encodeWAV = (float32Array, sampleRate) => {
    const pcmData = float32ToPCM(float32Array);
    const buffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(buffer);
    /* RIFF chunk descriptor */
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true); // File size - 8
    writeString(view, 8, 'WAVE');
    /* fmt sub-chunk */
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 for mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample / 8)
    view.setUint16(34, 16, true); // BitsPerSample (16)
    /* data sub-chunk */
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true);
    // Write PCM data
    new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));
    return buffer;
};
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
const arrayBufferToBase64 = (buffer) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes = new Uint8Array(buffer);
    let base64 = '';
    let i;
    for (i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i];
        const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        const enc1 = byte1 >> 2;
        const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
        const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
        const enc4 = byte3 & 63;
        if (i + 1 >= bytes.length) {
            base64 += chars.charAt(enc1) + chars.charAt(enc2) + '==';
        }
        else if (i + 2 >= bytes.length) {
            base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
        }
        else {
            base64 += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
        }
    }
    return base64;
};
//# sourceMappingURL=AudioRecorder.js.map