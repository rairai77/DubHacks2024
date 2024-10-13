@component
export class AudioRecorder extends BaseScriptComponent {
    @input audioTrackAsset: AudioTrackAsset

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
    }

    onUpdate() {
        const audioFrameShape = this.microphoneAudioProvider.getAudioFrame(this.audioFrame)
        print(audioFrameShape)
        if (audioFrameShape.x === 0) {
            return;
        }

        // do something with data
    }
}
