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
document.getElementById("render-method").addEventListener("change", changeLines, false);

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
var plotHeightDefault = 150;

var zoomSVG = d3.select("#zoomSVG"); // holds zoomRect
var zoomRect = d3.select("#zoomRect"); // overlay which takes scroll/zoom input

// these are the overall scales which are modified by zooming
// they should be set as the default for new plots
// and should show the offline demo data.
var xScale = d3.scale.linear().domain([1325567551000, 1325567552000]).range([0, document.getElementById("chartContainer").offsetWidth]);
var yScale = d3.scale.linear();

var duration = 500; //duration of UI transitions

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

function swapItems(array, a, b){
    array[a] = array.splice(b, 1, array[a])[0];
    return array;
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
    var plotSVGs = d3.select("#charts").selectAll("svg").data(plots, function (d, i) { return d.uniqueID(); });

    // Weird hackery to reselect elements and call their specific plot
    // done this way because enter().selectAll().append().call(function(d)) doesn't give us anything useful.
    var plotsCaller = function(d) {
        var allPlots = d[0];

        for(var i = 0; i < allPlots.length; i++) {
            d3.select(allPlots[i]).call(plots[i]);
        }
    }

    function swapWithPrevItem(i) {
        if (i-1 < 0 || i >= plots.length) {
            return;
        }

        swapItems(plots, i, i-1); // swap in plots

        var parent = document.getElementById("charts");
        var charts = parent.childNodes;
        parent.insertBefore(charts[i], charts[i-1]); // swap in DOM
    }

    function swapWithNextItem(i) {
        if (i < 0 || i+1 >= plots.length) {
            return;
        }

        swapItems(plots, i, i+1); // swap in plots

        var parent = document.getElementById("charts");
        var charts = parent.childNodes;
        parent.insertBefore(charts[i+1], charts[i]); // swap in DOM
    }

    // ENTER
    plotSVGs.enter().append("svg").attr("id", function(d, i) { return d.sensorType() + d.sensorNumber(); });

    // EXIT
    plotSVGs.exit().remove();

    // UPDATE
    plotSVGs.call(plotsCaller);

    // Get list of available-but-not-on-display sensors
    var sensorsAvailable = ["temperature_1", "girder_18", "girder_20", "girder_22", "girder_45"];
    var sensorsShown = _.map(plots, function (d) {
        return d.sensorType() + "_" + d.sensorNumber();
    });
    var toBeAdded = _.difference(sensorsAvailable, sensorsShown);
    var sensorsAvailableObjects = _.map(toBeAdded, function (id) {
        var tmp = id.split("_");
        var sensorType = tmp[0];
        var sensorNumber = parseInt(tmp[1]);
        var result = {};
        result.sensorNumber = function() { return sensorNumber; };
        result.sensorType = function() { return sensorType; };
        return result;
    });

    // Expand chart container when add buttons are present.
    var plotHeight = plots[0] ? plots[0].height() : plotHeightDefault + margin.top + margin.bottom;
    var showingEdits = document.getElementById("edit").checked;
    var offset = showingEdits ? toBeAdded.length*plotHeight : 0;

    plots.forEach(function (plt) {
        plt.containerWidth(document.getElementById("chartContainer").offsetWidth).update();
    });

    d3.select("#charts").attr("width", document.getElementById("chartContainer").offsetWidth);
    zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
            .transition().duration(duration)
           .attr("height", getTotalChartHeight() + offset);
    zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
            .transition().duration(duration)
            .attr("height", getTotalChartHeight())

    //{{{ DRAW EDIT ELEMENTS
    var xsize = 70;
    var xspace = 20;
    var xbuffer = 130;
    var width = document.getElementById("chartContainer").offsetWidth - margin.right;

    // Show add/remove buttons
    var add_dat = d3.select("#edit_remove").selectAll("image").data(plots.concat(sensorsAvailableObjects), function (d) { return "" + d.sensorNumber() + d.sensorType(); });
    add_dat.enter().append("image")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .on("click", function(d, i){ if (_.contains(plots, d)) { var index = plots.indexOf(d); plots.splice(index, 1); redraw(); } else { addPlot(d.sensorType(), d.sensorNumber()); }})
    add_dat.transition().duration(duration)
        .attr("x", width - xsize)
        .attr("y", function(d,i) { return i*(plotHeight) + ((plotHeight - xsize) / 2); })
        .transition().duration(0)
        .attr("xlink:href", function (d) { if (_.contains(plots, d)) { return "./img/remove.svg"} return "./img/add.svg";})
    add_dat.exit().remove();

    // Show swap buttons
    var add_dat = d3.select("#edit_swap").selectAll("image").data(plots.slice(0, plots.length-1));
    add_dat.enter().append("image")
        .attr("xlink:href", "./img/updown.svg")
        .attr("width", 90)
        .attr("height", 90)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { swapWithPrevItem(i+1); redraw(); })
    add_dat
        .attr("x", xbuffer)
        .attr("y", function(d,i) { return (plotHeight/2 + 20) + i*(plotHeight) + ((plotHeight - 90) / 2); })
    add_dat.exit().remove();

    // Show add button text
    var add_dat = d3.select("#edit_add").selectAll("text").data(sensorsAvailableObjects, function (d) { return "" + d.sensorNumber() + d.sensorType(); });
    add_dat.enter().append("text")
        .attr("class", "sensor_title_add")
        .text(function (d) { return d.sensorType().capitalize() + " " + d.sensorNumber(); })
    add_dat.transition().duration(duration)
        .attr("x", width - (2*xsize))
        .attr("y", function(d,i) { return getTotalChartHeight() + i*(plotHeight) + (plotHeight/4); })
    add_dat.exit().remove();

    // DRAW EDIT ELEMENTS }}}

    //update the zoom for the new plot size
    updateZoom();
}

