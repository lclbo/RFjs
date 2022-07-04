#!/usr/bin/env node
const DO_DEBUG = false;
const dbg_data = '{\n' +
    '  "10.0.0.1":{"name":"DEMO 001","comment":"This is demo receiver #1","freq":"684.000","squelch":"15","afOut":"18","lastUpdate":1635089614363,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":0},"warningString":"Low Batt"},\n' +
    '  "10.0.0.2":{"name":"DEMO 002","comment":"And this is his companion, demo #2","freq":"670.150","squelch":"15","afOut":"18","lastUpdate":1635089614378,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"}\n' +
    '}';
let dbgRcv = JSON.parse(dbg_data);
let dbgMap = new Map();
Object.entries(dbgRcv).forEach(entry => {
    const [key,val] = entry;
    dbgMap.set(key.replace('"',''), val);
});
dbgMap = new Map([...dbgMap.entries()].sort(compareIPv4mapKeys));
let dbg_str = JSON.stringify([...dbgMap]);

let commentsMap = new Map();

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const os = require('os');
const url = require("url");

let httpServerPort = 80;
let removeReceiversAfterNoUpdateInSeconds = 60;


const udpSock = dgram.createSocket('udp4');
const udpBindAddress = findSuitableNetworkAddressForUDP(os);

const udpCommentSock = dgram.createSocket('udp4');
// udpCommentSock.bind({port: 53210});
udpCommentSock.on("listening", () => {
    const address = udpCommentSock.address();
    console.log('Comment annotation interface listening on '+address.address+':'+address.port);
});
udpCommentSock.on("error", (err) => {
    console.log("Comment annotation interface server error: \n" + err.stack);
    udpCommentSock.close();
});
udpCommentSock.on('message', (msg, senderInfo) => {
    console.log("new comment message received");
    let receivedCommentsMap;
    try {
        receivedCommentsMap = new Map(JSON.parse(msg.toString()));
        commentsMap = new Map([...commentsMap, ...receivedCommentsMap]);
    } catch(e) {
        console.log("udp comment socket: comments JSON parse error: "+e);
    }
});


const httpServer = http.createServer();
httpServer.listen(httpServerPort);

let pushIntervalHandle;
let removeIntervalHandle;

let knownReceiversFull  = new Map();
let knownReceiversShort = new Map();

httpServer.on("listening", () => {
    let httpAddrInfo = httpServer.address();
    if(typeof httpAddrInfo === "object")
        console.log("Webapp available at "+httpAddrInfo.address+":"+httpAddrInfo.port);
});

udpSock.on("listening", () => {
    const address = udpSock.address();
    console.log('MCP server listening on '+address.address+':'+address.port);
});

udpSock.on("error", (err) => {
    console.log("udp socket server error: \n" + err.stack);
    udpSock.close();
});

httpServer.on("error", (err) => {
    console.log("http server error: \n" + err.stack);
    httpServer.close();
});

httpServer.on("request", httpServerRequestResponder);


udpSock.on('message', (msg, senderInfo) => {
    // let msgDebug = "["+senderInfo.address+"] "+msg.toString().replace(/[\n\r]/g, ' | ')+"";
    // console.log(msgDebug);
    if(!knownReceiversFull.has(senderInfo.address))
        addNewReceiver(udpSock, senderInfo.address);
    else
        updateReceiver(senderInfo.address, msg);
});

if(udpBindAddress === null) {
    udpSock.bind({port: 53212}, () => {
        udpSock.setBroadcast(true);
    });
    udpCommentSock.bind({port: 53210});
}
else {
    udpSock.bind({port: 53212, address: udpBindAddress}, () => {
        udpSock.setBroadcast(true);
    });
    udpCommentSock.bind({port: 53210, address: udpBindAddress});
}

if(!DO_DEBUG) {
    sendCyclicRequest(udpSock);
    pushIntervalHandle = setInterval(sendCyclicRequest, 80000, udpSock);
}

