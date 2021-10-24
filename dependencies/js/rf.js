let reloadStateHandle = null;

function loadState() {
    // $.getJSON("http://localhost:8080/short.json", function (data) {
    $.getJSON("RxFull.json", function (data) {
        updateState(data);
    })
    .fail(function () {
        console.log("JSON load error");
    });
}

function updateState(data) {
    // window.requestAnimationFrame(function(time) {
    //     document.getElementById("loadingBeacon").style.animation = "fadeOutAnimation 100ms 1;";
    // });
    let rxArea = document.getElementById("rfArea");

    for(const [key,rx] of Object.entries(data)) {
        if(document.getElementById("rx-"+key) === null) {
            rxArea.insertAdjacentHTML('beforeend', "" +
                // "<div class='rx' id='rx-"+key+"' style='opacity: "+((rx.lastCyclePilot === 0) ? ".5" : "1")+";'>" +
                "<div class='rx' id='rx-"+key+"'>" +
                    "<div style='align-content: baseline; padding-bottom: .25rem; overflow: hidden;'>" +
                        "<div style='font-weight: bold; font-size: 1.2em; float: left;'>&nbsp;</div>" +
                        "<div style='font-family: monospace; font-size: .8rem; line-height: 1.2rem; text-align: right;'>&nbsp;<small>MHz</small></div>" +
                    "</div>" +
                    "<div style='clear: both;'>" +
                        "<div style='float: left; padding-right: .5rem;'>" +
                            "<svg width='25' height='66'><g transform='scale(1,-1)'>" +
                                "<rect x='0' y='-100%' height='0%' width='100%' fill='red' fill-opacity='1'></rect>" +
                                // "<g fill='red' fill-opacity='1'>" +
                                //     "<rect x='12.5%' y='-100%' height='25%' width='75%'></rect>" +
                                //     "<rect x='12.5%' y='-70%' height='25%' width='75%'></rect>" +
                                //     "<rect x='12.5%' y='-40%' height='25%' width='75%'></rect>" +
                                // "</g>" +
                                "<rect x='0' y='-100%' width='100%' height='90%' stroke-width='5' stroke='#ba92a8' fill-opacity='0'></rect>" +
                                "<rect x='25%' y='-5%' height='10%' width='50%' fill='#ba92a8'></rect>" +
                                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='150%' fill='#ba92a8' style='visibility: hidden; transform: scaleY(-1);'>?</text>" +
                                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='200%' fill='red' font-weight='bolder' style='visibility: hidden; transform: scaleY(-1); animation: pulseAnimation 1s infinite;'>!</text>" +
                            "</g></svg>" +
                        "</div>" +
                        "<div style='align-content: start; overflow: hidden;'>" +
                            "<div style='align-content: start;'>" +
                                // "<meter value='0' min='0' max='100' style='width: 100%; transform-origin: left; height: 1rem; background-color: transparent;'></meter>" +
                                "<div class='meterBox'>" +
                                    "<span>I</span>" +
                                    "<div style='background-color: #d16454;'></div>" +
                                "</div>" +
                                "<div class='meterBox' style='margin-top: .1rem;'>" +
                                    "<span>II</span>" +
                                    "<div style='background-color: #d16454;'></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='meterBox' style='margin-top: .25rem;'>" +
                                "<span></span>" +
                                "<div style='width: 100%; transform-origin: left; height: 100%; background-color: #ed9152;'></div>" +
                            "</div>" +
                        "</div>" +
                        "<div style='color: red; margin-top: .5rem;'></div>" +
                    "</div>" +
                "</div>");
        }
        else {
            let rxObject = document.getElementById("rx-"+key);
            if(rx.lastCyclePilot === 0)
                rxObject.classList.add("rxInactive");
            else
                rxObject.classList.remove("rxInactive");

            if(rx.warningString !== "OK" && rx.warningString !== "RF Mute")
                rxObject.classList.add("rxHighlight");
            else
                rxObject.classList.remove("rxHighlight");

            rxObject.children[0].children[0].innerHTML = ""+rx.name;
            rxObject.children[0].children[1].innerHTML = ""+rx.freq+"<small>MHz</small>";

            if(rx.battery.percentage > 70)
                rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "darkgreen");
            else if(rx.battery.percentage > 30)
                rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "green");
            else if(rx.battery.percentage > 10)
                rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "gold");
            else
                rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("fill", "red");

            rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("height", ""+Math.min(90,(rx.battery.percentage * 0.9))+"%");

            rxObject.children[1].children[0].children[0].children[0].children[3].style.visibility = rx.battery.known ? "hidden" : "visible";
            rxObject.children[1].children[0].children[0].children[0].children[4].style.visibility = (rx.battery.known && rx.battery.percentage === 0) ? "visible" : "hidden";

            rxObject.children[1].children[1].children[0].children[0].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf1.min))+"%)";
            rxObject.children[1].children[1].children[0].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.rf2.min))+"%)";

            rxObject.children[1].children[1].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.af.currentPeak))+"%)";
            // rxObject.children[1].children[1].children[1].style.transform = "scaleX("+Math.min(100,(rx.af.currentPeak))+"%)";

            rxObject.children[1].children[2].innerHTML = (rx.warningString === "OK") ? "&nbsp;" : rx.warningString;
        }
    }
}

function updateWindowSize() {
//     x_img_max = document.getElementById("webcamDrawArea").offsetWidth;
//     r_img_min = 10 * (document.getElementById("webcamDrawArea").offsetWidth / 800);
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
    updateWindowSize();
    if(reloadStateHandle === null)
        reloadStateHandle = window.setInterval(loadState,500); //15

    // window.setTimeout(stopRefresh, 5000);
    document.getElementById("loadingBeacon").addEventListener('animationiteration', function() {
        this.style.animation = '';
    }, false);
});