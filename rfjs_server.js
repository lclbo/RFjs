#!/usr/bin/env node
const DO_DEBUG = true;
const dbg_data = '{\n' +
    '  "192.168.1.103":{"name":"WB 03XXX","freq":"684.000","squelch":"15","afOut":"18","lastUpdate":1635089614363,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":0},"warningString":"Low Batt"},\n' +
    '  "192.168.1.121":{"name":"WB 21","freq":"640.350","squelch":"15","afOut":"18","lastUpdate":1635089614367,"rf1":{"min":0,"max":0,"active":false},"rf2":{"min":0,"max":0,"active":true},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"2","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":30},"warningString":"OK"},\n' +
    '  "192.168.1.111":{"name":"WB 11","freq":"678.000","squelch":"15","afOut":"18","lastUpdate":1635089614365,"rf1":{"min":70,"max":85,"active":true},"rf2":{"min":60,"max":90,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":40,"currentHold":60,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":70},"warningString":"OK"},\n' +
    '  "192.168.1.119":{"name":"WB 19","freq":"643.725","squelch":"15","afOut":"18","lastUpdate":1635089614366,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":104,"currentHold":60,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":true,"percentage":100},"warningString":"OK"},\n' +
    '  "192.168.1.108":{"name":"WB 08","freq":"679.050","squelch":"15","afOut":"18","lastUpdate":1635089614365,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":103,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"TX Mute"},\n' +
    '  "192.168.1.115":{"name":"WB 15","freq":"642.775","squelch":"15","afOut":"18","lastUpdate":1635089614368,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.118":{"name":"WB 18","freq":"641.975","squelch":"15","afOut":"18","lastUpdate":1635089614364,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":1,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"AF Peak"},\n' +
    '  "192.168.1.107":{"name":"WB 07","freq":"684.450","squelch":"15","afOut":"18","lastUpdate":1635089614368,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":2,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.102":{"name":"WB 02","freq":"673.350","squelch":"11","afOut":"18","lastUpdate":1635089614367,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.109":{"name":"WB 09","freq":"670.650","squelch":"15","afOut":"18","lastUpdate":1635089614385,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.122":{"name":"WB 22","freq":"643.350","squelch":"15","afOut":"18","lastUpdate":1635089614079,"rf1":{"min":0,"max":0,"active":false},"rf2":{"min":0,"max":0,"active":true},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"2","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.125":{"name":"WB 25","freq":"638.150","squelch":"15","afOut":"18","lastUpdate":1635089614368,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.105":{"name":"WB 05","freq":"678.400","squelch":"15","afOut":"18","lastUpdate":1635089614370,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.104":{"name":"WB 04","freq":"681.975","squelch":"9","afOut":"18","lastUpdate":1635089614369,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.120":{"name":"WB 20","freq":"639.000","squelch":"15","afOut":"18","lastUpdate":1635089614366,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.113":{"name":"WB 13","freq":"671.275","squelch":"15","afOut":"18","lastUpdate":1635089614369,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.114":{"name":"WB 14","freq":"685.200","squelch":"15","afOut":"18","lastUpdate":1635089614367,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.116":{"name":"WB 16","freq":"639.325","squelch":"15","afOut":"18","lastUpdate":1635089614400,"rf1":{"min":114,"max":114,"active":true},"rf2":{"min":106,"max":106,"active":false},"flags":{"lastCycleMute":0,"lastCycleTxMute":0,"lastCycleRfMute":0,"lastCycleRxMute":0},"lastCyclePilot":1,"rf":{"current":114,"antenna":"1","pilot":true},"af":{"currentPeak":0,"currentHold":0,"mute":0,"txMute":0,"rfMute":0,"rxMute":0},"battery":{"known":true,"percentage":30},"warningString":"OK"},\n' +
    '  "192.168.1.117":{"name":"WB 17","freq":"640.825","squelch":"15","afOut":"18","lastUpdate":1635089614369,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.106":{"name":"WB 06","freq":"680.325","squelch":"15","afOut":"18","lastUpdate":1635089614371,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.101":{"name":"WB 01","freq":"638.450","squelch":"15","afOut":"18","lastUpdate":1635089614370,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.112":{"name":"WB 12","freq":"644.250","squelch":"15","afOut":"18","lastUpdate":1635089614374,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.110":{"name":"WB 10","freq":"670.150","squelch":"15","afOut":"18","lastUpdate":1635089614378,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.201":{"name":"WB 01","freq":"638.450","squelch":"15","afOut":"18","lastUpdate":1635089614370,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.202":{"name":"WB 12","freq":"644.250","squelch":"15","afOut":"18","lastUpdate":1635089614374,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":3,"currentHold":3,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"},\n' +
    '  "192.168.1.203":{"name":"WB 10","freq":"670.150","squelch":"15","afOut":"18","lastUpdate":1635089614378,"rf1":{"min":0,"max":0,"active":true},"rf2":{"min":0,"max":0,"active":false},"flags":{"lastCycleMute":1,"lastCycleTxMute":1,"lastCycleRfMute":1,"lastCycleRxMute":1},"lastCyclePilot":0,"rf":{"current":0,"antenna":"1","pilot":false},"af":{"currentPeak":4,"currentHold":4,"mute":1,"txMute":1,"rfMute":1,"rxMute":1},"battery":{"known":false,"percentage":0},"warningString":"RF Mute"}\n' +
    '}';
let dbgRcv = JSON.parse(dbg_data);
let dbgMap = new Map();
Object.entries(dbgRcv).forEach(entry => {
    const [key,val] = entry;
    dbgMap.set(key.replace('"',''), val);
});
dbgMap = new Map([...dbgMap.entries()].sort(compareIPv4mapKeys));
let dbg_str = JSON.stringify([...dbgMap]);


const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const os = require('os');

let httpServerPort = 80;
let removeReceiversAfterNoUpdateInSeconds = 60;


const udpSock = dgram.createSocket('udp4');
const udpBindAddress = findSuitableNetworkAddressForUDP(os);

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
}
else {
    udpSock.bind({port: 53212, address: udpBindAddress}, () => {
        udpSock.setBroadcast(true);
    });
}

sendCyclicRequest(udpSock);

pushIntervalHandle = setInterval(sendCyclicRequest, 80000, udpSock);

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