"use strict";
// {{{ Loading Spinner Icon
var myLoader = loader().width(25).height(25);
d3.select("#loader_container").call(myLoader);
/// Loading Spinner Icon }}}

//{{{ ZOOMING AND CHANGING

var supportsOrientationChange = "onorientationchange" in window;
var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
var windowListener = function () {
    if (navigator.userAgent.match(/android/i)) {
        setTimeout(redraw, 500); //Only wait for Android
    } else {
        redraw();
    }
};
window.addEventListener(orientationEvent, windowListener, false);

document.getElementById("render-lines").addEventListener("change", changeLines, false);
document.getElementById("render-method").addEventListener("change", changeLines, false);

// ZOOMING AND CHANGING }}}

//{{{ VARIABLES

var plots = []; //an array of all plots
var msPS = 5; // frequency of data samples

// TODO: sync this with the one in bridgeChart.js
var margin = {top: 20, right: 10, bottom: 25, left: 30 + 90};
var plotHeightDefault = 150;

var zoomSVG = d3.select("#zoomSVG"); // holds zoomRect
var zoomRect = d3.select("#zoomRect"); // overlay which takes scroll/zoom input
var zoomRectGreyOut = d3.select("#zoomRectGreyOut"); // overlay which disables zooming when edit buttons are shown.

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
var boxSize = 34;
var sliderCallBack = function (pos, i, cameFromZoom) {
    if (curLevel !== i) {
        for (var index = 0; index < plots.length; index++) {
            plots[index].whichLevelToRender(i).update();
        }
        curLevel = i;
    }
    if (curPos !== pos) {
        var scaleFactor = Math.pow(2, pos/boxSize);
        if (!cameFromZoom) {
            rescaleTo(scaleFactor);
        }
        curPos = pos;
    }
};
var mySlider = slider()
    .height(200)
    .width(boxSize*2.5)
    .boxSize(boxSize)
    .changeCallBack(sliderCallBack)
    .numberOfLevels(33);
d3.select(sliderContainerName).call(mySlider);
// SLIDER }}}

//{{{ HELPER FUNCTIONS

var copyScaleWithoutGarbage = function (a,b){
    // copy the properties of b into a
    a.domain()[0] = b.domain()[0];
    a.domain()[1] = b.domain()[1];
    a.range()[0] = b.range()[0];
    a.range()[1] = b.range()[1];
};

function swapItems(array, a, b) {
    array[a] = array.splice(b, 1, array[a])[0];
    return array;
}

function insertItem(array, a, index) {
    array.splice(index, 0, a);
    return array;
}

function insertItemBeforeItem(array, a, beforeThisItem) {
    array.splice(array.indexOf(beforeThisItem), 0, a);
    return array;
}

var getTotalChartHeight = function (plotsArray) {
    var total = 0;
    _.each(plotsArray, function (d, i) {
        total = total + d.height();
    });
    return total;
};

function insertBeforeDOMPlot(newElementIndex, referenceElementIndex) {
    var parent = document.getElementById("charts");
    var charts = parent.childNodes;
    parent.insertBefore(charts[newElementIndex], charts[referenceElementIndex]); // swap in DOM
}

function plots_filtered() {
    return _.filter(plots, function (d) {
        return d.displayThisChart();
    });
}