function addPlot(sensorType, sensorNumber) {
    var data = sensorType === "girder" ? {} : {}; // TODO: put special case here for temperature data.
    var interval = 5; // TODO: put special case here for temperature data.
    initPlot(data, sendRequestToServer, interval, sensorType, sensorNumber, curLevel);
}

function setAllPlotLevels() {
    plots.forEach(function (plt) {
        plt.whichLevelToRender(curLevel).update();
    });
}

function transitionAllNextTime() {
    plots.forEach(function (plt) {
        plt.transitionNextTime(true);
    });
}

function setLoadingIcon(on) {
    d3.select("#loader_container").style("opacity", on ? 1 : 0);
    d3.selectAll(".loadingBox").style("opacity", on ? 1 : 0);
}

function initPlot(data, sendReq, oneSample, sensorType, sensorNumber, level) {
    var plot;
    plot = binnedLineChart(data, sendReq, sensorType, sensorNumber, oneSample, level);
    plot.xScale(xScale.copy());

    plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(plotHeightDefault).showTimeContext(true).milliSecondsPerSample(msPS);//.update();

    plots.push(plot);

    redraw();

    d3.select("#charts").attr("height", getTotalChartHeight()).attr("width", document.getElementById("chartContainer").offsetWidth); //TODO: make this dynamic

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
    return plot;
}

// this will be changed once 'news' is sent from the server
// for now it's just a dummy
var updateZoom = function () { return 0; };
var oldXScale = d3.scale.linear();

function zoomAll() {
    // adjust slider
    var scal = getScaleValue(xScale);
    var newPos = boxSize * (Math.log(scal) / Math.log(2));

    if (mySlider.pastExtents(newPos)) {
        var tmpScale = oldXScale.copy();

        plots.forEach(function (plt) {
            plt.xScale(tmpScale.copy()).update();
        });
        xScale = tmpScale.copy();

        zoom.x(xScale);
    } else {
        mySlider.scrollPosition(newPos).update(true);

        // set plot scales
        plots.forEach(function (plt) {
            plt.xScale(xScale.copy()).update();
        });
    }

    oldXScale = xScale.copy();
}

var zoom = d3.behavior.zoom()
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
    xScale = tmpScale;

    // reset the x scale so zooming still works
    zoom.x(xScale);

    zoomAll();
}

function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
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

offlinedata();

socket.on('news', function (data) {
    // only do this once, so that plots don't get overlapped whenever the server restarts.
    if (!firstTime) {
        return;
    }
    firstTime = false;

    socket.emit('ack', "Message received!");

    initPlot({}, sendRequestToServer, 5, "girder", 18, curLevel);
    initPlot({}, sendRequestToServer, 5, "girder", 22, curLevel);
    initPlot({}, sendRequestToServer, 5, "girder", 45, curLevel);
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
var listOfRequestsMade = [];

function sendRequestToServer(req) {
    // turn on loading icon
    setLoadingIcon(true);

    if(_.findWhere(listOfRequestsMade, {sensorNumber: req.sensorNumber, sensorType: req.sensorType, ms_start: req.ms_start, ms_end: req.ms_end, bin_level: req.bin_level})) {
        // never request the same thing twice

        if (sizeOfQueue() === 0) {
            setLoadingIcon(false);
        }
        return false;
    }

    listOfRequestsMade.push(req);

    // wrap the req with a unique id
    var sendReq = {
        id: uniqueRequestID,
        req: req
    };

    uniqueRequestID = uniqueRequestID + 1;

    // add the request to the queue
    addToServerQueue(sendReq);

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

//{{{ OFFLINE DATA

function offlinedata() {
    d3.csv("weather/eng-hourly-01012012-01312012.csv", function (d, i) {
        var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
        return {val: parseFloat(d.Temp), ms: dat.getTime()};
    }, function (error, rows) {
        if (error) {
            console.log("error");
            return;
        }

        var plt = initPlot(rows, function(){}, 1000*60*60, "temperature", 1, curLevel);

        var filenames = [ "weather/eng-hourly-02012012-02292012.csv",
                          "weather/eng-hourly-03012012-03312012.csv",
                          "weather/eng-hourly-04012012-04302012.csv",
                          "weather/eng-hourly-08012011-08312011.csv",
                          "weather/eng-hourly-09012011-09302011.csv",
                          "weather/eng-hourly-10012011-10312011.csv",
                          "weather/eng-hourly-11012011-11302011.csv",
                          "weather/eng-hourly-12012011-12312011.csv" ];
        for(var x = 0; x < filenames.length; x++){
            addWeatherData(filenames[x], plt);
        }

        function addWeatherData(filename, plt) {
                d3.csv(filename, function (d, i) {
                    var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
                    return {val: parseFloat(d.Temp), ms: dat.getTime()};
                }, function (error, rows) {
                    if (error) {
                        console.log("error");
                        return;
                    }

                    plt.addDataToBinData(rows, 0);
                });
        }
    });
}

// OFFLINE DATA }}}

// set up the slider.
rescaleTo(Math.pow(2, mySlider.handlePosition() / boxSize));


// {{{ EDITABLES
d3.select("#edit").on("click", toggleEditables);

function toggleEditables() {
    var active = document.getElementById("edit").checked;
    if (active) {
        d3.select("#edit_elements").attr("display", "block");
    } else {
        d3.select("#edit_elements").attr("display", "none");
    }
    redraw();
}
toggleEditables();
// EDITABLES }}}

/* vim: set foldmethod=marker: */
