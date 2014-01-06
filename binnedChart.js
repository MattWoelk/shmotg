"use strict";
// {{{ HELPER FUNCTIONS

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var justItself = function(d){
    return d;
};

var justValue = function(d){
    return d.value;
};

var justval = function (d) {
    return d.val;
};
var notNaNVal = function (d) {
    return !isNaN(d.val);
};
var notNaNValFirst = function (d) {
    return notNaNVal(d[0]);
};
var isNaNVal = function (d) {
    return isNaN(d.val);
};

function addBValuesToA(a,b) {
    var i, len = b.length;
    for (i = 0; i < len; i += 1) {
        a.push(b[i]);
    }
}

var msDifference = function (a, b) {
    return a.ms - b.ms;
};

var generateLoadingBoxArray = function (whichLevelToRender, renderRange, renderThis, binData) {
    var fil = binData.getDateRangeWithMissingValues(
        'average',
        whichLevelToRender,
        renderRange,
        false,
        renderThis);

        var toBeAddedMissing = [];
        var countMissing = 0;
        var lineMissingFilter = [];

        if (fil.length <= 1) {
            // No data. Fill everything. (Everything is missing.)
            lineMissingFilter.push({val: NaN, ms: renderRange[0]});
            lineMissingFilter.push({val: NaN, ms: renderRange[1]});
        } else {
            // TODO: move this function to a wider scope.
            lineMissingFilter = _.map(fil, function (d) {
                var tmp = {};
                tmp.val = d.val;
                tmp.ms = d.ms;
                if (isNaN(tmp.val)) {
                    var siz = binData.binSize(whichLevelToRender);
                    var range = binData.getChildBins(tmp.ms, whichLevelToRender);
                    toBeAddedMissing.push({val: tmp.val, ms: tmp.ms+siz-1});
                } else {
                    // tmp.val = NaN; // display it all
                }
                countMissing++;
                return tmp;
            });
        }

        lineMissingFilter.sort(msDifference);
        lineMissingFilter = binData.combineAndSortArraysOfDateValObjects(lineMissingFilter, toBeAddedMissing);
        return lineMissingFilter;
};

var generateMissingArray = function (whichLevelToRender, renderRange, renderThis, binData) {
    var fil = binData.getDateRangeWithMissingValues(
            'average',
            whichLevelToRender,
            renderRange,
            false,
            renderThis);

    var toBeAdded = [];
    var count = 0;

    // TODO: move this function o a wider scope.
    var lineFilter = _.map(fil, function (d) {
        var tmp = {};
        tmp.val = d.val;
        tmp.ms = d.ms;
        if (isNaN(tmp.val)) {
            var siz = binData.binSize(whichLevelToRender);
            var range = binData.getChildBins(tmp.ms, whichLevelToRender);
            tmp.val = averageOfRange(binData.getDateRangeWithMissingValues(
                'average',
                whichLevelToRender - 1,
                range,
                false,
                renderThis));
            if (fil[count-1] && !isNaN(fil[count-1].val)) {
                toBeAdded.push({val: fil[count-1].val, ms: fil[count-1].ms});
            }
            if (fil[count+1] && !isNaN(fil[count+1].val)) {
                toBeAdded.push({val: fil[count+1].val, ms: fil[count+1].ms});
            } else {
                toBeAdded.push({val: tmp.val, ms: tmp.ms+siz-1});
            }
        } else {
            // tmp.val = NaN; // display it all
        }
        count++;
        return tmp;
    });


    lineFilter.sort(msDifference);
    lineFilter = binData.combineAndSortArraysOfDateValObjects(lineFilter, toBeAdded);

    // TODO: if fil is empty (or all are NaN; whatever happens when we zoom out until nothing is visible), then have one bin which fills the entire screen.

    var toBeAddedMissing = [];
    var countMissing = 0;
    var lineMissingFilter = [];

    if (fil.length <= 1) {
        // we have no data, therefore:
        // make a big grey box that fills the entire screen
        lineMissingFilter.push({val: NaN, ms: renderRange[0]});
        lineMissingFilter.push({val: NaN, ms: renderRange[1]});
    } else {
        // TODO: move this function o a wider scope.
        lineMissingFilter = _.map(fil, function (d) {
            var tmp = {};
            tmp.val = d.val;
            tmp.ms = d.ms;
            if (isNaN(tmp.val)) {
                var siz = binData.binSize(whichLevelToRender);
                var range = binData.getChildBins(tmp.ms, whichLevelToRender);
                toBeAddedMissing.push({val: tmp.val, ms: tmp.ms+siz-1});
            } else {
                // tmp.val = NaN; // display it all
            }
            countMissing++;
            return tmp;
        });
    }

    lineMissingFilter.sort(msDifference);
    lineMissingFilter = binData.combineAndSortArraysOfDateValObjects(lineMissingFilter, toBeAddedMissing);

    return [lineFilter, lineMissingFilter];
};