var redraw = function () {
    var plotSVGs = d3.select("#charts").selectAll("svg").data(plots_filtered(), function (d, i) { return d.uniqueID(); });

    // Weird hackery to reselect elements and call their specific plot
    // done this way because enter().selectAll().append().call(function(d)) doesn't give us anything useful.
    var plotsCaller = function(d) {
        var allPlots = d[0];

        for(var i = 0; i < allPlots.length; i++) {
            d3.select(allPlots[i]).call(plots_filtered()[i]);
        }
    };

    function swapWithPrevItem(i) {
        if (i-1 < 0 || i >= plots.length) {
            return;
        }

        swapItems(plots, i, i-1); // swap in plots

        insertBeforeDOMPlot(i, i-1); // swap in the DOM
    }

    function swapWithNextItem(i) {
        if (i < 0 || i+1 >= plots.length) {
            return;
        }

        swapItems(plots, i, i+1); // swap in plots

        insertBeforeDOMPlot(i+1, i); // swap in the DOM
    }

    // ENTER
    plotSVGs.enter().append("svg").attr("id", function(d, i) { return d.sensorType() + d.sensorNumber(); });

    // EXIT
    plotSVGs.exit().remove();

    // UPDATE
    plotSVGs.call(plotsCaller);

    // Get list of available-but-not-on-display sensors
    // TODO: put in temperature 1 and cloudcover 1 when they work. (Put them server-side?)
    var sensorsAvailable = ["temperature_1",
                            "cloudcover_1",
                            "girder_6",
                            "girder_18",
                            "girder_19",
                            "girder_20",
                            "girder_22",
                            "girder_40",
                            "girder_45"];
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

    sensorsAvailableObjects.sort(function (a, b) {
        var astring = a.sensorType() + "" + a.sensorNumber();
        var bstring = b.sensorType() + "" + b.sensorNumber();

        if (astring < bstring) {
            return -1;
        } else if (astring > bstring) {
            return 1;
        } else {
            return 0;
        }
    });

    var justName = function (d) {
        return d.sensorType() + "" + d.sensorNumber();
    }

    // Expand chart container when add buttons are present.
    var plotHeight = plots[0] ? plots[0].height() : plotHeightDefault + margin.top + margin.bottom;
    var showingEdits = document.getElementById("edit").checked;
    var offset = showingEdits ? toBeAdded.length*plotHeight : 0;

    // TODO: when add buttons show up and one scroll bar appears, both scroll bars appear.
    for (var index = 0, l = plots.length; index < l; index ++) {
        plots[index].containerWidth(document.getElementById("chartContainer").offsetWidth).update();
    }

    var offset_fix = 8;
    d3.select("#charts").attr("width", document.getElementById("chartContainer").offsetWidth);
    zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
            .transition().duration(duration)
           .attr("height", getTotalChartHeight(plots_filtered()) + offset);
    zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right - offset_fix*2)
            .attr("transform", "translate(" + margin.left + ", " + (margin.top + offset_fix) + ")")
            .attr("height", Math.max(0, getTotalChartHeight(plots_filtered())-offset_fix));
    zoomRectGreyOut.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right - offset_fix*2)
            .attr("transform", "translate(" + margin.left + ", " + (margin.top + offset_fix) + ")")
            .attr("height", Math.max(0, getTotalChartHeight(plots_filtered())-offset_fix))
            .style("opacity", 0.15)
            .style("fill", "#000");

    //{{{ DRAW EDIT ELEMENTS
    var xsize = 70;
    var xspace = 20;
    var xbuffer = 130;
    var width = document.getElementById("chartContainer").offsetWidth - margin.right;

    var disp = function(d) {
        return d.displayThisChart ? d.displayThisChart() : false
    }

    var editClick = function(d) {
        if (disp(d)) {
            removePlot(d);
        } else {
            addPlot(d.sensorType(), d.sensorNumber());
        }
    };

    var editImage = function(d) {
        if (disp(d)) {
            return "./img/remove.svg";
        } else {
            return "./img/add.svg";
        }
    };


    // Show add/remove buttons

    var add_dat = d3.select("#edit_elements")
        .selectAll("div")
        .data(plots_filtered().concat(sensorsAvailableObjects), function (d) {
            return "" + d.sensorNumber() + d.sensorType();
        });

    //ENTER
    var add_dat_enter = add_dat.enter().append("div")
        .style("position", "absolute");
    add_dat_enter.append("img")
        .style("position", "absolute")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .attr("src", editImage)
        .on("click", editClick);

    //UPDATE
    add_dat.select("img")
        .attr("src", editImage)
        .on("click", editClick);

    add_dat.select(".edit_on_top").transition().duration(duration)
        .style("display", "block")
        .style("opacity", function (d) { if (_.contains(plots_filtered(), d)) { return 0; } else { return 1; }})
        .style("display", function (d) { if(_.contains(plots_filtered(), d)) { return "none"; } else { return "block"; }});
    add_dat.transition().duration(duration)
        .style("left", (width - xsize) + "px")
        .style("top", function(d,i) { return (i*(plotHeight) + ((plotHeight - xsize) / 2)) + "px"; });

    //EXIT
    add_dat.exit().remove();

    // Show swap buttons
    add_dat = d3.select("#edit_swap").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/updown.svg")
        .attr("width", 90)
        .attr("height", 90)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { swapWithPrevItem(i+1); redraw(); });
    add_dat
        .style("left", xbuffer + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 20) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // Show text labels
    d3.select("#edit_text").style("top", getTotalChartHeight(plots_filtered()) + "px");
    add_dat = d3.select("#edit_text").selectAll("p").data(sensorsAvailableObjects);
    add_dat.enter().append("p")
        .attr("class", "sensor_title_add")
        .attr("cursor", "default")
        .text(function (d) { return d.sensorType().capitalize() + " " + d.sensorNumber(); })
        .style("height", plotHeight + "px")
        .style("opacity", 1);
    add_dat
        .text(function (d) { return d.sensorType().capitalize() + " " + d.sensorNumber(); });
    add_dat.transition().duration(duration)
        .attr("x", width - 15)
        .attr("y", function(d,i) { return (getTotalChartHeight(plots_filtered()) + i*(plotHeight) + (plotHeight/4)); })
        .style("height", plotHeight + "px")
        .style("opacity", 1);
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();

    // Show combine with multiplication buttons
    add_dat = d3.select("#edit_mult").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/mult.svg")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { addMultiChart(i, i+1, true); redraw(); });
    add_dat
        .style("left", (xbuffer + 90) + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 30) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // Show combine with division buttons
    add_dat = d3.select("#edit_minus").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/minus.svg")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { addMultiChart(i, i+1, false); redraw(); });
    add_dat
        .style("left", (xbuffer + 180) + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 30) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // DRAW EDIT ELEMENTS }}}

    //update the zoom for the new plot size
    updateZoom();
};

