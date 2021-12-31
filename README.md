# 1. 安装

### 1.1 使用 npm 或 yarn 来安装

npm 和 yarn 是 JavaScript 社区知名的包管理工具。如果你的刚好使用了它们之一，就可以直接用它们来安装 White SDK。

**npm**

```bash
npm install white-web-sdk
```

**yarn**

```bash
yarn add white-web-sdk
```

如果你用 React 开发 Web 应用，可以安装 `white-react-sdk`。该库是 `white-web-sdk` 的超集，既提供了可供 React 直接使用的组件，又可以完全代替 `white-web-sdk`。

### 1.2 直接引入 JS 来安装

你可能决定不用任何包管理工具来安装。比如，为了减少 JS 文件的大小，以优化页面加载速度，决定仅在需要使用白板的页面中使用 White SDK。那么，也可以通过在 `<head>` 中直接引入 JS 文件的 URL 来安装 White SDK。

在的 `html` 文件中的 `<head>` 中插入如下代码即可。

```markup
<head>
    <script src="https://sdk.herewhite.com/white-web-sdk/2.15.13.js"></script>
</head>
```

# 2. 创建房间

Netless 的一切基于房间，为了创建房间，你需要准备 App Identifier 和 SDK Token。可以在控制台注册后获取或者和声网的技术支持联系获取。

App Idnetifier 表明了房间归哪个应用所有。应用和企业账号关联。如此一来，房间产生的费用才可以关联到企业账号。

准备完毕后，通过如下代码，调用 Netless 服务的 API 来创建房间。

```javascript
var url = "https://api.netless.link/v5/rooms";
var requestInit = {
    method: "POST",
    headers: {
        "content-type": "application/json",
        "token": sdkToken, // 签发的 SDK Token，需提前准备
    },
};

window.fetch(url, requestInit).then(function(response) {
    return response.json();

}).then(function(roomJSON) {
    // 创建房间成功，获取描述房间信息的 roomJSON
    console.log(roomJSON);

}).catch(function(err) {
    // 失败了，打印出 Error 以便分析为何失败
    console.error(err);
});
```

如果执行成功，将创建一个实时互动房间。Netless 服务端会返回一个 JSON 形式的 object，来描述刚刚创建好的房间的信息。不出所料，这个 JSON 包含的内容如下。

```javascript
{
    "uuid": "dcfc7fb09f6511eabc8da545523f6422",
    "name": "",
    "teamUUID": "34YtcH_MEeqFMjt5vcNozQ",
    "isRecord": false,
    "isBan": false,
    "createdAt": "2020-05-26T15:30:43.706Z",
    "limit": 0
}
```

# 3. 加入房间

在创建了一个实时互动房间，并获取到了 `uuid` 和 `roomToken` 之后，就可以凭这两个参数，在前端调用方法加入房间了。

此外，我们还需要为加入房间的用户准备一个唯一标识符 ``uid``。这个 ``uid`` 最好和我们的用户系统的用户 ID 相同。如此一来，Netless 的系统将可以与我们的用户系统打通。

准备就绪后，我们可以创建 `WhiteWebSdk` 实例。

```javascript
import { WhiteWebSdk } from "white-web-sdk";

var whiteWebSdk = new WhiteWebSdk({
    appIdentifier: appIdentify, // 从管理控制台获取 App Identifier
});
```

这个 `whiteWebSdk` 实例我们今后会多次用到。建议将其作为单例全局变量。

然后，通过如下代码加入房间。

```javascript
var joinRoomParams = {
    uuid: uuid,
    uid: uid,
    roomToken: roomToken,
};

let netlessRoom

whiteWebSdk.joinRoom(joinRoomParams).then(function(room) {
    // 加入房间成功，获取 room 对象
    netlessRoom = room
}).catch(function(err) {
    // 加入房间失败
    console.error(err);
});
```

成功加入房间后，会通过回调拿到 `room` 对象。这是一个重要的对象，之后，我们所有代码都要围绕它来写。

# 4. 离开房间

如果不再使用白板了，就应该离开房间。Netless 互动白板**不会**自动离开房间。出于如下理由，我们不应该遗漏「离开房间」操作。

