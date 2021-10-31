#!/usr/bin/env nodejs
const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const os = require('os');

const udpSock = dgram.createSocket('udp4');
const udpBindAddress = findSuitableNetworkAddressForUDP(os);

let httpServerPort = 80;

let pushIntervalHandleA;
let pushIntervalHandleB;
let removeIntervalHandle;

let removeReceiversAfterNoUpdateInSeconds = 60;

let knownReceiversFull  = new Map();
let knownReceiversShort = new Map();



http.createServer(function(req, res){
    if(req.url.includes("rxShort.json")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify([...knownReceiversShort]));
    }
    else if(req.url.includes("rxFull.json")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify([...knownReceiversFull]));
    }
    else if(req.url.includes("rf.js")) {
        fs.readFile("www/rf.js", function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end("File not readable.");
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/javascript");
            return res.end(data);
        });
    }
    else if(req.url.includes("rf.css")) {
        fs.readFile("www/rf.css", function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end("File not readable.");
            }
            res.setHeader("Content-Type", "text/css");
            res.statusCode = 200;
            return res.end(data);
        });
    }
    else if(req.url.includes("icon.png")) {
        let stream = fs.createReadStream("www/icon.png");
        stream.on("open", function() {
            res.setHeader("Content-Type", "image/png");
            res.statusCode = 200;
            stream.pipe(res);
        });
        stream.on("error", function() {
            res.statusCode = 500;
            res.end("File not readable.");
        });
    }
    else if(req.url === "/" || req.url.includes("index.html")) {
        fs.readFile("www/index.html", function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end("File not readable.");
            }
            res.statusCode = 200;
            return res.end(data);
        });
    }
    else {
        res.statusCode = 404;
        // console.log("Request to >"+req.url+"<");
        return res.end("I have no idea what you are looking for. This file does not exist.");
    }
}).listen(httpServerPort);


udpSock.on('error', (err) => {
    console.log('server error: \n' + err.stack);
    udpSock.close();
});