var averageOfRange = function (data) {
    var result = 0;
    var count = 0;
    for (var i = 0; i < data.length; i++) {
        if (!isNaN(data[i].val)) {
            result += data[i].val;
            count++;
        }
    }
    if (count === 0) {
        return NaN;
    } else {
        return result / count;
    }
};

var isWithinRange = function (r1, r2) {
    // see if r1 is within r2
    return r1[0] >= r2[0] && r1[1] <= r2[1];
};

function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
}

// This is the transform which is done on the data after it has been rendered.
function transformScale(scal, oldScal, mar) {
    var pixelsPerSample = getScaleValue(scal);
    var xS = getScaleValue(scal);

    var tx = mar.left + (xS * (oldScal.domain()[0] - scal.domain()[0])); // translate x value
    var ty = mar.top; // translate y value

    // See renderFunction for the inverse:
    var sx = xS / getScaleValue(oldScal);
    var sy = 1; // scale y value

    return "translate(" + tx + "," + ty + ")scale(" + sx + "," + sy + ")";
}

function generateKey(d) {
    return d.key + d.which + d.interpolate;
}

// selection are the objects,
// fill and stroke are functions,
// scal is the scale
function drawElements(keyObject, container, id, fill, stroke, strokeDash, scal, scalOld, d0s, bin, mar, renScale, strokeW, name, fullRender) {
    var sel = container.selectAll("."+name+id)
            .data(keyObject, generateKey);

    //update
    sel.attr("opacity", function (d) { return bin.getOpacity(d.key); })
       .attr("d", function (d, i) { return d0s[d.key] ? d0s[d.key] : "M -1000 -1000 L -1000 -1000"; }) // if the d0 is empty, replace it with a very distant dot (to prevent errors)
       .attr("transform", transformScale(scal, renScale, mar));


    //enter
    sel.enter()/*.append("g").attr("class", name)*/.append("path")
            .attr("class", function(d) { return name+id+" "+d.key; })
            .attr("d", function (d, i) { return d0s[d.key]; });

    sel.attr("transform", transformScale(scal, renScale, mar))
        .attr("opacity", function (d) { return bin.getOpacity(d.key); });

    //exit
    sel = sel.exit();

    sel.attr("transform", transformScale(scal, scalOld, mar))
        .attr("opacity", 0)
        .remove();
}

// TODO: Phase 2 - make this external, as in, set from outside this chart object.
//       - could pass in a function or a static value.
function maxBinRenderSize () {
    return document.getElementById("renderdepth").value;
}

// The following function returns something which looks like this:
// [
//   {key: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
//   {key: 'average', which: 2, interpolate: blabla}, <-- the current level is 'which'
//   {key: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
// ]
var makeDataObjectForKeyFanciness = function (bin, whichLines, whichLevel, interp) {
    var resultArray = [];

    var j = 0;
    var keys = bin.getKeys();
    for (var keyValue in whichLines){ // for each of 'average', 'max', 'min'
        var key = whichLines[keyValue];

        for (j = 0; j < shmotg.MAX_NUMBER_OF_BIN_LEVELS; j++) {
            if (whichLevel === j){
                resultArray.push({
                    key: key,
                    which: j,
                    interpolate: interp
                });
            }
        }
    }

    return resultArray;
};

// See makeDataObjectForKeyFanciness for explanation of output
var makeQuartileObjectForKeyFanciness = function (whichLines, whichLevel, interp) {
    var resultArray = [];
    var key = 'quartiles';

    var j = 0;
    if (whichLines.indexOf('quartiles') > -1) {
        for (j = 0; j < shmotg.MAX_NUMBER_OF_BIN_LEVELS; j++) {
            if (whichLevel === j){
                resultArray.push({
                        key: key,
                        which: j,
                        interpolate: interp
                });
            }
        }
    }

    if (whichLines.indexOf('missingBox') > -1) {
        resultArray.push({
                key: 'missingBox',
                which: 0,
                interpolate: interp});
    }

    return resultArray;
};

function goToLevel(scal, msPS) {
    // Return which level should be displayed based on
    // the current scale, and the sample rate
    // - msPS is milliSecondsPerSample

    // pixels/bin:
    var pixelsPerBin = maxBinRenderSize();
    var pixelsPerMilliSecond = getScaleValue(scal);
    var pixelsPerSample = pixelsPerMilliSecond * msPS;

    // sam   pix   sam
    // --- = --- * ---
    // bin   bin   pix
    var samplesPerBin = pixelsPerBin / pixelsPerSample;

    //now convert to level and floor
    var toLevel = Math.log(samplesPerBin) / Math.log(2);
    toLevel = Math.floor(toLevel);
    toLevel = d3.max([0, toLevel]);
    toLevel = d3.min([shmotg.MAX_NUMBER_OF_BIN_LEVELS - 1, toLevel]);

    // TODO: this may not be the correct place for this: update the span with id "current_level"
    d3.select("#current_level").text(toLevel);

    return toLevel;
}

