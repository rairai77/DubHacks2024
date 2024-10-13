@component
export class NewScript extends BaseScriptComponent {
    @input remoteServiceModule: RemoteServiceModule
    @input sceneObject: SceneObject
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
    }
    onStart() {
        this.getData()
    }
    getData() {
        const request = RemoteServiceHttpRequest.create()
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
        request.url = "https://example.com/"
        print(request.body)
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("STATUS CODE: " + response.statusCode)
            print("HEADERS: " + JSON.stringify(response.headers))
            print("RESPONSE BODY: " + response.body)
            // this.getSceneObject.set( {text: response.body} )
            })
    }
}
