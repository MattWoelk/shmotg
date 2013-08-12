// {{{ Loading Spinner Icon
var myLoader = loader().width(25).height(25);
d3.select("#loader_container").call(myLoader);
/// Loading Spinner Icon }}}

//{{{ ZOOMING AND CHANGING
var supportsOrientationChange = "onorientationchange" in window;
var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(
    orientationEvent,
    function() {
        if (navigator.userAgent.match(/android/i)) {
            setTimeout("redraw()", 500); //Only wait for Android
        } else {
            redraw();
        }
    },
    false
);

document.getElementById("render-lines").addEventListener("change", changeLines, false);
//document.getElementById("render-depth").addEventListener("change", changeLines, false);
//  an alternative so that it waits for you to lift up your mouse/finger:
//document.getElementById("render-depth").addEventListener("mouseup", changeLines, false);
//document.getElementById("render-depth").addEventListener("touchend", changeLines, false);
document.getElementById("render-method").addEventListener("change", changeLines, false);

// The zoom limits for the plot
var zoomExtents = setExtents();

// The changing zoom extents from the perspective
// of the mouse scrolling function.
var zoomExtentsForScale = [zoomExtents[0], zoomExtents[1]];

d3.select("#zoomin").on("click", zoomin);
d3.select("#zoomout").on("click", zoomout);
d3.select("#scrollleft").on("click", scrollleft);
d3.select("#scrollright").on("click", scrollright);

// ZOOMING AND CHANGING }}}

//{{{ VARIABLES

var plots = []; //an array of all plots
var msPS = 5; // frequency of data samples

// TODO: sync this with the one in bridgeChart.js
var margin = {top: 20, right: 10, bottom: 25, left: 30 + 80};

var zoomSVG = d3.select("#zoomSVG");
var zoomRect = d3.select("#zoomRect");

// these are the overall scales which are modified by zooming
// they should be set as the default for new plots
// and should show the offline demo data.
var xScale = d3.scale.linear().domain([1325567551000, 1325567552000]).range([0, document.getElementById("chartContainer").offsetWidth]);
var yScale = d3.scale.linear();

// VARIABLES }}}

// {{{ SLIDER
var sliderContainerName = "#slider_container";
var curLevel = 0;
var curPos = 0;
var boxSize = 30;
var mySlider = slider()
    .height(200)
    .width(80)
    .boxSize(boxSize)
    .changeCallBack(function (pos, i, cameFromZoom) {
        if (curLevel !== i) {
            plots.forEach(function (plt) {
                plt.whichLevelToRender(i).update();
            });
            curLevel = i;
        }
        var scaleFactor = Math.pow(2, pos/boxSize);
        if (curPos !== pos) {
            if (!cameFromZoom) {
                rescaleTo(scaleFactor);
            }
            curPos = pos;
        }
    })
    .numberOfLevels(33);
d3.select(sliderContainerName).call(mySlider);
// SLIDER }}}

//{{{ HELPER FUNCTIONS

function setExtents() {
    // TODO: magic: make this relative to width
    //var wid = document.getElementById("chartContainer").offsetWidth; // TODO: use this in the following equation.
    // [ how far zoomed-out , how far zoomed-in ]
    return [Math.pow(2, -30), Math.pow(2,4)];
}

var getTotalChartHeight = function () {
    var total = 0;
    _.each(plots, function (d, i) {
        total = total + d.height();
    });
    return total;
}

var setAllYAxisLocks = function (toLock) {
    plots.forEach(function (plt) {
        plt.yAxisLock(toLock);
    });
}

var redraw = function () {
    plots.forEach(function (plt) {
        plt.containerWidth(document.getElementById("chartContainer").offsetWidth).update();
    });

    d3.select("#charts").attr("width", document.getElementById("chartContainer").offsetWidth);
    zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
           .attr("height", getTotalChartHeight());
    zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right)
            .attr("height", getTotalChartHeight())
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    //update the zoom for the new plot size
    updateZoom();
}

function transitionAllNextTime() {
    plots.forEach(function (plt) {
        plt.transitionNextTime(true);
    });
}

function setLoadingIcon(on) {
    d3.select("#loader_container").style("opacity", on ? 1 : 0);
}