var times = msToCentury.times;
var timeContextFormatSpecifier = [
    { fun: function (a,b) { return (b - a) < 2 * times.y;  }, formIf: "%Y",  formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.mo; }, formIf: " %b", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.d;  }, formIf: " %a %d", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.h;  }, formIf: " %H", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.m;  }, formIf: ":%M", formIfNot: "h"},
    { fun: function (a,b) { return (b - a) < 2 * times.s;  }, formIf: ":%Ss", formIfNot: ""},
    // milliseconds would be unnecessary for our purposes
];

// Convert milliseconds to a Date object
function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
}

// return a string label to be put in the user time context area
// Depends on the times variable from msToCentury.js
var getTimeContextString = function (scal, show) {
    if (!show) return [];

    var result = "";

    var d0 = scal.domain()[0];
    var d1 = scal.domain()[1];
    var doneNow = false;

    // TODO: this makes too many objects and looks like it would be slow.
    var parseDate = d3.time.format(_.reduce(timeContextFormatSpecifier, function (str, dat) {
        if ( doneNow ) return str;
        if (dat.fun(d0, d1)) {
            return str + dat.formIf;
        } else {
            doneNow = true;
            return str + dat.formIfNot;
        }
    }, ""));

    result = parseDate(dt(d0));
    return result;
};

// HELPER FUNCTIONS }}}

