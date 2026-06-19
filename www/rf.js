/*
 * Client side script for RFjs
 *
 * ES5 code compatible (down to iOS9)
 * for older devices, transformations are replaced with width modifications
 * and the server reduces push frequency for legacy clients
 */

var ws = null;
var wsReconnectHandle = null;
var wsReconnectDelayMs = 1000;
var isLegacyClient = !!(navigator.userAgent.match(/(iPad)/));
var errorCount = 0;
var errorThreshold = 10;

var numberOfReceivers = 0;

function getWebSocketUrl() {
    return "ws://" + window.location.host + "/ws";
}

function evaluateError() {
    if(errorCount >= errorThreshold) {
        document.getElementById("loadErrorOverlay").classList.remove("hidden");
    }
    else {
        document.getElementById("loadErrorOverlay").classList.add("hidden");
    }
}

function handleStateMessage(responseText) {
    if(errorCount !== 0) {
        errorCount = 0;
        evaluateError();
    }

    var msg = JSON.parse(responseText);
    updateState(msg.d, msg.t === "f");
}

function connectWebSocket() {
    if(ws !== null) {
        try {
            ws.close();
        }
        catch (e) {}
        ws = null;
    }

    ws = new WebSocket(getWebSocketUrl());

    ws.onopen = function() {
        if(errorCount !== 0) {
            errorCount = 0;
            evaluateError();
        }
    };

    ws.onmessage = function(evt) {
        handleStateMessage(evt.data);
    };

    ws.onclose = function() {
        ws = null;
        errorCount++;
        evaluateError();
        if(wsReconnectHandle === null) {
            wsReconnectHandle = window.setTimeout(function() {
                wsReconnectHandle = null;
                connectWebSocket();
            }, wsReconnectDelayMs);
        }
    };

    ws.onerror = function() {
        errorCount++;
        evaluateError();
    };
}

function clearAllReceivers() {
    document.getElementById("rfArea").innerHTML = "";
}