* 不离开房间的话，浏览器将维持与 Netless 服务器的长连接。这将消耗前端用户设备的包括网络带宽在内的各种资源。
* Netless 会对没有离开房间的用户继续收费。维持不必要的长连接将导致你所在的团队或公司产生不必要的开支。

> 如果用户直接关闭浏览器，或关闭当前网页 Tab，会自动释放房间，无需担心。

如下代码可以主动离开房间。如果不再需要房间，记得调用，否则房间会泄漏。

```javascript
room.disconnect().then(function() {
    // 成功离开房间
}).catch(function(err) {
    // 离开房间失败，获得报错 err
});
```

> 如果发现 Netless 给发的账单高于预期，这很可能是「房间泄漏」导致的。此时此刻，你可以排查应用的业务逻辑代码，或重构那些可能导致状态混乱的地方。
> 
> 彻底修复「房间泄漏」问题之后，你会发现账单开始符合预期。

# 5. 异常流程处理

为了保证应用程序能稳定运行，在业务流程设计之初，就应该考虑到异常流程处理。

### 5,1 异步调用方法都会返回 Promise

例如，`joinRoom` 和 `disconnect` 都会返回一个 Promise 对象。异步调用方法失败，则会抛出错误。通过如下方式截获错误，并进入异常处理流程。

```javascript
room.disconnect().catch(function (err) {
    // 截获错误，进入异常处理流程
});
```

如果你的开发环境支持 `await` 语法，可以将代码写成如下形式。

```javascript
try {
    await room.disconnect();
} catch (err) {
    // 截获错误，进入异常处理流程
}
```

### 5.2 通过回调函数捕获错误

你可以通过 `joinRoom` 时，附带回调函数，来监听实时房间的异常。

```javascript
var joinRoomParams = {
    uuid: roomUUID,
    roomToken: roomToken,
};

whiteWebSdk.joinRoom(joinRoomParams, {

    onDisconnectWithError: function(err) {
        // 房间因为错误，和服务端断开连接
    },

    onKickedWithReason: function(err) {
        // 用户被踢出房间
    },
});
```

# 6. 自定义事件

根据你自己的业务逻辑，可以定义自定义事件广播全房间。通过如下代码，可以发送自定事件。

```javascript
var event = "ChatMessage"; // 取一个合适的自定义事件名称
var payload = {...}; // 事件荷载，由事件附带，根据业务逻辑自行设计

room.dispatchMagixEvent(event, payload);
```

通过如下代码，可以接受房间里其他人发送的自定义事件。

```javascript
var event = "ChatMessage"; // 你希望监听的自定义事件名称

room.addMagixEventListener(event, onReceivedChatMessage);

function onReceivedChatMessage(event) {
    console.log(event.payload); // 接收到事，并打印出来
}
```

当不再希望接收某个自定义事件时，可以通过如下代码注销监听。

```javascript
var event = "ChatMessage"; // 你希望注销监听的自定义事件名称
room.removeMagixEventListener(event, onReceivedChatMessage);
```

# 7. Global State

这是一个类型为字典 object 的全房间共享的全局变量。房间里任何用户都可以读取它，以及监听它的变化，任何互动模式的用户都可以修改它。

通过如下代码读取 Global State。

```javascript
var globalState = room.state.globalState;
```

通过如下代码修改 Global State。

```javascript
room.setGlobalState({
    "my-custom-key": myCustomValue,
});
```

通过如下代码，可以删除 Global State 中的特定字段。

```javascript
room.setGlobalState({
  "key-to-remove": undefined,
})
```

通过在加入房间时传入回调函数，可以监听房间的 Global State 值的变化。

```javascript
var joinRoomParams = {
    uuid: uuid,
    roomToken: roomToken,
};
whiteWebSdk.joinRoom(joinRoomParams, {
    onRoomStateChanged: function(modifyState) {
        if (modifyState.globalState) {
            // Global State 发生了变化，读取到变化后的值
            var globalState = modifyState.globalState;
        }
    }
});
```

# 8. 如何选择

自定义事件没有时效性，如果在发事件的时候用户不在房间，那么这个用户将不会收到这个消息。

Global State 类似实时数据库，任何时候进入都可以读到当时房间的状态。

这里两个都是基于长链，具备主动通知能力。区别是后者可以状态持久化。一般建议使用 Global State，不过不建议内容过大。