function removePlot(p) {
    //printArrayOfPlots(plots_filtered());
    // Show each of this plot's parents
    var plt = _.find(plots, function (d) {
        return p.sensorNumber() === d.sensorNumber() && p.sensorType() === d.sensorType();
    });

    for (var i = 0, l = plt.multiChart_parentBinnedCharts().length; i < l; i++) {
        var d = plt.multiChart_parentBinnedCharts()[i];
        //d.displayThisChart(true); // TODO: instead of this, just delete it and recreate it.
        var ty = d.sensorType();
        var nu = d.sensorNumber();
        plots.splice(plots.indexOf(d), 1);
        addPlot(d.sensorType(), d.sensorNumber());
        //redraw();
        //console.log(plots_filtered().indexOf(plt), plots_filtered().length - 1);
        //insertBeforeDOMPlot(plots_filtered().indexOf(plt), plots_filtered().length - 1); // modify the DOM
    }

    // TODO: move the new plots in front of the old plot in the DOM
    //insertBeforeDOMPlot(plots_filtered().indexOf(plt), plots_filtered().length - 1); // modify the DOM

    // Find the chart in the plots array
    var match = _.find(plots, function (d) {
        return d.sensorNumber() === plt.sensorNumber() &&
            d.sensorType() === plt.sensorType();
    });
    var index = plots.indexOf(match);
    if(index === -1) { console.log("PLOT NOT IN PLOTS"); }

    // Remove the chart from the plots array
    plots.splice(index, 1);

    redraw();
}

function printArrayOfPlots(array) {
    console.log(_.map(array, function (d) {
        return d.sensorType() + "-" + d.sensorNumber();
    }));
}

function addMultiChart (parentAIndex, parentBIndex, multTrueMinusFalse) {
    var parentA = plots[parentAIndex];
    var parentB = plots[parentBIndex];
    var interval = 5;
    var divider = multTrueMinusFalse ? 'x' : '-';
    var plt = initPlot(true, {}, function(){}, interval, parentA.sensorType(), parentA.sensorNumber() + divider + parentB.sensorNumber(), curLevel, true);
    plt.makeIntoMultiChart([parentA, parentB], multTrueMinusFalse);
    parentA.addMultiChartChild(plt);
    parentB.addMultiChartChild(plt);

    // Insert the new plot where it should be in plots and in the DOM
    insertBeforeDOMPlot(plots_filtered().indexOf(plt), parentAIndex); // modify the DOM
    putLastItemBeforeIndex(plots, parentAIndex); // modify plots TODO: is this even necessary ??

    // Set both parents as invisible.
    parentA.displayThisChart(false);
    parentB.displayThisChart(false);

    redraw();
}