function updateState(data, full) {
    var rxArea = document.getElementById("rfArea");

    if(data.length !== numberOfReceivers) {
        clearAllReceivers();
    }
    numberOfReceivers = data.length;

    if(numberOfReceivers === 0)
        document.getElementById('noDevicesOverlay').classList.remove("hidden");
    else
        document.getElementById('noDevicesOverlay').classList.add("hidden");

    // for(const [key,rx] of data) { //ECMA6 only
    data.forEach(function(elem) {
        var rx = elem[1];
        var key = elem[0];

        if(document.getElementById("rx-"+key) === null) {
            rxArea.insertAdjacentHTML('beforeend', "" +
                "<div class='rx rxInactive' id='rx-" + key + "'>" +
                    "<div class='topBox'>" +
                        "<div class='topBoxName'>&nbsp;</div>" +
                        "<div class='topBoxFreq'>" +
                            "<span></span>" +
                            "<small>MHz</small>" +
                        "</div>" +
                        "<div class='topBoxComment'></div>" +
                    "</div>" +
                    "<div style='clear: both;'>" +
                        "<div style='float: left; padding-right: .5rem;'>" +
                            "<svg width='25' height='66'>" +
                                "<g transform='scale(1,-1)'>" +
                                    "<rect x='0' y='-100%' height='0%' width='100%' fill='red' fill-opacity='1'></rect>" +
                                    "<rect x='0' y='-100%' width='100%' height='90%' stroke-width='5' stroke='var(--rx-battery)' fill-opacity='0'></rect>" +
                                    "<rect x='25%' y='-5%' height='10%' width='50%' fill='var(--rx-battery)'></rect>" +
                                    "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='150%' fill='var(--rx-battery)' style='visibility: hidden; transform: scaleY(-1);'>?</text>" +
                                    "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='200%' fill='var(--rx-text-warning)' font-weight='bolder' style='visibility: hidden; transform: scaleY(-1);'>!</text>" +
                                "</g>" +
                            "</svg>" +
                        "</div>" +
                        "<div style='align-content: start; overflow: hidden;'>" +
                            "<div style='align-content: start;'>" +
                                "<div class='meterBox rfMeterBox'>" +
                                    "<span>I</span>" +
                                    "<div></div>" +
                                    "<div></div>" +
                                "</div>" +
                                "<div class='meterBox rfMeterBox' style='margin-top: .1rem;'>" +
                                    "<span>II</span>" +
                                    "<div></div>" +
                                    "<div></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='meterBox afMeterBox' style='margin-top: .25rem;'>" +
                                "<span></span>" +
                                "<div></div>" +
                                "<div></div>" +
                            "</div>" +
                        "</div>" +
                        "<div class='bottomBox'>" +
                            "<div>P</div>" +
                            "<div></div>" +
                            "<div>&#x26A0;</div>" +
                            "<div></div>" +
                        "</div>" +
                    "</div>" +
                "</div>"
            );
        }

        var rxObject = document.getElementById("rx-"+key);

        if(full) {
                rxObject.children[0].children[0].textContent = rx.name;
                rxObject.children[0].children[2].textContent = rx.comment;
                rxObject.children[0].children[1].children[0].textContent = rx.freq;
                if(rx.battery.percentage > 70)
                    rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "var(--rx-battery-gt70)");
                else if(rx.battery.percentage > 30)
                    rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "var(--rx-battery-gt30)");
                else if(rx.battery.percentage > 10)
                    rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "var(--rx-battery-gt10)");
                else
                    rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "var(--rx-battery-leq10)");

                rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("height", ""+Math.min(90,(rx.battery.percentage * 0.9))+"%");

                rxObject.children[1].children[0].children[0].children[0].children[3].style.visibility = rx.battery.known ? "hidden" : "visible";
                rxObject.children[1].children[0].children[0].children[0].children[4].style.visibility = (rx.battery.known && rx.battery.percentage === 0) ? "visible" : "hidden";

                if(rx.warningString === "RF Mute")
                    rxObject.classList.add("rxInactive");
                else
                    rxObject.classList.remove("rxInactive");

                if(rx.warningString !== "OK" && rx.warningString !== "RF Mute")
                    rxObject.classList.add("rxHighlight");
                else
                    rxObject.classList.remove("rxHighlight");
        }

        if(isLegacyClient) { //scale is not supported on iOS9
                // RF min and max for antenna I and II
                rxObject.children[1].children[1].children[0].children[0].children[1].style.width = Math.min(100,(rx.rf1.min))+"%";
                rxObject.children[1].children[1].children[0].children[0].children[2].style.width = Math.min(100,(rx.rf1.max))+"%";
                rxObject.children[1].children[1].children[0].children[1].children[1].style.width = Math.min(100,(rx.rf2.min))+"%";
                rxObject.children[1].children[1].children[0].children[1].children[2].style.width = Math.min(100,(rx.rf2.max))+"%";
                // AF meter + AF peak
                rxObject.children[1].children[1].children[1].children[1].style.width = Math.min(100,(rx.af.currentHold))+"%";
                rxObject.children[1].children[1].children[1].children[2].style.width = Math.min(100,(rx.af.currentPeak))+"%";
            }
            else {
                // RF min and max for antenna I and II
                rxObject.children[1].children[1].children[0].children[0].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf1.min))+"%)";
                rxObject.children[1].children[1].children[0].children[0].children[2].style.transform = "scaleX("+Math.min(100,(rx.rf1.max))+"%)";
                rxObject.children[1].children[1].children[0].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf2.min))+"%)";
                rxObject.children[1].children[1].children[0].children[1].children[2].style.transform = "scaleX("+Math.min(100,(rx.rf2.max))+"%)";
                // AF meter + AF peak
                rxObject.children[1].children[1].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.af.currentHold))+"%)";
                rxObject.children[1].children[1].children[1].children[2].style.transform = "scaleX("+Math.min(100,(rx.af.currentPeak))+"%)";
            }

            /* pilot flag:
                 * 0: never received pilot signal during since last message
                 * 1: always received ...
                 * 2: received pilot at least once since last message
             */
            switch (rx.lastCyclePilot) {
                case 0:
                    rxObject.children[1].children[2].children[0].textContent = " ";
                    break;
                case 1:
                    rxObject.children[1].children[2].children[0].textContent = "P";
                    break;
                case 2:
                default:
                    rxObject.children[1].children[2].children[0].textContent = "?";
                    break;
            }

            // rxObject.children[1].children[2].children[1].textContent = ((Math.sign(rx.afOut) !== -1) ? "+" : "") + "" + rx.afOut;
            rxObject.children[1].children[2].children[2].style.visibility = (rx.flags.lastCycleMute && rx.warningString !== "RF Mute") ? "visible" : "hidden";
            rxObject.children[1].children[2].children[3].textContent = (rx.warningString === "OK" || rx.warningString === "RF Mute") ? " " : rx.warningString;
    });

    return true;
}

function stopRefresh() {
    if(wsReconnectHandle !== null) {
        window.clearTimeout(wsReconnectHandle);
        wsReconnectHandle = null;
    }
    if(ws !== null) {
        try {
            ws.close();
        }
        catch (e) {}
        ws = null;
    }
}

function conditionalLog(msg) {
    console.log(msg);
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("loadingBeacon").style.animationPlayState = "running";
    connectWebSocket();
});