udpSock.on('message', (msg, senderInfo) => {
    // let msgDebug = "["+senderInfo.address+"] "+msg.toString().replace(/[\n\r]/g, ' | ')+"";
    // console.log(msgDebug);

    if(!knownReceiversFull.has(senderInfo.address)) {
        // console.log("unknown receiver "+senderInfo.address);
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

if(udpBindAddress === null) {
    udpSock.bind({port: 53212}, () => {
        udpSock.setBroadcast(true);
    });
}
else {
    udpSock.bind({port: 53212, address: udpBindAddress}, () => {
        udpSock.setBroadcast(true);
    });
}

sendCyclicRequest(udpSock);

pushIntervalHandleA = setInterval(sendCyclicRequest, 270000, udpSock);
pushIntervalHandleB = setInterval(sendConfigRequest, 3540000, udpSock);

function sendCyclicRequest(conn, addr=null) {
    let pushMsg = "Push 300 100 7\r";
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

function removeUnconnectedReceivers() {
    let now = Date.now();
    let deletedAny = false;
    knownReceiversFull.forEach(function(rx, key) {
        if(now > (rx.lastUpdate + removeReceiversAfterNoUpdateInSeconds * 1000)) {
            deletedAny = true;
            knownReceiversFull.delete(key);
            knownReceiversShort.delete(key);
        }
    });
    if(deletedAny) {
        knownReceiversFull = new Map([...knownReceiversFull.entries()].sort(compareIPv4mapKeys));
        knownReceiversShort = new Map([...knownReceiversShort.entries()].sort(compareIPv4mapKeys));
    }
}

removeIntervalHandle = setInterval(removeUnconnectedReceivers, Math.ceil(removeReceiversAfterNoUpdateInSeconds * 1000 / 2));

function addNewReceiver(conn, address) {
    knownReceiversFull.set(address, {"name": "unknown"});
    knownReceiversShort.set(address, {"name": "unknown"});

    knownReceiversFull = new Map([...knownReceiversFull.entries()].sort(compareIPv4mapKeys));
    knownReceiversShort = new Map([...knownReceiversShort.entries()].sort(compareIPv4mapKeys));

    sendConfigRequest(conn, address);
    sendCyclicRequest(conn, address);
}

function updateReceiver(address, msg) {
    let receivedItemsFull = {};
    let receivedItemsShort = {};

    let blocks = msg.toString().split(/[\n\r]/g);

    blocks.forEach((val ) => {
        let item = val.toString().split(" ");
        switch(item[0].toLowerCase()) {
            case "name":
                receivedItemsFull.name = val.toString().replace(item[0]+" ",'').trim();
                break;
            case "frequency":
                receivedItemsFull.freq = (parseFloat(item[1]) / 1000).toFixed(3);
                break;
            case "squelch":
                receivedItemsFull.squelch = item[1];
                break;
            case "afout":
                receivedItemsFull.afOut = item[1];
                break;
            case "rf1":
                receivedItemsFull.rf1 = {min: parseInt(item[1],10), max: parseInt(item[2],10), active: (item[3] === "1")};
                receivedItemsShort.rf1 = {min: receivedItemsFull.rf2.min, max: receivedItemsFull.rf1.max};
                break;
            case "rf2":
                receivedItemsFull.rf2 = {min: parseInt(item[1],10), max: parseInt(item[2],10), active: (item[3] === "1")};
                receivedItemsShort.rf2 = {min: receivedItemsFull.rf2.min, max: receivedItemsFull.rf2.max};
                break;
            case "states":
                let muteFlag  = parseInt(item[1],10);
                let pilotFlag = parseInt(item[2],10);
                receivedItemsFull.flags = {
                    lastCycleMute:    !!(muteFlag & 1 > 0),
                    lastCycleTxMute:  !!(muteFlag & 2 > 0),
                    lastCycleRfMute:  !!(muteFlag & 4 > 0),
                    lastCycleRxMute:  !!(muteFlag & 8 > 0)
                };
                receivedItemsShort.flags = {lastCycleMute: !!(muteFlag & 1 > 0)};
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
                    mute:    !!(muteState & 1 > 0),
                    txMute:  !!(muteState & 2 > 0),
                    rfMute:  !!(muteState & 4 > 0),
                    rxMute:  !!(muteState & 8 > 0)
                }
                receivedItemsShort.af = {currentPeak: receivedItemsFull.af.currentPeak, currentHold: receivedItemsFull.af.currentHold};
                break;
            case "bat":
                receivedItemsFull.battery = {
                    known:      (item[1] !== "?"),
                    percentage: (item[1] === "?") ? 0 : parseInt(item[1], 10)
                };
                receivedItemsShort.battery = receivedItemsFull.battery;
                break;
            case "msg":
                receivedItemsFull.warningString = item[1].toString().replace("_", " ");
                receivedItemsShort.warningString = receivedItemsFull.warningString;
                break;
        }
    });
    receivedItemsFull.lastUpdate = Date.now();
    receivedItemsShort.lastUpdate = Date.now();

    let newObj = Object.assign({}, knownReceiversFull.get(address), receivedItemsFull);

    knownReceiversFull.set(address, newObj);
    knownReceiversShort.set(address, Object.assign({}, knownReceiversShort.get(address), receivedItemsShort));

    // fs.writeFile('RxFull.json', JSON.stringify([...knownReceiversFull]), (err) => {
    //     if(err !== null)
    //         console.log("file write error: "+err);
    // });
    // fs.writeFile('RxShort.json', JSON.stringify([...knownReceiversShort]), (err) => {
    //     if(err !== null)
    //         console.log("file write error: "+err);
    // });

}

function findSuitableNetworkAddressForUDP(os) {
    const networkInterfaces = os.networkInterfaces();

    for (const netIdx in networkInterfaces) {
        for(const addrIdx in networkInterfaces[netIdx]) {
            if(networkInterfaces[netIdx][addrIdx].family === "IPv6")
                continue;
            if(networkInterfaces[netIdx][addrIdx].address.includes("127.0.0.1"))
                continue;
            if(networkInterfaces[netIdx][addrIdx].netmask !== "255.255.255.0")
                continue;
            if(networkInterfaces[netIdx][addrIdx].address.includes("192.168.0")) //skip over default update interface
                continue;

            return networkInterfaces[netIdx][addrIdx].address;
        }
    }

    return null;
}

/* IP sort from https://stackoverflow.com/a/65950890 */
function compareIPv4mapKeys(addrStrA, addrStrB) {
    // noinspection CommaExpressionJS
    const numA = Number(
        addrStrA[0].split('.')
            .map((num, idx) => num * Math.pow(2, (3 - idx) * 8))
            .reduce((a, v) => ((a += v), a), 0)
    );
    // noinspection CommaExpressionJS
    const numB = Number(
        addrStrB[0].split('.')
            .map((num, idx) => num * Math.pow(2, (3 - idx) * 8))
            .reduce((a, v) => ((a += v), a), 0)
    );
    return numA - numB;
}