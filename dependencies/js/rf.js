let globalTimestamp = new Date();
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
    // rxArea.innerHTML = "DATA:";
    for(const [key,rx] of Object.entries(data)) {
        if(document.getElementById("rx-"+key) === null) {
            rxArea.insertAdjacentHTML('beforeend', "" +
                // "<div class='rx' id='rx-"+key+"' style='opacity: "+((rx.lastCyclePilot === 0) ? ".5" : "1")+";'>" +
                "<div class='rx' id='rx-"+key+"'>" +
                    "<div style='align-content: baseline; padding-bottom: .25rem; overflow: hidden;'>" +
                        "<div style='font-weight: bold; font-size: 1.2em; float: left;'>"+rx.name+"</div>" +
                        "<div style='font-family: monospace; font-size: .8rem; line-height: 1.2rem; text-align: right;'>"+rx.freq+"<small>MHz</small></div>" +
                    "</div>" +
                    "<div style='clear: both;'>" +
                        "<div style='float: left; padding-right: .5rem;'>" +
                            // "<svg height='75' width='25'>" +
                            //     "<rect height='0%' width='100%' fill='red' fill-opacity='1'></rect>" +
                            //     "<rect width='100%' height='100%' stroke-width='10%' stroke='#55414a' fill-opacity='0'></rect>" +
                            // "</svg>" +
                "<svg width='25' height='60'><g transform='scale(1,-1)'>" +
                // "<path d='M219.5 14.2H208V0H0v66h208V51.8h11.5V14.2zM198.9 56H9.2V10h189.7v46z'/>" +
                "<rect x='0' y='-100%' height='0%' width='100%' fill='red' fill-opacity='1'></rect>" +
                "<rect x='0' y='-100%' width='100%' height='100%' stroke-width='5' stroke='#55414a' fill-opacity='0'></rect>" +
                "</g></svg>" +
                        "</div>" +
                        "<div style='align-content: start; overflow: hidden;'>" +
                            "<div style='align-content: start;'>" +
                                "<div style='width: 0; height: 1rem; margin-bottom: .1rem; background-color: #d16454; text-align: left;'></div>" +
                                "<div style='width: 0; height: 1rem; background-color: #d16454; text-align: left;'></div>" +
                            "</div>" +
                            "<div style='margin-top: .25rem; width: 0; height: 1rem; background-color: #ed9152; text-align: left;'></div>" +
                        "</div>" +
                        "<div></div>" +
                    "</div>" +
                "</div>");
        }
        else {
            let rxObject = document.getElementById("rx-"+key);
            rxObject.children[0].children[0].innerHTML = rx.name+"";
            rxObject.children[0].children[1].innerHTML = rx.freq+"<small>MHz</small>";
            rxObject.children[1].children[0].children[0].children[0].children[0].setAttribute("height", ""+Math.min(100,rx.battery.percentage));
            rxObject.children[1].children[0].children[0].children[0].children[0].style.animation
            // rxObject.children[1].children[1].children[0].children[0].style.width = Math.min(100,(rx.rf1.min))+"%";
            rxObject.children[1].children[1].children[0].children[0].style.transform = "scaleX("+Math.min(100,(rx.rf1.min))+"%)";
            rxObject.children[1].children[1].children[0].children[1].style.width = Math.min(100,(rx.rf2.min))+"%";
            rxObject.children[1].children[1].children[1].style.width = Math.min(100,(rx.af.currentPeak))+"%";
            rxObject.children[1].children[2].innerHTML = rx.warningString;
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
        reloadStateHandle = window.setInterval(loadState,200); //15

    // window.setTimeout(stopRefresh, 5000);
    document.getElementById("loadingBeacon").addEventListener('animationiteration', function() {
        this.style.animation = '';
    }, false);
});