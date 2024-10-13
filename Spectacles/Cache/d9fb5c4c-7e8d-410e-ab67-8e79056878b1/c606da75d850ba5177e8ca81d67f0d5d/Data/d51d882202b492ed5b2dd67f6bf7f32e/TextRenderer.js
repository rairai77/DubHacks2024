"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewScript = void 0;
var __selfType = requireType("./TextRenderer");
function component(target) { target.getTypeName = function () { return __selfType; }; }
let NewScript = class NewScript extends BaseScriptComponent {
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart());
    }
    onStart() {
        this.getData();
    }
    getData() {
        const request = RemoteServiceHttpRequest.create();
        request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
        request.url = "https://example.com/";
        print(request.body);
        this.remoteServiceModule.performHttpRequest(request, (response) => {
            print("STATUS CODE: " + response.statusCode);
            print("HEADERS: " + JSON.stringify(response.headers));
            print("RESPONSE BODY: " + response.body);
            this.text.text = response.body;
        });
    }
};
exports.NewScript = NewScript;
exports.NewScript = NewScript = __decorate([
    component
], NewScript);
//# sourceMappingURL=TextRenderer.js.map