@component
export class NewScript extends BaseScriptComponent {
    @input remoteServiceModule: RemoteServiceModule
    @input text: Text
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
        this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    }
    onStart() {
    }
    onUpdate() {
        this.getData()
    }
    getData() {
        const request = RemoteServiceHttpRequest.create()
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Get
        request.url = "https://dubhacks2024-uwgd.onrender.com/get-output"
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print(response.body);
            this.text.text = response.body;
            })
    }
}