var uniqueID = 0;
function initPlot(data, first, sendReq) {
    if (first) {
        var plot = binnedLineChart(data, sendReq, "girder", 18);
        plot.xScale(xScale.copy());
        var pl = d3.select("#charts").append("svg").attr("id", "girder"+18).call(plot);
    } else {
        var plot = binnedLineChart(data, function () {}, "girder", uniqueID);
        plot.xScale(xScale.copy());
        var pl = d3.select("#charts").append("svg").attr("id", "chart"+uniqueID).call(plot);
    }


    if (first) {
        plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(150).showTimeContext(true).milliSecondsPerSample(msPS).update();
    } else {
        plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(150).showTimeContext(false).milliSecondsPerSample(msPS).update();
    }

    plots.push(plot);

    redraw();

    d3.select("#charts").attr("height", getTotalChartHeight()).attr("width", document.getElementById("chartContainer").offsetWidth); //TODO: make this dynamic

    zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
           .attr("height", getTotalChartHeight())
           .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right)
            .attr("height", getTotalChartHeight() - margin.top)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    zoomRect.attr("fill", "rgba(0,0,0,0)")
            .call(zoom);

    // Redefine this function now that we have data for it to work from
    updateZoom = function () {
        zoomAll();
        xScale = plot.xScale();
        yScale = plot.yScale();
        zoom.x(xScale);
        //zoom.y(yScale); // This breaks proper updating of the y axis when you scroll left and right.
    };

    updateZoom();
    uniqueID = uniqueID + 1;
}

// this will be changed once 'news' is sent from the server
// for now it's just a dummy
var updateZoom = function () { return 0; };

function zoomAll() {
    // adjust slider
    var scal = getScaleValue(xScale);
    var newPos = boxSize * (Math.log(scal) / Math.log(2));
    mySlider.scrollPosition(newPos).update(true);

    // set plot scales
    plots.forEach(function (plt) {
        plt.xScale(xScale.copy()).update();
    });
}

var zoom = d3.behavior.zoom()
    .scaleExtent(zoomExtentsForScale)
    .on("zoom", zoomAll);


function changeLines () {
    plots.forEach(function (plt) {
        plt.setSelectedLines()/*.reRenderTheNextTime(true)*/.update();
    });
}

function rescaleTo(val) {
    var xdist = xScale.domain()[1] - xScale.domain()[0];

    var oldScaleVal = getScaleValue(xScale);
    var oldZoomScale = zoom.scale();

    // We want the new scale value to be val
    var newDist = (xScale.range()[1] - xScale.range()[0]) / val;

    // Calculate where the domain needs to move, and move it
    var displacement = (newDist - xdist) / 2;
    var tmpScale = d3.scale.linear().range(xScale.range());
    tmpScale.domain([
        xScale.domain()[0] - displacement,
        xScale.domain()[1] + displacement
    ]);

    // update the scale if it's within the extents
    var doWeScale = scaleWithinExtents(tmpScale);
    if (doWeScale) {
        xScale = tmpScale;
    }

    // reset the x scale so zooming still works
    zoom.x(xScale);

    // since the zoom scale resets to 1 when we
    // reset its xscale, we need to change its
    // extents to match the change in ratio
    var newScaleVal = getScaleValue(xScale);
    var ratio = (oldScaleVal / newScaleVal ) / oldZoomScale;
    zoomExtentsForScale[0] *= ratio;
    zoomExtentsForScale[1] *= ratio;
    zoom.scaleExtent(zoomExtentsForScale);

    // update
    if (doWeScale) {
        //transitionAllNextTime();
    }
    zoomAll();
}

// func1 is the function which modifies the domain start in terms of the old domain start, and xdist
// func2 is the function which modifies the domain end in terms of the old domain end, and xdist
function changeZoom(func1, func2) {
    var xdist = xScale.domain()[1] - xScale.domain()[0];

    // for later ratio adjustment
    var oldScaleVal = getScaleValue(xScale);
    var oldZoomScale = zoom.scale();

    // create an updated scale which the new domain
    var tmpScale = d3.scale.linear().range(xScale.range());
    tmpScale.domain([
                    func1(xScale.domain()[0], xdist),
                    func2(xScale.domain()[1], xdist)
    ]);

    // update the scale if it's within the extents
    var doWeScale = scaleWithinExtents(tmpScale);
    if (doWeScale) {
        xScale = tmpScale;
    }

    // reset the x scale so zooming still works
    zoom.x(xScale);

    // since the zoom scale resets to 1 when we
    // reset its xscale, we need to change its
    // extents to match the change in ratio
    var newScaleVal = getScaleValue(xScale);
    var ratio = (oldScaleVal / newScaleVal ) / oldZoomScale;
    zoomExtentsForScale[0] *= ratio;
    zoomExtentsForScale[1] *= ratio;
    zoom.scaleExtent(zoomExtentsForScale);

    // update
    if (doWeScale) {
        transitionAllNextTime();
    }
    zoomAll();
}

function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
}