var binnedLineChart = function (data, dataRequester, sensorT, sensorN, oneSample, level, cc, isMulti) {

    //{{{ VARIABLES

    var dataReq = dataRequester; // TODO: multiChart
    var multiChart_parentBinnedCharts = []; // contains other binnedLineChart objects. TODO: Combine their data with this one's and display the result.
    var multiChart_childrenCharts = []; // TODO: let these know whenever we get new data
    var displayThisChart = true; // TODO: get/set this, and do less work when not being displayed

    var strokeWidth = 1;
    var sensorType = sensorT;
    var sensorNumber = sensorN;

    // the frequency of the data samples
    var milliSecondsPerSample = 1;

    // TODO: sync this with the one in bridgecharts.js
    //       - can't do, because we're changing top depending
    //         on if we're showing time context
    //       - unless we make it a new offset variable instead of reusing margin
    var margin = {top: 10, right: 27, bottom: 25, left: 30 + 90};

    // the height of the chart by itself (not including axes or time context)
    var height = 150 - margin.top - margin.bottom;

    // the width of the chart, including margins
    var containerWidth = document.getElementById("chartContainer").offsetWidth;
    var width = containerWidth - margin.left - margin.right;

    var whichLevelToRender = level ? level : 0;
    var whichLinesToRender = ['average', 'maxes', 'mins'];
    var interpolationMethod = ['linear'];

    var showTimeContext = true;
    var isMultiChart = isMulti;

    var easingMethod = 'cubic-in-out';

    var defclip;
    var xAxisContainer;
    var xAxisMinorContainer;
    var xAxis;
    var xAxisMinor;
    var yAxisContainer;
    var yAxis;
    var xScale;
    var xScaleRange;
    var yScale;
    var yScaleRange;
    var previousXScale = d3.scale.linear(); // used for rendering transitions
    var previousLevelToRender; // used for rendering transitions;
    var timeContextContainer;
    var yAxisLockContainer;
    var yAxisLock;

    var chart; // the svg element (?)
    var pathArea;
    var pathPath;

    var slctn; // Save the selection so that my.update() works.

    var once = true; // some things only need to happen once.

    // whether we used the buttons to zoom
    var reRenderTheNextTime = true;
    var waitingForServer = false;

    // Where all data is stored, but NOT rendered d0's
    var binData = binnedData();
    if (oneSample) {
        binData.oneSample(oneSample);
    }

    var cloudcover = cc; // when true, only render average, and render it as boxes instead of lines.
    var renderThis = [];
    var renderRange = [];
    var showing_range = [];
    var ninetyPercentRange = [];
    var didWeRenderAnything = false;

    // Where all the rendered d0s are stored.
    var renderedD0s = {
        rawData         : "", // d0 for the current level
        rawDataRanges   : [], // the rendered range for the current level
        average         : "",
        averageRanges   : [],
        maxes           : "",
        maxesRanges     : [],
        mins            : "",
        minsRanges      : [],
        q1              : "",
        q1Ranges        : [],
        q2              : "",
        q2Ranges        : [],
        q3              : "",
        q3Ranges        : [],
        quartiles       : "",
        quartilesRanges : [],
        missing         : "",
        missingRanges   : [],
        missingBox      : "",
        missingBoxRanges: [],
        loadingBox      : "",
        loadingBoxRanges: [],
    };

    // VARIABLES }}}

    //{{{ HELPER METHODS

    function getOpacity(d) {
        return binData.getOpacity(d.key);
    }

    function transformElements(keyObject, container, id, fill, stroke, strokeDash, scal, scalOld, d0s, bin, mar, renScale, strokeW, name, fullRender) {
        var sel = container.selectAll("."+name+id)
            .data(keyObject, generateKey);

        sel.attr("opacity", getOpacity)
           .attr("transform", transformScale(scal, renScale, mar));
    }

    var doAllTheRendering = function () {
        //{{{ CONTAINER AND CLIPPING
        if (!yAxisLock) {
            if (!yAxis){
                yAxis = d3.svg.axis()
                .ticks(5)
                .tickSubdivide(true)
                .tickSize(width, 0, 0) // major, minor, end
                .orient("left");
            }
            yAxis.scale(yScale).tickSize(width, 0, 0);
        }

        chart = d3.select(this); //Since we're using a .call(), "this" is the svg element.

        if (reRenderTheNextTime){
            //Set it's container's dimensions
            slctn.attr("width", width);

            //Set the chart's dimensions
            chart.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        }

        if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip" + sensorType + sensorNumber).append("rect"); }
        if (reRenderTheNextTime) {
            defclip.attr("width", width)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
            .attr("height", height);
        }
        // CONTAINER AND CLIPPING }}}

        //{{{ AREAS

        //Apply the clipPath
        pathArea = pathArea ? pathArea : chart.append("g").attr("id", "paths"+sensorType+sensorNumber+"posArea");
        if (reRenderTheNextTime){
            pathArea.attr("clip-path", "url(#clip" + sensorType+sensorNumber + ")")
            .attr("class", "posArea")
            .attr("height", height);
        }

        //make and render the area
        var quartileObjectForKeyFanciness = makeQuartileObjectForKeyFanciness(renderThis, whichLevelToRender, interpolationMethod, true);

        if (!(didWeRenderAnything || reRenderTheNextTime)){
            transformElements(quartileObjectForKeyFanciness,
                              pathArea,
                              sensorType+sensorNumber,
                              // TODO: eliminate these three function objects
                              function (d) { return binData.getColor(d.key); },
                              function (d) { return "rgba(0,0,0,0)"; },
                              function (d) { return binData.getDash(d.key); },
                              xScale,
                              previousXScale,
                              renderedD0s,
                              binData,
                              margin,
                              renderScale,
                              strokeWidth,
                              "posArea",
                              didWeRenderAnything || reRenderTheNextTime);
        } else {
            drawElements(quartileObjectForKeyFanciness,
                         pathArea,
                         sensorType+sensorNumber,
                         function (d) { return binData.getColor(d.key); },
                         function (d) { return "rgba(0,0,0,0)"; },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         previousXScale,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posArea",
                         didWeRenderAnything || reRenderTheNextTime);
        }

        // AREAS }}}

        //{{{ LINES

        //Apply the clipPath
        pathPath = pathPath ? pathPath : chart.append("g").attr("id", "paths"+sensorType+sensorNumber+"posPath");
        pathPath.attr("clip-path", "url(#clip" + sensorType+sensorNumber + ")")
        .attr("class", "posPath")
        .attr("height", height);

        var shownLines = whichLevelToRender === 0 ? ["average"] : whichLinesToRender;

        //Make and render the Positive lines.
        var dataObjectForKeyFanciness = makeDataObjectForKeyFanciness(binData, shownLines, whichLevelToRender, interpolationMethod);
        if (renderThis.indexOf('loadingBox') > -1) {
            dataObjectForKeyFanciness.push({
                key: 'loadingBox',
                which: 0,
                interpolate: interpolationMethod
            });
        }

        if (!(didWeRenderAnything || reRenderTheNextTime)) {
            transformElements(dataObjectForKeyFanciness,
                         pathPath,
                         sensorType+sensorNumber,
                         // TODO: eliminate these three function objects
                         function (d) { console.log(cloudcover); return cloudcover ? "#F0F" : "rgba(0,0,0,0)"; },
                         function (d) { if(cloudcover) { return "rgba(0,0,0,0)"; } else if (whichLevelToRender === 0) { return "#4D4D4D"; } else { return binData.getColor(d.key); } },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         previousXScale,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posPath",
                         didWeRenderAnything || reRenderTheNextTime);
        } else {
            drawElements(dataObjectForKeyFanciness,
                         pathPath,
                         sensorType+sensorNumber,
                         function (d) { console.log(cloudcover); return cloudcover ? "#F0F" : "rgba(0,0,0,0)"; },
                         function (d) { if(cloudcover) { return "rgba(0,0,0,0)"; } else if (whichLevelToRender === 0) { return "#4D4D4D"; } else { return binData.getColor(d.key); } },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         previousXScale,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posPath",
                         didWeRenderAnything || reRenderTheNextTime);
        }

        // LINES }}}

        //{{{ AXES
        // Draw Axes using msToCentury.js format and values
        if (!xAxis) {
            xAxis = d3.svg.axis()
            .tickFormat(msToCentury.TickFormat)
            .orient("bottom");
        }
        xAxis.scale(xScale)
            .tickValues(msToCentury.TickValues(xScale, width));

        if (!xAxisMinor) {
            xAxisMinor = d3.svg.axis()
            .tickFormat(null)
            .scale(xScale).orient("bottom");
        }
        xAxisMinor.scale(xScale).tickValues(msToCentury.SubTickValues(xScale, width));

        if (!xAxisContainer) {
            xAxisContainer = chart.append("g")
            .attr("class", "x axis");
        }
        if (reRenderTheNextTime) {
            xAxisContainer.attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        }

        if (!xAxisMinorContainer) {
            xAxisMinorContainer = chart.append("g")
            .attr("class", "x axis minor");
        }
        if (reRenderTheNextTime) {
            xAxisMinorContainer.attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        }

        xAxisContainer.call(xAxis);
        xAxisMinorContainer.call(xAxisMinor);

        if (!yAxisContainer) {
            yAxisContainer = chart.append("g")
            .attr("class", "y axis");
        }
        if (reRenderTheNextTime) {
            yAxisContainer.attr("transform", "translate(" + (width + margin.left) + ", " + margin.top + ")");
        }
        yAxisContainer.call(yAxis);
        // AXES }}}

        //{{{ TIME CONTEXT
        if (!timeContextContainer) { timeContextContainer = chart.append("g"); }

        // Draw Time Context
        var timeContextSelection = timeContextContainer.selectAll(".sensor_time_context")
        .data([getTimeContextString(xScale, showTimeContext)]);
        var titleContainer = timeContextContainer.selectAll(".sensor_title")
        .data([sensorType.capitalize() + " " + sensorNumber]);

        // enter
        timeContextSelection.enter().append("text")
        .attr("class", "sensor_time_context");
        titleContainer.enter().append("text")
        .attr("class", "sensor_title");

        // update
        timeContextSelection.text(justItself);
        if(reRenderTheNextTime){
            timeContextSelection
                .attr("x", margin.left -5)
                .attr("y", shmotg.TIME_CONTEXT_VERTICAL_EACH);
        }

        titleContainer.text(justItself);
        if(reRenderTheNextTime){
            titleContainer
                .attr("x", margin.left + (width))
                .attr("y", shmotg.TIME_CONTEXT_VERTICAL_EACH);
        }

        // exit
        timeContextSelection.exit().remove();
        titleContainer.exit().remove();
        // TIME CONTEXT }}}

    };

    var valThroughYScale = function(d) {
        return yScale(d.val);
    };
    var valFirstThroughYScale = function(d) {
        return yScale(d[0].val);
    };
    var valSecondThroughYScale = function(d) {
        return yScale(d[1].val);
    };

    // This is the function used to render the data at a specific size.
    var renderFunction = function (d) {
        // See transformScale for the inverse.

        // Store this for later use.
        copyScaleWithoutGarbage(renderScale, xScale);

        return (d.ms - renderScale.domain()[0]) * getScaleValue(renderScale);
    };
    var renderFunctionFirst = function (d) {
        return renderFunction(d[0]);
    };

    var convert_ms_to_percent = function(ms, scal) {
        var start = scal.range()[0];
        var end = scal.range()[1];
        var x = xScale(ms);
        return ((x-start)/(end-start)) * 100 + "%";
    };

    var createColorGradient = function(container, id, data) {
        var grad = false;
        return function (container, id, data) {
            var svg = d3.select("#"+container);
            if (!svg) { return id; }
            grad = grad ? grad : svg.append("linearGradient");
            var stops = grad.attr("id", id)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", xScale.range()[0]).attr("y1", 0)
                .attr("x2", xScale.range()[1]).attr("y2", 0)
                .selectAll("stop")
                    .data(data); // form: [{ms: 123, val: 123}, {...}, ...]
            stops.enter().append("stop");
            stops.attr("offset", function(d, i) { return convert_ms_to_percent(d.ms, xScale); })
                 .attr("stop-opacity", function(d) { return 1-parseFloat(d.val); })
                 .attr("stop-color", "black");
            stops.exit().remove();
            return id;
        };
    }();

    var copyScaleWithoutGarbage = function (a,b){
        // copy the properties of b into a
        a.domain()[0] = b.domain()[0];
        a.domain()[1] = b.domain()[1];
        a.range()[0] = b.range()[0];
        a.range()[1] = b.range()[1];
    };

    var applyScaleDomainWithoutGarbage = function (a,b){
        a.domain()[0] = b[0];
        a.domain()[1] = b[1];
    };

    var applyScaleRangeWithoutGarbage = function (a,b){
        a.range()[0] = b[0];
        a.range()[1] = b[1];
    };

    // This stores the scale at which the d0s were
    // originally rendered. It's our base-point for
    // the transitions which scrolling does.
    // TODO: make this what the scale SHOULD be
    //       for the specific level and maxBinRenderSize
    //       then we won't need to store state like this
    var renderScale = d3.scale.linear();

    // HELPER FUNCTIONS }}}

    //// INITIALIZATION //// (runs once)

    // POPULATE THE BINNED DATAS (binData)
    binData.addRawData(data);

    //// MY //// (runs whenever something changes)

    var my = function (selection) {

        //{{{ SELECTION AND SCALES

        slctn = selection; // Saving the selection so that my.update() works.

        width = containerWidth - margin.left - margin.right;

        if (!xScale) { xScale = d3.scale.linear().domain([0, 100]); }
        if (!xScaleRange) { xScaleRange = [0, 0]; }
        xScaleRange[1] = width;
        xScale.range(xScaleRange); // So that the furthest-right point is at the right edge of the plot

        if (!yScale){ yScale = d3.scale.linear(); }
        if (!yScaleRange) { yScaleRange = [0, 0]; }
        yScaleRange[0] = height;
        yScale.range(yScaleRange);

        // SELECTION AND SCALES }}}

        //{{{ GENERATE d0s. (generate the lines paths)

        // Choose which d0s need to be generated based on which keys are active.
        renderThis.length = 0; //wipe it
        addBValuesToA(renderThis, whichLinesToRender);
        //renderThis = renderThis.concat(whichLinesToRender);
        if (whichLinesToRender.indexOf("quartiles") !== -1) {
            // If we're going to render the quartiles, we need to render q1 and q3.
            if (whichLinesToRender.indexOf("q3") === -1) {
                renderThis.push('q3');
            }
            if (whichLinesToRender.indexOf("q1") === -1) {
                renderThis.push('q1');
            }
        }
        if (whichLinesToRender.indexOf("missing") !== -1) {
            renderThis.unshift('missingBox');
        }
        if (whichLevelToRender === 0) {
            renderThis.length = 0;
            renderThis.push('average');
            // TODO: render it as black.
        }
        renderThis.push('loadingBox');

        var xdiff = xScale.domain()[1] - xScale.domain()[0];

        // figure out how much to render:
        renderRange[0] = xScale.domain()[0] - xdiff;
        renderRange[1] = xScale.domain()[1] + xdiff;

        didWeRenderAnything = false;
        showing_range.length = 0;

        // for each key
        // 1. find out whether we should render things
        for (var k in renderThis) {
            var key = renderThis[k];

            // These two variables are here to remove the slight amount
            // of un-rendered space which shows up on the sides just
            // before the new data is generated. It provides a buffer zone.
            var tenDiff = (renderedD0s[key + "Ranges"][1] -
                           renderedD0s[key + "Ranges"][0]) * 0.1;
            ninetyPercentRange[0] = renderedD0s[key + "Ranges"][0] + tenDiff;
            ninetyPercentRange[1] = renderedD0s[key + "Ranges"][1] - tenDiff;

            //if we are not within the range OR reRenderTheNextTime
            if (!isWithinRange(xScale.domain(), ninetyPercentRange) || reRenderTheNextTime) {
                //render the new stuff
                didWeRenderAnything = true;

                // calculate new y scale before we render any d0s
                // TODO: make this a function of binnedData.js, and abstract it in binnedChart.js so that it can be called from outside
                // - this will give the option of all charts having the same y axis
                if (showing_range.length === 0) {
                    var binSize = binData.binSize(whichLevelToRender);
                    showing_range = d3.extent(binData.getDateRange(renderThis, whichLevelToRender, [renderRange[0]-binSize, renderRange[1]+binSize], renderThis), justval);
                }

                if (!yAxisLock && !waitingForServer) {
                    if (isMultiChart) {
                        yScale.domain([0, 1]);
                    } else {
                        yScale.domain([ showing_range[0] ? showing_range[0] : yScale.domain()[0],
                                        showing_range[1] ? showing_range[1] : yScale.domain()[1] ]);
                    }
                }

                if (key === 'quartiles') {
                    // render AREA d0s//{{{
                    if (cloudcover) { continue; }

                    var q1Filter = binData.getDateRangeWithMissingValues(
                            'q1',
                            whichLevelToRender,
                            renderRange,
                            interpolationMethod === "step-after",
                            renderThis);
                    var q3Filter = binData.getDateRangeWithMissingValues(
                            'q3',
                            whichLevelToRender,
                            renderRange,
                            interpolationMethod === "step-after",
                            renderThis);

                    // TODO: make an object like [{q1: q1obj, q3: q3obj}, {q1: asdf, q3: asdf}, {...}, ...]
                    //       then feed that into .interpolate() instead of q1Filter

                    renderedD0s.quartiles = d3.svg.area()
                            .defined(notNaNValFirst)
                            .x(renderFunctionFirst)
                            .y0(valFirstThroughYScale)
                            .y1(valSecondThroughYScale)
                            .interpolate( interpolationMethod )(_.zip(q1Filter, q3Filter));

                    //}}}
                } else if (key === 'loadingBox') {
                    // render Missing averages//{{{
                    var lineMissingFilter = generateLoadingBoxArray(whichLevelToRender, renderRange, renderThis, binData);

                    renderedD0s.loadingBox = d3.svg.line()
                            .defined(isNaNVal)
                            .x(renderFunction)
                            .y(yScale.range()[0])
                            .interpolate( interpolationMethod )(lineMissingFilter);

                    //}}}
                } else if (key === 'missing' && !cloudcover) {
                    // render Missing averages//{{{

                    var lineAndMissingFilter = generateMissingArray(whichLevelToRender, renderRange, renderThis, binData);

                    renderedD0s.missingBox = d3.svg.area()
                            .defined(isNaNVal)
                            .x(renderFunction)
                            .y0(yScale.range()[0])
                            .y1(yScale.range()[1])
                            .interpolate( interpolationMethod )(lineAndMissingFilter[1]);

                    renderedD0s[key] = d3.svg.line()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineAndMissingFilter[0]);

                    //}}}
                } else {
                    // render LINES d0s//{{{
                    var lineFilter = [];
                    if (cloudcover && key !== "average") {
                        // do nothing
                    } else if (cloudcover && key === "average") {
                        // get ready the boxes for this

                        lineFilter = binData.getDateRange(
                            [ key ],
                            whichLevelToRender,
                            renderRange,
                            false,
                            renderThis);

                        renderedD0s.average = d3.svg.area()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y0(yScale(0))
                            .y1(yScale(1))
                            .interpolate( interpolationMethod )(lineFilter);

                        createColorGradient("cloudcover1", "cloudgradient", lineFilter);
                    } else {
                        lineFilter = binData.getDateRangeWithMissingValues(
                                key,
                                whichLevelToRender,
                                renderRange,
                                interpolationMethod === "step-after",
                                renderThis);

                        if (0) { // TODO: get rid of this old code
                            // TODO: render a big box, then make and send a linearGradient to be used to set the colors
                            renderedD0s[key] = d3.svg.area()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineFilter);
                        } else {
                            renderedD0s[key] = d3.svg.line()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineFilter);
                        }
                    }

                    // render LINES d0s}}}
                }

                // update the Ranges of rendered data
                renderedD0s[key + "Ranges"] = [renderRange[0], renderRange[1]];
            } // if we should render anything
        } // for

        // If we rendered anything, see if we need more data from the server
        // AKA see if we didn't have enough data to render the entire domain.
        if (didWeRenderAnything && !waitingForServer) {
            // If we don't have every piece of data in this range, ask for it all.
            if (!binData.haveDataInRange(renderRange, whichLevelToRender, renderThis)) {
                var req = {
                    sensorNumber: sensorNumber,
                    sensorType: sensorType,
                    ms_start: renderRange[0],
                    ms_end: renderRange[1],
                    bin_level: whichLevelToRender,
                };

                waitingForServer = true;
                if (dataReq !== undefined && !dataReq(req)) {
                    // if it's too soon, or it failed
                    waitingForServer = false;
                }
            }
        }


        // GENERATE ALL d0s. (generate the lines paths) }}}

        //// SELECTION.EACH ////

        selection.each(doAllTheRendering);

        reRenderTheNextTime = false;
        once = false;
    };

    //{{{ Getters and Setters

    my.milliSecondsPerSample = function (value) {
        if (!arguments.length) return milliSecondsPerSample;
        milliSecondsPerSample = value;
        return my;
    };

    my.containerWidth = function (value) {
        if (!arguments.length) return containerWidth;
        if (containerWidth !== value) my.reRenderTheNextTime(true);
        containerWidth = value;
        return my;
    };

    // set the size of the chart
    // or return the size that the chart + everything with it takes up
    my.height = function (value) {
        if (!arguments.length) return (height + margin.bottom + margin.top);
        if (height !== value) my.reRenderTheNextTime(true);
        height = value;
        return my;
    };

    my.whichLevelToRender = function (value) {
        if (!arguments.length) return whichLevelToRender;
        if (whichLevelToRender !== value) my.reRenderTheNextTime(true);
        whichLevelToRender = value - Math.floor(Math.log(oneSample/5) / Math.log(2)); // set the level proportionately to the sample size.
        whichLevelToRender = Math.max(whichLevelToRender, 0);
        return my;
    };

    my.whichLinesToRender  = function (value) {
        if (!arguments.length) return whichLinesToRender;
        if (_.difference(value, whichLinesToRender).length !== 0 ||
            _.difference(whichLinesToRender, value).length !== 0 ) { // contain the different things
                my.reRenderTheNextTime(true);
            }
            whichLinesToRender = value;
            return my;
    };

    my.strokeWidth = function (value) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = value;
        return my;
    };

    my.reRenderTheNextTime = function (value) {
        if (!arguments.length) return reRenderTheNextTime;
        reRenderTheNextTime = value;
        return my;
    };

    my.xScale = function (value) {
        if (!arguments.length) return xScale;

        // if value is the same as xScale, don't modify previousXScale
        if (!xScale) {
            previousXScale = d3.scale.linear(); // now it's initialized.
            previousLevelToRender = whichLevelToRender;
        } else if (xScale.domain()[0] != value.domain()[0] || xScale.domain()[1] != value.domain()[1]) {
            copyScaleWithoutGarbage(previousXScale, xScale);
            previousLevelToRender = whichLevelToRender;
        } // else, don't change previousXScale

        xScale = value;
        //my.reRenderTheNextTime(true);
        return my;
    };

    my.yScale = function (value) {
        if (!arguments.length) return yScale;
        yScale = value;
        //my.reRenderTheNextTime(true);
        return my;
    };

    my.update = function (reRender) {
        my.setSelectedLines();
        //console.log(slctn);
        my(slctn);
    };

    my.showTimeContext = function (show) {
        if (!arguments.length) return showTimeContext;

        showTimeContext = show;
        margin.top = margin.top + (showTimeContext ? shmotg.TIME_CONTEXT_VERTICAL_EACH : 0);

        return my;
    };

    // TODO: make this independent of the actual HTML. Do it through bridgecharts.js instead
    my.setSelectedLines = function () {
        var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), justValue);
        my.whichLinesToRender(a);

        //my.whichLevelToRender(goToLevel(xScale, milliSecondsPerSample));

        var b = document.querySelector("#render-method input:checked").value;
        if (b !== interpolationMethod) {
            my.reRenderTheNextTime(true);
        }
        interpolationMethod = b;
        return my;
    };

    my.uniqueID = function (value) {
        if (!arguments.length) return sensorType+sensorNumber;
        return my;
    };

    my.sensorType = function (value) {
        if (!arguments.length) return sensorType;
        sensorType = value;
        return my;
    };

    my.sensorNumber = function (value) {
        if (!arguments.length) return sensorNumber;
        sensorNumber = value;
        return my;
    };

    my.yAxisLock = function (value) {
        if (!arguments.length) return yAxisLock;
        if (yAxisLock === true && value === false) {
            // redraw everything
            my.reRenderTheNextTime(true);
            yAxisLock = value;
            my.update();
        }
        yAxisLock = value;
        return my;
    };

    my.addMultiChartChild = function (child) {
        multiChart_childrenCharts.push(child);
    };

    my.makeIntoMultiChart = function (parents, multTrueMinusFalse) {
        binData = multiData(multTrueMinusFalse);
        for(var index = 0; index < parents.length; index++){
            my.addMultiChartParent(parents[index]);
        }
        my.reRenderTheNextTime(true).update();
    };

    my.addMultiChartParent = function (parent) {
        // MUST run my.makeIntoMultiChart ONCE IN TOTAL before this will work.
        multiChart_parentBinnedCharts.push(parent);
        binData.addParentData(parent.bd());
    };

    my.multiChart_parentBinnedCharts = function (value) {
        if (!arguments.length) return multiChart_parentBinnedCharts;
        multiChart_parentBinnedCharts = value;
        return my;
    };

    my.multiChart_childrenCharts = function (value) {
        if (!arguments.length) return multiChart_childrenCharts;
        multiChart_childrenCharts = value;
        return my;
    };

    my.displayThisChart = function (value) {
        if (!arguments.length) return displayThisChart;
        displayThisChart = value;
        return my;
    };

    my.binData = function () { // TODO: just for testing
        return binData;
    };

    my.incomingRequestedData = function (received) {
        var req = received.req; // TODO: multiChart
        if (my.uniqueID() === "" + received.sensorType + received.sensorNumber) {
            my.addDataToBinData(req, received.bin_level).reRenderTheNextTime(true).update();
        }

        // Notify children that there is updated data.
        //_.each(multiChart_childrenCharts, function (child) {
            //child.reRenderTheNextTime(true).update();
        //});
    };

    my.addDataToBinData = function (datas, level) {
        // add data to binData IN THE CORRECT ORDER
        waitingForServer = false;
        var filteredDatas = [];

        if (level === 0) {
            filteredDatas = _.filter(datas, notNaNVal);
        } else {
            filteredDatas = datas;
        }

        if (filteredDatas.length === 0) {
            //console.log("NO DATA");
        } else if (level === 0) {
            binData.addRawData(filteredDatas);
        } else {
            binData.addBinnedData(filteredDatas, level);
        }

        return my;
    };

    my.bd = function () {
        return binData;
    };

    // Getters and Setters }}}

    return my;
};

/* vim: set foldmethod=marker: */