function sendCyclicRequest(conn, addr=null) {
    let pushMsg = "Push 100 100 7\r";
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


/**
 * Lookup the comment string for a given receiver address
 * @param addr IP address string of the receiver
 */
function lookupReceiverComment(addr) {
    let commentStr = "["+addr+"]"; //default comment string without lookup
    if(commentsMap.has(addr)) {
        try {
            commentStr = commentsMap.get(addr);
        } catch(e) {
            console.log("comment lookup error.");
        }
    }
    else {
        commentsMap.set(addr, commentStr);
    }

    return commentStr;
}

/**
 * Check the Map of receivers and remove every entry that was last seen more than
 * removeReceiversAfterNoUpdateInSeconds seconds ago
 */
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

removeIntervalHandle = setInterval(removeUnconnectedReceivers, Math.ceil(removeReceiversAfterNoUpdateInSeconds * 1000 / 4));

/**
 * Add a newly discovered receiver to the Map
 * @param conn
 * @param address
 */
function addNewReceiver(conn, address) {
    knownReceiversFull.set(address, {"name": "unknown"});
    knownReceiversShort.set(address, {"name": "unknown"});

    knownReceiversFull = new Map([...knownReceiversFull.entries()].sort(compareIPv4mapKeys));
    knownReceiversShort = new Map([...knownReceiversShort.entries()].sort(compareIPv4mapKeys));

    sendConfigRequest(conn, address);
    sendCyclicRequest(conn, address);
}

/**
 *
 * @param address
 * @param msg
 */
function updateReceiver(address, msg) {
    let receivedItemsFull = {};
    let receivedItemsShort = {};

    receivedItemsFull.comment = lookupReceiverComment(address);

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
                receivedItemsShort.rf1 = {min: receivedItemsFull.rf1.min, max: receivedItemsFull.rf1.max};
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
                // console.log(item[1].toString());
                receivedItemsFull.warningString = item[1].toString().replaceAll("_", " ");
                receivedItemsShort.warningString = receivedItemsFull.warningString;
                break;
        }
    });
    receivedItemsFull.lastUpdate = Date.now();
    receivedItemsShort.lastUpdate = Date.now();

    let newObj = Object.assign({}, knownReceiversFull.get(address), receivedItemsFull);

    knownReceiversFull.set(address, newObj);
    knownReceiversShort.set(address, Object.assign({}, knownReceiversShort.get(address), receivedItemsShort));

    /* This section allows storing the results to a local file for offline debugging without receivers present */
    // fs.writeFile('RxFull.json', JSON.stringify([...knownReceiversFull]), (err) => {
    //     if(err !== null)
    //         console.log("file write error: "+err);
    // });
    // fs.writeFile('RxShort.json', JSON.stringify([...knownReceiversShort]), (err) => {
    //     if(err !== null)
    //         console.log("file write error: "+err);
    // });

}

/**
 * Crawl IP addresses of all interfaces and return a suitable address to bind the MCP listener to
 * @param os OS handle
 * @returns {null|*} IP address or null
 */
function findSuitableNetworkAddressForUDP(os) {
    const networkInterfaces = os.networkInterfaces();

    for (const netIdx in networkInterfaces) {
        for(const addrIdx in networkInterfaces[netIdx]) {
            if(networkInterfaces[netIdx][addrIdx].family === "IPv6") // MCP is v4 only
                continue;
            if(networkInterfaces[netIdx][addrIdx].address.includes("127.0.0.1")) // skip localhost
                continue;

            /* THE FOLLOWING RULES ARE QUITE SPECIFIC FOR MY USE CASE, set your own! */
            if(networkInterfaces[netIdx][addrIdx].netmask !== "255.255.255.0") // only look for /24 networks
                continue;
            if(networkInterfaces[netIdx][addrIdx].address.includes("192.168.0")) //skip over default update interface
                continue;

            return networkInterfaces[netIdx][addrIdx].address;
        }
    }

    return null;
}

/**
 * IPv4 address comparison, from https://stackoverflow.com/a/65950890
 * @param addrStrA IP address A as string
 * @param addrStrB IP address B as string
 * @returns {number}
 */
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

/**
 * HTTP request handler, delivers webapp files from file system and JSON files by parsing the status map
 * @param req http request
 * @param res http response
 * @returns {*}
 */
function httpServerRequestResponder(req,res) {
    if(req.url.includes("rxShort.json")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        if(DO_DEBUG)
            return res.end(dbg_str);
        else
            return res.end(JSON.stringify([...knownReceiversShort]));
    }
    else if(req.url.includes("rxFull.json")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        if(DO_DEBUG)
            return res.end(dbg_str);
        else
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
    else if(req.url.includes("rfColors.css")) {
        fs.readFile("www/rfColors.css", function(err, data) {
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
}