function putLastItemBeforeIndex(array, a) {
    array.splice(a, 0, array.pop());
    return array;
}

function addPlot (sensorType, sensorNumber) {
    var data = sensorType === "girder" ? {} : {}; // TODO: put special case here for temperature data.
    var interval = 5; // TODO: put special case here for temperature data.
    if (sensorType === "girder"){
        initPlot(true, data, sendRequestToServer, interval, sensorType, sensorNumber, curLevel);
    } else if (sensorType === "cloudcover") {
        plots.push(cloudPlot);
        updateUI();
    } else if (sensorType === "temperature") {
        plots.push(tempPlot);
        updateUI();
    }
}

function setAllPlotLevels() {
    plots.forEach(function (plt) {
        plt.whichLevelToRender(curLevel).update();
    });
}

function setLoadingIcon(on) {
    d3.select("#loader_container").style("opacity", on ? 1 : 0);
    d3.selectAll(".loadingBox").style("opacity", on ? 1 : 0);
    myLoader.isShowing(on);
}

function updateUI() {
    redraw();
    d3.select("#charts").attr("height", getTotalChartHeight(plots_filtered())).attr("width", document.getElementById("chartContainer").offsetWidth);
    zoomRect.attr("fill", "rgba(0,0,0,0)")
            .call(zoom);
}

