// 参数可以和在声网后台注册获得或者和声网工作人员获得

var sdkToken = "";
var appIdentifier = "";

// 构造创建房间的 Request
var url = "https://api.netless.link/v5/rooms";
var requestInit = {
    method: "POST",
    headers: {
        "content-type": "application/json",
        "token": sdkToken,
        "region": "cn-hz",
    },
};

window.fetch(url, requestInit).then(function(response) {
    return response.json();

}).then(function(json) {
    // 创建房间成功，获取房间的 uuid
    var roomUUID = json.uuid;

    // 构造申请 Room Token 的 Request
    var url = "https://api.netless.link/v5/tokens/rooms/" + roomUUID;
    var requestInit = {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "token": sdkToken,
        },
        body: JSON.stringify({
            "lifespan": 0, // 表明 Room Token 永不失效
            "role": "admin", // 表明 Room Token 有 Admin 的权限
        }),
    };
    fetch(url, requestInit).then(function(response) {
        return response.json();

    }).then(function(roomToken) {
        // 成功获取房间的 Room Token
        joinRoom(roomUUID, roomToken);

    }).catch(function(err) {
        console.error(err);
    });
}).catch(function(err) {
    console.error(err);
});

function joinRoom(roomUUID, roomToken) {
    var whiteWebSdk = new WhiteWebSdk({
        appIdentifier: appIdentifier,
    });
    var joinRoomParams = {
        uuid: roomUUID,
        roomToken: roomToken,
        uid: "my-uid",
    };
    whiteWebSdk.joinRoom(joinRoomParams).then(function(room) {
        // 加入房间成功，获取 room 对象
        // 并将之前的 <div id="whiteboard"/> 占位符变成白板
        // room.bindHtmlElement(document.getElementById("whiteboard"));
        // 把 room 绑定到 window 上
        window.room = room;

    }).catch(function(err) {
        // 加入房间失败
        console.error(err);
    });
}

function setGlobalState (myCustomValue) {
    window.room.setGlobalState({
        "my-custom-key": myCustomValue,
    });
}

function deleteGlobalState (key) {
    window.room.setGlobalState({
        key: undefined,
    });
}

function listenGlobalState() {
    window.room.callbacks.on("onRoomStateChanged", (modifyState) => {
        if (modifyState.globalState) {
            console.log(modifyState.globalState); // 接收到事，并打印出来
        }
    });
}


function pushEvent (event, payload) {
    window.room.dispatchMagixEvent(event, payload);
}

function listenEvent(event) {
    window.room.addMagixEventListener(event, () => {
        console.log(event.payload); // 接收到事，并打印出来
    });
}