function scaleWithinExtents (value) {
    // return true if value's scale value is within zoom extents
    return (getScaleValue(value) < zoomExtents[1] &&
            getScaleValue(value) > zoomExtents[0] );
}

function zoomin() {
    changeZoom(
        function (a, b) { return a + (b/4); },
        function (a, b) { return a - (b/4); }
    );
}

function zoomout() {
    changeZoom(
        function (a, b) { return a - (b/2); },
        function (a, b) { return a + (b/2); }
    );
}

function scrollleft() {
    changeZoom(
        function (a, b) { return a + (b/4); },
        function (a, b) { return a + (b/4); }
    );
}

function scrollright() {
    changeZoom(
        function (a, b) { return a - (b/4); },
        function (a, b) { return a - (b/4); }
    );
}

// HELPER FUNCTIONS }}}

//{{{ SERVER COMMUNICATIONS

var socket = io.connect('130.179.231.28:8080/');
var firstTime = true;

//socket.on('connect_failed', function () {
//  console.log("connect_failed :(");
//});
//
//socket.on('connecting', function () {
//  console.log("connecting :!");
//});
//
//socket.on('connect', function () {
//  console.log("connected !!");
//});
//
//socket.on('disconnect', function () {
//  console.log("disconnected !!");
//});


socket.on('news', function (data) {
    // only do this once, so that plots don't get overlapped whenever the server restarts.
    if (!firstTime) {
        return;
    }
    // SPB is 200Hz

    firstTime = false;

    // deleting all example plots -->
    _.times(plots.length, function (i) {
        delete plots[i];
    });
    svg = document.getElementById("charts");
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
    plots = []; // delete the previous plots
    // <-- done deleting all example plots

    var json = JSON.parse(data);
    socket.emit('ack', "Message received!");

    //initPlot(json);
    initPlot(json, true, sendRequestToServer);

    //initPlot(_.map(json, function (d) {
    //  return { val: Math.random() * 5 + d.val,
    //           ms: d.ms };
    //}), false);
});

sizeOfQueue = function() {
    var size = 0, key;
    for (key in serverQueue) {
        if (serverQueue.hasOwnProperty(key)) size++;
    }
    return size;
};

removeFromQueue = function (key) {
    delete serverQueue[key];
}

// things which we are waiting for the server to send to us
var serverQueue = {};

function addToServerQueue(ob) {
    serverQueue[ob.id] = ob.req;
};

var uniqueRequestID = 0;
var timeOfLastRequest = 0;
var listOfRequestsMade = [];

function sendRequestToServer(req) {
    // turn on loading icon
    setLoadingIcon(true);

    var now = new Date();
    if(_.findWhere(listOfRequestsMade, {ms_start: req.ms_start, ms_end: req.ms_end, bin_level: req.bin_level})) {
        // never request the same thing twice
        //console.log("already requested");
        setLoadingIcon(false);
        return false;
    }

    listOfRequestsMade.push(req);

    //console.log("requesting");

    // wrap the req with a unique id
    var sendReq = {
        id: uniqueRequestID,
        req: req };

    uniqueRequestID = uniqueRequestID + 1;

    // add the request to the queue
    addToServerQueue(sendReq);

    timeOfLastRequest = now;

    socket.emit('req', JSON.stringify(sendReq));
    return true;
}

socket.on('req_data', function (data) {
    var received = JSON.parse(data);
    // remove request from server queue
    removeFromQueue(received.id);
    var req = received.req;

    // deactivate loading icon
    if (sizeOfQueue() === 0) {
        setLoadingIcon(false);
    }

    for (i=0;i<plots.length;i++) {
        if (plots[i].uniqueID() === "" + received.sensorType + received.sensorNumber) {
            plots[i].addDataToBinData(req, received.bin_level).reRenderTheNextTime(true).update();
        }
    }
});

// SERVER COMMUNICATIONS }}}

//{{{ OFFLINE DEMO

// A demonstration with example data in case the server is down:
// wait 2 seconds to give the server a chance to send the data (to avoid the demo popping up and then disappearing)
// TODO: make this based on the server communication, instead of a time to wait.
setTimeout(rundemo, 1500);
//rundemo();

function rundemo() {
    d3.json("Server/esg_time.js", function (error, data) {
        if (error || plots.length > 0) {
            return;
        }
        setLoadingIcon(true); // loading icon indicates that we can't connect to the server
        var json = data.map(function (d) {
            return {val: d.ESGgirder18, ms: d.ms};
        });

        initPlot(json, true);

        //console.log(plots[0].bd().bd());
    });
}

// OFFLINE DEMO }}}

/* vim: set foldmethod=marker: */
