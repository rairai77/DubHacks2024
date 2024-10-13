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
        this.microphoneAudioProvider.sampleRate = 44100;
        this.microphoneAudioProvider.start();
        this.audioFrame = new Float32Array(this.microphoneAudioProvider.maxFrameSize);
        this.postData();
    }
    onUpdate() {
        const audioFrameShape = this.microphoneAudioProvider.getAudioFrame(this.audioFrame);
        print(audioFrameShape);
        if (audioFrameShape.x === 0) {
            return;
        }
        // do something with data
        print(this.audioFrame[0] + ", " + this.audioFrame[1]);
    }
    postData() {
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Get;
        request.url = "https://developers.snap.com";
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("STATUS CODE: " + response.statusCode);
            print("HEADERS: " + JSON.stringify(response.headers));
            print("RESPONSE BODY: " + response.body);
        });
    }
};
exports.AudioRecorder = AudioRecorder;
exports.AudioRecorder = AudioRecorder = __decorate([
    component
], AudioRecorder);
//# sourceMappingURL=AudioRecorder.js.map