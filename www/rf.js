var reloadStateHandle = null;
var isLegacyClient = !!(navigator.userAgent.match(/(iPad)/));
var defaultIntervalMs = (isLegacyClient) ? 250 : 100;
var fullEveryCycles = Math.ceil(2000/defaultIntervalMs);    //every 2s full refresh
var iterationCount = 0;

function loadJson(url, callback) {
    var xhr = new XMLHttpRequest();
    // xhr.overrideMimeType("application/json");
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // .open will NOT return a value
            // but simply returns undefined in async mode so use a callback
            callback(xhr.responseText);
        }
    }
    xhr.send(null);
}

function loadState() {
    // $.getJSON("http://localhost:8080/short.json", function (data) {

    var full = (iterationCount % fullEveryCycles === 0);
    iterationCount++;

    if(full) {
        loadJson("RxFull.json",function(response) {
            updateState(JSON.parse(response),true);
        });
    }
    else {
        loadJson("RxShort.json",function(response) {
            updateState(JSON.parse(response),false);
        });
    }
    // if(full) {
    //     fetch("RxFull.json")
    //         .then(response => response.json())
    //         .then(data => {
    //             updateState(data, true);
    //         })
    //         .catch(err => console.log(err))
    // }
    // else {
    //     fetch("RxShort.json")
    //         .then(response => response.json())
    //         .then(data => {
    //             updateState(data, false);
    //         })
    //         .catch(err => console.log(err))
    // }
}

function updateState(data, full) {
    // console.log(data);
    var rxArea = document.getElementById("rfArea");

    if(data.length === 0)
        document.getElementById('noDevicesOverlay').classList.remove("hidden");
    else
        document.getElementById('noDevicesOverlay').classList.add("hidden");


    // for(const [key,rx] of data) { //ECMA6 only
    data.forEach(function(elem) {
        var rx = elem[1];
        var key = elem[0];

        if(document.getElementById("rx-"+key) === null) {
            rxArea.insertAdjacentHTML('beforeend', "" +
                "<div class='rx' id='rx-"+key+"'>" +
                "<div style='align-content: baseline; padding-bottom: .25rem; overflow: hidden;'>" +
                "<div style='font-weight: bold; font-size: 1.2em; float: left; overflow: hidden;'>&nbsp;</div>" +
                "<div style='font-family: monospace; font-size: .8rem; line-height: 1.2rem; text-align: right;'><span></span><small>MHz</small></div>" +
                "</div>" +
                "<div style='clear: both;'>" +
                "<div style='float: left; padding-right: .5rem;'>" +
                "<svg width='25' height='66'><g transform='scale(1,-1)'>" +
                "<rect x='0' y='-100%' height='0%' width='100%' fill='red' fill-opacity='1'></rect>" +
                "<rect x='0' y='-100%' width='100%' height='90%' stroke-width='5' stroke='var(--rx-battery)' fill-opacity='0'></rect>" +
                "<rect x='25%' y='-5%' height='10%' width='50%' fill='var(--rx-battery)'></rect>" +
                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='150%' fill='var(--rx-battery)' style='visibility: hidden; transform: scaleY(-1);'>?</text>" +
                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='200%' fill='var(--rx-text-warning)' font-weight='bolder' style='visibility: hidden; transform: scaleY(-1);'>!</text>" +
                "</g></svg>" +
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
                "</div>");
        }
        else {
            var rxObject = document.getElementById("rx-"+key);

            if(full) {
                // document.getElementById("loadingBeacon").style.opacity = "1";
                // document.getElementById("loadingBeacon").style.animation = "";
                // // document.getElementById("loadingBeacon").style.animation = "fadeOutAnimation 100ms 1";
                // window.requestAnimationFrame(function(time) {
                //     document.getElementById("loadingBeacon").style.animation = "fadeOutAnimation 100ms 1";
                // });

                rxObject.children[0].children[0].textContent = rx.name;
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

            if(isLegacyClient) {
                rxObject.children[1].children[1].children[0].children[0].children[1].style.width = Math.min(100,(rx.rf1.min))+"%";
                rxObject.children[1].children[1].children[0].children[0].children[2].style.width = Math.min(100,(rx.rf1.max))+"%";
                rxObject.children[1].children[1].children[0].children[1].children[1].style.width = Math.min(100,(rx.rf2.min))+"%";
                rxObject.children[1].children[1].children[0].children[1].children[2].style.width = Math.min(100,(rx.rf2.max))+"%";
                rxObject.children[1].children[1].children[1].children[1].style.width = Math.min(100,(rx.af.currentHold))+"%";
                rxObject.children[1].children[1].children[1].children[2].style.width = Math.min(100,(rx.af.currentPeak))+"%";
            }
            else {
                rxObject.children[1].children[1].children[0].children[0].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf1.min))+"%)";
                rxObject.children[1].children[1].children[0].children[0].children[2].style.transform = "scaleX("+Math.min(100,(rx.rf1.max))+"%)";

                rxObject.children[1].children[1].children[0].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf2.min))+"%)";
                rxObject.children[1].children[1].children[0].children[1].children[2].style.transform = "scaleX("+Math.min(100,(rx.rf2.max))+"%)";

                rxObject.children[1].children[1].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.af.currentHold))+"%)";
                rxObject.children[1].children[1].children[1].children[2].style.transform = "scaleX("+Math.min(100,(rx.af.currentPeak))+"%)";

            }

            switch (rx.lastCyclePilot) {
                case 0:
                    rxObject.children[1].children[2].children[0].textContent = " ";
                    break;
                case 1:
                    rxObject.children[1].children[2].children[0].textContent = "P";
                    break;
                case 2:
                    rxObject.children[1].children[2].children[0].textContent = "?";
                    break;
            }

            // rxObject.children[1].children[2].children[1].textContent = ((Math.sign(rx.afOut) !== -1) ? "+" : "") + "" + rx.afOut;
            rxObject.children[1].children[2].children[2].style.visibility = (rx.flags.lastCycleMute && rx.warningString !== "RF Mute") ? "visible" : "hidden";
            rxObject.children[1].children[2].children[3].textContent = (rx.warningString === "OK" || rx.warningString === "RF Mute") ? " " : rx.warningString;
        }
    });

    return true;
}

function stopRefresh() {
    if(reloadStateHandle !== null)
        window.clearInterval(reloadStateHandle);
}

function conditionalLog(msg) {
    console.log(msg);
}

document.addEventListener('DOMContentLoaded', function () {
    // ready function
    conditionalLog("execute ready function");
    if(reloadStateHandle === null)
        reloadStateHandle = window.setInterval(loadState,defaultIntervalMs); //15

    // window.setTimeout(stopRefresh, 5000);
    document.getElementById("loadingBeacon").addEventListener('animationiteration', function() {
        this.style.animation = '';
    }, false);
});