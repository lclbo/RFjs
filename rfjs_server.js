#!/usr/bin/env node
const DO_DEBUG = true;

let commentsMap = new Map();

const crypto = require('crypto');
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
httpServer.on("upgrade", httpServerUpgradeHandler);

const wsClients = new Set();
let wsShortBroadcastTimer = null;
let wsFullBroadcastInterval = null;

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
        scheduleWsFullBroadcast(true);
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
    scheduleWsFullBroadcast(true);
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

    scheduleWsShortBroadcast();

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

/********************************************************************************/
/* debug only                                                                   */
/********************************************************************************/

const debugSimulationIntervalMs = 50;

const dbg_data = '{\n' +
    '  "10.0.0.2":{"name":"DEMO 002","comment":"This is demo receiver #2","freq":"684.000","squelch":"15","afOut":"18","lastUpdate":1635089614363,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":0},"warningString":"Low Batt"},\n' +
    '  "10.0.0.1":{"name":"DEMO 001","comment":"And this is his companion, demo #1","freq":"670.150","squelch":"15","afOut":"18","lastUpdate":1635089614378,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"}\n' +
    '}';

let dbgMap = new Map();

function buildDbgMap() {
    let dbgRcv = JSON.parse(dbg_data);
    dbgMap = new Map();
    Object.entries(dbgRcv).forEach(entry => {
        const [key,val] = entry;
        dbgMap.set(key.replace('"',''), val);
    });
    dbgMap = new Map([...dbgMap.entries()].sort(compareIPv4mapKeys));
}

function clampMeterValue(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function buildAfMuteState(af) {
    let muteState = 0;
    if(af.mute) muteState |= 1;
    if(af.txMute) muteState |= 2;
    if(af.rfMute) muteState |= 4;
    if(af.rxMute) muteState |= 8;
    return muteState;
}

function initDebugSimulation() {
    buildDbgMap();

    dbgMap.forEach(function(rx, address) {
        knownReceiversFull.set(address, Object.assign({}, rx));
        knownReceiversShort.set(address, Object.assign({}, rx));
    });

    simulateDebugReceiverUpdates();
    setInterval(simulateDebugReceiverUpdates, debugSimulationIntervalMs);
}

function simulateDebugReceiverUpdates() {
    const now = Date.now();
    let index = 0;

    dbgMap.forEach(function(rx, address) {
        const phase = (now / 120) + (index * 1.7);
        const rf1min = clampMeterValue(15 + 35 * Math.sin(phase));
        const rf1max = clampMeterValue(rf1min + 8 + 22 * Math.sin((phase * 1.3) + 0.5));
        const rf2min = clampMeterValue(10 + 30 * Math.sin(phase + 1.2));
        const rf2max = clampMeterValue(rf2min + 6 + 18 * Math.sin((phase * 1.1) + 2));
        const afHold = clampMeterValue(20 + 50 * Math.sin((phase * 0.9) + 0.3));
        const afPeak = clampMeterValue(afHold + 5 + 25 * Math.sin((phase * 1.5) + 1));
        const rfCurrent = clampMeterValue(25 + 45 * Math.sin(phase * 0.7));
        const afMuteState = buildAfMuteState(rx.af);

        const msg =
            "rf1 " + rf1min + " " + rf1max + " " + (rx.rf1.active ? "1" : "0") + "\r" +
            "rf2 " + rf2min + " " + rf2max + " " + (rx.rf2.active ? "1" : "0") + "\r" +
            "af " + afPeak + " " + afHold + " " + afMuteState + "\r" +
            "rf " + rfCurrent + " 1 0\r";

        updateReceiver(address, msg);
        index++;
    });
}

/********************************************************************************/
/* end debug only                                                               */
/********************************************************************************/

if(DO_DEBUG) {
    initDebugSimulation();
}
else {
    sendCyclicRequest(udpSock);
    pushIntervalHandle = setInterval(sendCyclicRequest, 80000, udpSock);
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

function ipv4ToInt(ip) {
    const p = ip.split(".").map(Number);
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
    // >>>0 (unsigned right shift) converts the signed 32-bit int to unsigned
}

/**
 * Sort Map entries by IPv4 address (numeric order)
 * @param a Map entry [ip, value]
 * @param b Map entry [ip, value]
 * @returns {number}
 */
function compareIPv4mapKeys(a, b) {
    return ipv4ToInt(a[0]) - ipv4ToInt(b[0]);
}

function getShortStateArray() {
    return [...knownReceiversShort];
}

function getFullStateArray() {
    return [...knownReceiversFull];
}

function isLegacyUserAgent(userAgent) {
    return userAgent.indexOf("iPad") !== -1;
}

function hasLegacyWsClient() {
    for (const client of wsClients) {
        if (client.legacy)
            return true;
    }
    return false;
}

function buildWsMessage(type) {
    return JSON.stringify({
        t: type,
        d: type === "f" ? getFullStateArray() : getShortStateArray()
    });
}

function encodeWsTextFrame(text) {
    const payload = Buffer.from(text, "utf8");
    const len = payload.length;
    let header;

    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81;   //single frame header
        header[1] = len;
    }
    else if (len < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    }
    else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeUInt32BE(0, 2);
        header.writeUInt32BE(len, 6);
    }

    return Buffer.concat([header, payload]);
}

