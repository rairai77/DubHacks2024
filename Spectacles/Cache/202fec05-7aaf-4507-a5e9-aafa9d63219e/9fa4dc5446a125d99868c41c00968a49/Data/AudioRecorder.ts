@component
export class AudioRecorder extends BaseScriptComponent {
    @input audioTrackAsset: AudioTrackAsset
    @input remoteServiceModule: RemoteServiceModule

    private audioFrame
    private microphoneAudioProvider

    //private microphoneAudioProvider = global.scene.create
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
        this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    }

    onStart() {
        this.microphoneAudioProvider = this.audioTrackAsset.control as MicrophoneAudioProvider
        this.microphoneAudioProvider.sampleRate = 44100
        this.microphoneAudioProvider.start()

        this.audioFrame = new Float32Array(this.microphoneAudioProvider.maxFrameSize);

        this.postData()
    }

    onUpdate() {
        const audioFrameShape = this.microphoneAudioProvider.getAudioFrame(this.audioFrame)
        print(audioFrameShape)
        if (audioFrameShape.x === 0) {
            return;
        }

        // do something with data
        print(this.audioFrame[0] + ", " + this.audioFrame[1])
    }

    postData() {
        const request = RemoteServiceHttpRequest.create()
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Get
        request.url = "https://developers.snap.com"

        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("STATUS CODE: " + response.statusCode)
            print("HEADERS: " + JSON.stringify(response.headers))
            print("RESPONSE BODY: " + response.body)
        })
    }
}