function initPlot(addToDisplay, data, sendReq, oneSample, sensorType, sensorNumber, level, isMulti) {
    var plot;
    plot = binnedLineChart(data, sendReq, sensorType, sensorNumber, oneSample, level, sensorType === "cloudcover", isMulti);
    plot.xScale(xScale.copy());

    plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(plotHeightDefault).showTimeContext(true).milliSecondsPerSample(msPS);//.update();

    if (addToDisplay) {
        plots.push(plot);
    }

    updateUI();

    // Redefine this function now that we have data for it to work from
    updateZoom = function () {
        zoomAll();
        xScale = plot.xScale();
        yScale = plot.yScale();
        zoom.x(xScale);
        xScale.range([0, document.getElementById("chartContainer").offsetWidth]);
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
    var index = 0;

    if (mySlider.pastExtents(newPos)) {
        var tmpScale = oldXScale.copy();

        for(index = 0; index < plots.length; index++){
            plots[index].xScale(tmpScale.copy()).update();
        }
        xScale = tmpScale.copy();

        zoom.x(xScale);
    } else {
        mySlider.scrollPosition(newPos).update(true);

        // set plot scales
        for(index = 0; index < plots.length; index++){
            plots[index].xScale(xScale).update();
        }
    }

    copyScaleWithoutGarbage(oldXScale, xScale);
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

socket.on('news', function (data) {
    // only do this once, so that plots don't get overlapped whenever the server restarts.
    if (!firstTime) {
        return;
    }
    firstTime = false;

    socket.emit('ack', "Message received!");

    initPlot(true, {}, sendRequestToServer, 5, "girder", 18, curLevel);
});

var sizeOfQueue = function() {
    var size = 0, key;
    for (key in serverQueue) {
        if (serverQueue.hasOwnProperty(key)) size++;
    }
    return size;
};

var removeFromQueue = function (key) {
    delete serverQueue[key];
};

// things which we are waiting for the server to send to us
var serverQueue = {};

function addToServerQueue(ob) {
    serverQueue[ob.id] = ob.req;
}

var uniqueRequestID = 0;
var listOfRequestsMade = [];

function sendRequestToServer(req) {
    if(_.findWhere(listOfRequestsMade, {sensorNumber: req.sensorNumber, sensorType: req.sensorType, ms_start: req.ms_start, ms_end: req.ms_end, bin_level: req.bin_level})) {
        // never request the same thing twice
        return false;
    }

    // turn on loading icon
    setLoadingIcon(true);

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

    // deactivate loading icon
    if (sizeOfQueue() === 0) {
        setTimeout(disableLoadingIfQueueIsEmpty, 100);
    }

    for (var i=0;i<plots.length;i++) {
        plots[i].incomingRequestedData(received);
    }
});

var disableLoadingIfQueueIsEmpty = function () {
    if (sizeOfQueue() === 0) {
        setLoadingIcon(false);
    }
};

// SERVER COMMUNICATIONS }}}

//{{{ OFFLINE DATA

//offlinedata();
setTimeout(function() { offlinedata(); }, 200);

var tempPlot;
var cloudPlot;


function offlinedata() {
    tempPlot = initPlot(false, [], function(){}, 1000*60*60, "temperature", 1, curLevel);
    cloudPlot = initPlot(false, [], function(){}, 1000*60*60, "cloudcover", 1, curLevel);

    var filenames = [ "weather/eng-hourly-01012012-01312012.csv",
                      "weather/eng-hourly-02012012-02292012.csv",
                      "weather/eng-hourly-03012012-03312012.csv",
                      "weather/eng-hourly-04012012-04302012.csv",
                      "weather/eng-hourly-05012012-05312012.csv",
                      "weather/eng-hourly-06012012-06302012.csv",
                      "weather/eng-hourly-07012012-07312012.csv",
                      "weather/eng-hourly-08012012-08312012.csv",
                      "weather/eng-hourly-09012012-09302012.csv",
                      "weather/eng-hourly-10012012-10312012.csv",
                      "weather/eng-hourly-11012012-11302012.csv",
                      "weather/eng-hourly-12012012-12312012.csv",
                      "weather/eng-hourly-01012013-01312013.csv",
                      "weather/eng-hourly-08012011-08312011.csv",
                      "weather/eng-hourly-09012011-09302011.csv",
                      "weather/eng-hourly-10012011-10312011.csv",
                      "weather/eng-hourly-11012011-11302011.csv",
                      "weather/eng-hourly-12012011-12312011.csv" ];
    for(var x = 0; x < filenames.length; x++){
        addTemperatureData(filenames[x], tempPlot);
        addCloudCoverData(filenames[x], cloudPlot);
    }

    function addTemperatureData (filename, plt) {
        d3.csv(filename, function (d, i) {
            var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
            return {val: parseFloat(d.Temp), ms: dat.getTime()};
        }, function (error, rows) {
            if (error) {
                console.log("error in " + filename);
                return;
            }

            plt.addDataToBinData(rows, 0);
        });
    }

    function addCloudCoverData (filename, plt) {
        d3.csv(filename, function (d, i) {
            var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
            var val = (d.Weather === "Clear" || d.Weather === "Mainly Clear") ? 1 : 0;
            return {val: val, ms: dat.getTime()};
        }, function (error, rows) {
            if (error) {
                console.log("error");
                return;
            }

            plt.addDataToBinData(rows, 0);
        });
    }
}

// OFFLINE DATA }}}

// set up the slider.
rescaleTo(Math.pow(2, mySlider.handlePosition() / boxSize));

// {{{ EDITABLES
d3.select("#edit").on("click", toggleEditables);

function toggleEditables() {
    var active = document.getElementById("edit").checked;
    if (active) {
        d3.select("#edit_elements").style("display", "block");
        d3.select("#edit_text").style("display", "block");
        d3.select("#edit_swap").style("display", "block");
        d3.select("#edit_mult").style("display", "block");
        d3.select("#edit_minus").style("display", "block");
        d3.select("#zoomRectGreyOut").style("display", "block");
    } else {
        d3.select("#edit_elements").style("display", "none");
        d3.select("#edit_text").style("display", "none");
        d3.select("#edit_swap").style("display", "none");
        d3.select("#edit_mult").style("display", "none");
        d3.select("#edit_minus").style("display", "none");
        d3.select("#zoomRectGreyOut").style("display", "none");
    }
    redraw();
}
toggleEditables();
// EDITABLES }}}

/* vim: set foldmethod=marker: */
