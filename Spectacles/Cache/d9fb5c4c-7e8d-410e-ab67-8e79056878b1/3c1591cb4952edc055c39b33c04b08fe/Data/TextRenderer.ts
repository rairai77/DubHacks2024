@component
export class NewScript extends BaseScriptComponent {
    @input remoteServiceModule: RemoteServiceModule
    @input text: Text
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
    }
    onStart() {
        this.getData()
    }
    getData() {
        const request = RemoteServiceHttpRequest.create()
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Get
        request.url = "https://dubhacks2024.onrender.com/"
        print(request.body)
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("STATUS CODE: " + response.statusCode)
            print("HEADERS: " + JSON.stringify(response.headers))
            print("RESPONSE BODY: " + response.body)
            this.text.text = response.body;
            })
    }
}
