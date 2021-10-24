const dgram = require('dgram');
const net = require('net');
const fs = require('fs');
const udpSock = dgram.createSocket('udp4');
// const tcpSock = new net.Socket();
const http = require('http');

let pushIntervalHandle = null;

let knownReceiversFull  = {};
let knownReceiversShort = {};

http.createServer(function(req, res){
    res.writeHead(200, {"content-Type":'application/json'});
    if(req.url.includes("short.json"))
        res.end(JSON.stringify(knownReceiversShort));
    else
        res.end(JSON.stringify(knownReceiversFull));
}).listen(8080);

// tcpSock.connect(8088, '0.0.0.0', function() {
//     console.log('Connected');
//     tcpSock.write(JSON.stringify(knownReceiversFull));
// });
// tcpSock.on('error', function(ex) {
//     console.log("handled error");
//     console.log(ex);
// });
// tcpSock.on('data', function(data) {
//     console.log('Received: ' + data);
//     tcpSock.destroy(); // kill client after server's response
// });
//
// tcpSock.on('close', function() {
//     console.log('Connection closed');
// });

udpSock.on('error', (err) => {
    console.log('server error: \n' + err.stack);
    udpSock.close();
});

udpSock.on('message', (msg, senderInfo) => {
    let msgDebug = "["+senderInfo.address+"] "+msg.toString().replace(/[\n\r]/g, ' | ')+"";
    console.log(msgDebug);

    if(!((""+senderInfo.address) in knownReceiversFull)) {
        console.log("unknown receiver "+senderInfo.address);
        addNewReceiver(udpSock, senderInfo.address);
    }
    else {
        updateReceiver(senderInfo.address, msg);
    }
});

udpSock.on('listening', () => {
    const address = udpSock.address();
    console.log(`server listening on ${address.address}:${address.port}`);
});
// udpSock.bind(53212, "192.168.1.218");
udpSock.bind(53212, "192.168.1.218", () => {
    udpSock.setBroadcast(true);
});

// sendCyclicRequest(udpSock, "192.168.1.116");
sendCyclicRequest(udpSock);
// sendCyclicRequest(udpSock, "192.168.1.255");

if(pushIntervalHandle !== null)
    clearInterval(pushIntervalHandle);

pushIntervalHandle = setInterval(sendCyclicRequest, 270, udpSock)

function sendCyclicRequest(conn, addr=null) {
    let pushMsg = "Push 300 500 7\r";
    if(addr === null)
        addr = "255.255.255.255";
    conn.send(pushMsg, 0, (pushMsg.length), 53212, addr, sendCallback);
}

function sendConfigRequest(conn, addr=null) {
    let initMsg = "Push 0 0 1\r";
    if(addr === null)
        addr = "255.255.255.255";
    conn.send(initMsg, 0, (initMsg.length), 53212, addr, sendCallback);
}

function sendCallback(err) {
    if(err !== null)
        console.log("Msg send error: "+err);
}

function addNewReceiver(conn, address) {
    knownReceiversFull[address]  = {"name": "unknown"};
    knownReceiversShort[address] = {"name": "unknown"};
    sendConfigRequest(conn, address);
    // console.log("added receiver "+address);
    sendCyclicRequest(conn, address);
}

function updateReceiver(address, msg) {
    let receivedItemsFull = {};
    let receivedItemsShort = {};

    let blocks = msg.toString().split(/[\n\r]/g);

    blocks.forEach((val, idx) => {
        let item = val.toString().split(" ");
        switch(item[0].toLowerCase()) {
            case "name":
                receivedItemsFull.name = val.toString().replace(item[0]+" ",'').trim();
                receivedItemsShort.name = receivedItemsFull.name;
                break;
            case "frequency":
                receivedItemsFull.freq = (parseFloat(item[1]) / 1000).toFixed(3);
                receivedItemsShort.freq = receivedItemsFull.freq;
                break;
            case "squelch":
                receivedItemsFull.squelch = item[1];
                break;
            case "afout":
                receivedItemsFull.afOut = item[1];
                break;
            case "rf1":
                receivedItemsFull.rf1 = {min: parseInt(item[1],10), max: parseInt(item[2],10), active: (item[3] === "1")};
                receivedItemsShort.rf1 = {min: parseInt(item[1],10), max: parseInt(item[2],10)};
                break;
            case "rf2":
                receivedItemsFull.rf2 = {min: parseInt(item[1],10), max: parseInt(item[2],10), active: (item[3] === "1")};
                receivedItemsShort.rf2 = {min: parseInt(item[1],10), max: parseInt(item[2],10)};
                break;
            case "states":
                let muteFlag  = parseInt(item[1],10);
                let pilotFlag = parseInt(item[2],10);
                receivedItemsFull.flags = {
                    lastCycleMute:    (muteFlag & 1 > 0),
                    lastCycleTxMute:  (muteFlag & 2 > 0),
                    lastCycleRfMute:  (muteFlag & 4 > 0),
                    lastCycleRxMute:  (muteFlag & 8 > 0)
                };
                receivedItemsFull.lastCyclePilot = pilotFlag;
                receivedItemsShort.lastCyclePilot = pilotFlag;
                break;
            case "rf":
                receivedItemsFull.rf = {
                    current: parseInt(item[1],10),
                    antenna: (item[2] === "1") ? "1" : "2",
                    pilot: (item[3] === "1")
                }
                receivedItemsShort.rf = {
                    current: parseInt(item[1],10),
                    antenna: (item[2] === "1") ? "1" : "2"
                }
                break;
            case "af":
                let muteState  = parseInt(item[3],10);
                receivedItemsFull.af = {
                    currentPeak: parseInt(item[1],10),
                    currentHold: parseInt(item[2],10),
                    mute:    (muteState & 1 > 0),
                    txMute:  (muteState & 2 > 0),
                    rfMute:  (muteState & 4 > 0),
                    rxMute:  (muteState & 8 > 0)
                }
                receivedItemsShort.af = receivedItemsFull.af;
                break;
            case "bat":
                receivedItemsFull.battery = {
                    known:      (item[1] !== "?"),
                    percentage: (item[1] === "?") ? 0 : parseInt(item[1], 10)
                };
                receivedItemsShort.battery = receivedItemsFull.battery;
                break;
            case "msg":
                receivedItemsFull.warningString = item[1].toString();
                break;
        }
    });
    receivedItemsFull.lastUpdate = Date.now();
    receivedItemsShort.lastUpdate = Date.now();

    knownReceiversFull[address] = Object.assign({}, knownReceiversFull[address], receivedItemsFull);
    knownReceiversShort[address] = Object.assign({}, knownReceiversShort[address], receivedItemsShort);

    fs.writeFile('RxFull.json', JSON.stringify(knownReceiversFull), (err) => {
        if(err !== null)
            console.log("file write error: "+err);
    });

    // console.log(knownReceivers);
}