function wsSendText(socket, text) {
    socket.write(encodeWsTextFrame(text));
}

function wsSendPong(socket, pingPayload) {
    const payload = pingPayload || Buffer.alloc(0);
    const len = payload.length;
    const header = Buffer.alloc(2);
    header[0] = 0x8A;
    header[1] = len;
    socket.write(Buffer.concat([header, payload]));
}

function handleWsClientData(client, buffer) {
    if (buffer.length < 2)
        return;

    const opcode = buffer[0] & 0x0F;
    let payloadLen = buffer[1] & 0x7F;
    let offset = 2;

    if (payloadLen === 126) {
        if (buffer.length < 4)
            return;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
    }
    else if (payloadLen === 127) {
        if (buffer.length < 10)
            return;
        payloadLen = buffer.readUInt32BE(6);
        offset = 10;
    }

    if ((buffer[1] & 0x80) !== 0)
        offset += 4;

    if (opcode === 0x8) {
        client.socket.end();
        removeWsClient(client);
    }
    else if (opcode === 0x9) {
        wsSendPong(client.socket, buffer.slice(offset, offset + payloadLen));
    }
}

function removeWsClient(client) {
    wsClients.delete(client);
    if (wsClients.size === 0) {
        if (wsShortBroadcastTimer !== null) {
            clearTimeout(wsShortBroadcastTimer);
            wsShortBroadcastTimer = null;
        }
        if (wsFullBroadcastInterval !== null) {
            clearInterval(wsFullBroadcastInterval);
            wsFullBroadcastInterval = null;
        }
    }
}

function broadcastWsShort() {
    if (wsClients.size === 0)
        return;

    const payload = buildWsMessage("s");
    const now = Date.now();
    let skippedLegacy = false;

    wsClients.forEach(function(client) {
        const minInterval = client.legacy ? 250 : 100;
        if (now - client.lastShortSent >= minInterval) {
            try {
                wsSendText(client.socket, payload);
                client.lastShortSent = now;
            }
            catch (e) {
                removeWsClient(client);
            }
        }
        else if (client.legacy) {
            skippedLegacy = true;
        }
    });

    if (skippedLegacy)
        scheduleWsShortBroadcast();
}

function sendWsFullToClient(client) {
    try {
        wsSendText(client.socket, buildWsMessage("f"));
        client.lastFullSent = Date.now();
    }
    catch (e) {
        removeWsClient(client);
    }
}

function broadcastWsFull() {
    if (wsClients.size === 0)
        return;

    const payload = buildWsMessage("f");
    const now = Date.now();

    wsClients.forEach(function(client) {
        try {
            wsSendText(client.socket, payload);
            client.lastFullSent = now;
        }
        catch (e) {
            removeWsClient(client);
        }
    });
}

function ensureWsFullBroadcastInterval() {
    if (wsFullBroadcastInterval !== null)
        return;

    wsFullBroadcastInterval = setInterval(function() {
        if (wsClients.size === 0) {
            clearInterval(wsFullBroadcastInterval);
            wsFullBroadcastInterval = null;
            return;
        }
        broadcastWsFull();
    }, 10000);
}

function scheduleWsShortBroadcast() {
    if (wsClients.size === 0 || wsShortBroadcastTimer !== null)
        return;

    const delay = hasLegacyWsClient() ? 250 : 100;
    wsShortBroadcastTimer = setTimeout(function() {
        wsShortBroadcastTimer = null;
        broadcastWsShort();
    }, delay);
}

function scheduleWsFullBroadcast(immediate) {
    if (wsClients.size === 0)
        return;

    if (immediate)
        broadcastWsFull();

    ensureWsFullBroadcastInterval();
}

function httpServerUpgradeHandler(request, socket) {
    const requestUrl = request.url || "";
    if (!requestUrl.includes("/ws")) {
        socket.destroy();
        return;
    }

    const secWebSocketKey = request.headers["sec-websocket-key"];
    if (!secWebSocketKey) {
        socket.destroy();
        return;
    }

    // RFC 6455 WebSocket handshake: Sec-WebSocket-Accept = Base64(SHA1(key + magic GUID))
    const acceptKey = crypto
        .createHash("sha1")
        .update(secWebSocketKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11") // fixed protocol constant, not app-specific
        .digest("base64");

    socket.write(
        "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n"
    );

    const client = {
        socket: socket,
        legacy: isLegacyUserAgent(request.headers["user-agent"] || ""),
        lastShortSent: 0,
        lastFullSent: 0
    };

    wsClients.add(client);

    // Defer until handshake is complete so the client is ready to receive a full snapshot.
    setImmediate(function() {
        if(wsClients.has(client))
            sendWsFullToClient(client);
    });

    ensureWsFullBroadcastInterval();

    socket.on("data", function(chunk) {
        handleWsClientData(client, chunk);
    });
    socket.on("close", function() {
        removeWsClient(client);
    });
    socket.on("error", function() {
        removeWsClient(client);
    });
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
        return res.end(JSON.stringify(getShortStateArray()));
    }
    else if(req.url.includes("rxFull.json")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(getFullStateArray()));
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
    else if(req.url.includes("manifest.json")) {
        fs.readFile("www/manifest.json", function(err, data) {
            if (err) {
                res.statusCode = 500;
                return res.end("File not readable.");
            }
            res.setHeader("Content-Type", "application/manifest+json");
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