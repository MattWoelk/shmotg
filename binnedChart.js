// {{{ CONSTANTS
var MAX_NUMBER_OF_BIN_LEVELS = 34; // keep sync'd with Server/serv.js
  // TODO: phase this out (preferable) OR set it as a really high number
var TIME_CONTEXT_VERTICAL_EACH = 25;
  // vertical size of each section of the user time context system
// CONSTANTS }}}

// {{{ HELPER FUNCTIONS

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

// selection are the objects,
// fill and stroke are functions,
// scal is the scale
function drawElements(sel, fill, stroke, scal, toTransition, scalOld, ease, dur, d0s, bin, mar, renScale, strokeW) {
  //update
  if (toTransition) {
    sel.attr("transform", transformScale(scalOld, renScale, mar))
       .attr("d", function (d, i) { return d0s[d.key][d.which]; })
       .transition().ease(ease).duration(dur)
       .attr("transform", transformScale(scal, renScale, mar));
  } else {
    sel.attr("opacity", function (d) { return bin.getOpacity(d.key); })
       .attr("d", function (d, i) { return d0s[d.key][d.which]; }) // TODO: remove this ??
       .attr("transform", transformScale(scal, renScale, mar));
  }

  //enter
  var sels = sel.enter().append("path")
    .attr("class", "posPath")
    .attr("fill", fill)
    .style("stroke-width", strokeW)
    .attr("d", function (d, i) { return d0s[d.key][d.which]; })
    .style("stroke", stroke);

  if (toTransition) {
    sels.attr("transform", transformScale(scalOld, renScale, mar))
      .attr("opacity", 0)
      .transition().ease(ease).duration(dur)
        .attr("transform", transformScale(scal, renScale, mar))
        .attr("opacity", function (d) { return bin.getOpacity(d.key); });
  } else {
    sels.attr("transform", transformScale(scal, renScale, mar))
      .attr("opacity", function (d) { return bin.getOpacity(d.key); });
  }

  //exit
  var sels = toTransition ?
    sel.exit().transition().ease(ease).duration(dur) :
    sel.exit();

  sels
    .attr("transform", transformScale(scal, scalOld, mar))
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
  var resultArray = new Array();

  if (whichLines.indexOf('rawData') > -1){
    resultArray.push({
      key: 'rawData',
      which: 0
    });
  }

  var j = 0;
  var keys = bin.getKeys();
  for (var keyValue in keys){ // for each of 'average', 'max', 'min'
    var key = keys[keyValue];

    if (whichLines.indexOf(key) > -1){
      for (j = 0; j < MAX_NUMBER_OF_BIN_LEVELS; j++) {
        if (whichLevel === j){
          resultArray.push({
            key: key,
            which: j,
            interpolate: interp
          });
        }
      }
    }
  }

  return resultArray;
};

// See makeDataObjectForKeyFanciness for explanation of output
var makeQuartileObjectForKeyFanciness = function (whichLines, whichLevel, interp) {
  var resultArray = new Array();
  var key = 'quartiles';

  var j = 0;
  if (whichLines.indexOf('quartiles') > -1)
  {
    for (j = 0; j < MAX_NUMBER_OF_BIN_LEVELS; j++) {
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
}

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
  var toLevel = Math.log( samplesPerBin ) / Math.log( 2 );
  var toLevel = Math.floor(toLevel);
  var toLevel = d3.max([0, toLevel]);
  var toLevel = d3.min([MAX_NUMBER_OF_BIN_LEVELS - 1, toLevel]);

  return toLevel;
}

// return a string label to be put in the user time context area
// Depends on the times variable from msToCentury.js
var getTimeContextString = function (scal, show) {
  if (!show) return [];

  var result = "";

  var timeContextFormatSpecifier = [
    { fun: function (a,b) { return (b - a) < 2 * times.y;  }, formIf: "%Y",  formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.mo; }, formIf: " %b", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.d;  }, formIf: " %a %d", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.h;  }, formIf: " %H", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.m;  }, formIf: ":%M", formIfNot: "h"},
    { fun: function (a,b) { return (b - a) < 2 * times.s;  }, formIf: ":%Ss", formIfNot: ""},
    // milliseconds would be unnecessary for our purposes
  ];

  var d0 = scal.domain()[0];
  var d1 = scal.domain()[1];
  var doneNow = false;

  parseDate = d3.time.format(_.reduce(timeContextFormatSpecifier, function (str, dat) {
    if ( doneNow ) return str;
    if (dat.fun(d0, d1)) {
      return str + dat.formIf;
    } else {
      doneNow = true;
      return str + dat.formIfNot;
    }
  }, ""));


  // Convert milliseconds to a Date object
  function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
  }

  result = parseDate(dt(d0));
  return [ result ];
}

// HELPER FUNCTIONS }}}

var binnedLineChart = function (data, dataRequester, girder) {

  //{{{ VARIABLES

  var dataReq = dataRequester;
  var strokeWidth = 1;
  var whichGirder = girder;

  // the frequency of the data samples
  var milliSecondsPerSample = 1;

  // TODO: sync this with the one in bridgecharts.js
  //       - can't do, because we're changing top depending
  //         on if we're showing time context
  //       - unless we make it a new offset variable instead of reusing margin
  var margin = {top: 10, right: 27, bottom: 25, left: 40};

  // the height of the chart by itself (not including axes or time context)
  var height = 150 - margin.top - margin.bottom;

  // the width of the chart, including margins
  var containerWidth = document.getElementById("chartContainer").offsetWidth;
  var width = containerWidth - margin.left - margin.right;

  var whichLevelToRender = 0;
  var whichLinesToRender = ['average', 'average', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];

  var showTimeContext = true;

  var transitionDuration = 500;
  var easingMethod = 'cubic-in-out';

  var defclip;
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;
  var previousXScale = d3.scale.linear(); // used for rendering transitions
  var previousLevelToRender; // used for rendering transitions;
  var timeContextContainer;

  var chart; // the svg element (?)
  var paths;

  var slctn; // Save the selection so that my.update() works.

  // whether we used the buttons to zoom
  var transitionNextTime = false;
  var reRenderTheNextTime = true;
  var waitingForServer = false;
  var freshArrivalFromServer = false;

  // Where all data is stored, but NOT rendered d0's
  var binData = binnedData();

  // Where all the rendered d0s are stored.
  var renderedD0s = {
    rawData         : new Array(), // an array of levels
    rawDataRanges   : new Array(), // an array of the rendered range for each corresponding level
    average         : new Array(),
    averageRanges   : new Array(),
    maxes           : new Array(),
    maxesRanges     : new Array(),
    mins            : new Array(),
    minsRanges      : new Array(),
    q1              : new Array(),
    q1Ranges        : new Array(),
    q2              : new Array(),
    q2Ranges        : new Array(),
    q3              : new Array(),
    q3Ranges        : new Array(),
    quartiles       : new Array(),
    quartilesRanges : new Array(),
  };

  // VARIABLES }}}

  //{{{ HELPER METHODS

  // This is the function used to render the data at a specific size.
  var renderFunction = function (d) {
    // See transformScale for the inverse.

    // Store this for later use.
    renderScale = xScale.copy();

    return (d.ms - renderScale.domain()[0]) * getScaleValue(renderScale);
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
    xScale.range([0, width]); // So that the furthest-right point is at the right edge of the plot

    if (!yScale){ yScale = d3.scale.linear(); }
    yScale
      .domain([binData.getMinRaw(), binData.getMaxRaw()])
      .range([height, 0]);

    // SELECTION AND SCALES }}}

    //{{{ GENERATE d0s. (generate the lines paths)

    // Currently, we are abandoning non-contiguous values as if they don't exist. This may be just fine. :)
    // Also, when you scroll left, then scroll back right it will have forgotten the part that was on the left. This also may be just fine. :)

    // Choose which d0s need to be generated
    // based on which keys are active.
    var renderThis = [];
    renderThis = renderThis.concat(whichLinesToRender);
    if (whichLinesToRender.indexOf("quartiles") !== -1) {
      // If we're going to render the quartiles, we need to render q1 and q3.
      if (whichLinesToRender.indexOf("q3") === -1) {
        renderThis = ['q3'].concat(renderThis);
      }
      if (whichLinesToRender.indexOf("q1") === -1) {
        renderThis = ['q1'].concat(renderThis);
      }
    }

    var xdiff = xScale.domain()[1] - xScale.domain()[0];

    // figure out how much to render:
    var renderRange = [ xScale.domain()[0] - xdiff,   // render thrice what is necessary.
                        xScale.domain()[1] + xdiff ]; // (xdiff / 2) for twice

    // initialize the array if it's the first time for this level and key:
    for (var keyValue in renderThis) {
      var key = renderThis[keyValue];

      if (!renderedD0s[key + "Ranges"][whichLevelToRender]) {
        // first time for this level/key
        renderedD0s[key + "Ranges"][whichLevelToRender] = [0, 0];
      }
    }

    var didWeRenderAnything = false;

    // for each key
    // 1. find out whether we should render things
    for (var keyValue in renderThis) {
      var key = renderThis[keyValue];

      // These two variables are here to remove the slight amount
      // of un-rendered space which shows up on the sides just
      // before the new data is generated. It provides a buffer zone.
      var tenDiff = (renderedD0s[key + "Ranges"][whichLevelToRender][1] -
                     renderedD0s[key + "Ranges"][whichLevelToRender][0]) * 0.1;
      var ninetyPercentRange = [ renderedD0s[key + "Ranges"][whichLevelToRender][0] + tenDiff ,
                                 renderedD0s[key + "Ranges"][whichLevelToRender][1] - tenDiff ];

      //if we are not within the range OR reRenderTheNextTime
      if (!isWithinRange([xScale.domain()[0], xScale.domain()[1]], ninetyPercentRange) || reRenderTheNextTime) {
        //render the new stuff
        didWeRenderAnything = true;

        if (key === 'quartiles') {
          // render AREA d0s

          var q1Filter = binData.getDateRange('q1', whichLevelToRender, renderRange);
          var q3Filter = binData.getDateRange('q3', whichLevelToRender, renderRange);

          renderedD0s.quartiles[whichLevelToRender] = d3.svg.area()
            .x(renderFunction)
            .y0(function (d, i) { return yScale( q1Filter[i].val ); }) //.val
            .y1(function (d, i) { return yScale( q3Filter[i].val ); }) //.val
            .interpolate( interpolationMethod )(q1Filter);

        } else {
          // render LINES d0s

          var lineFilter = binData.getDateRange(key, whichLevelToRender, renderRange);

          renderedD0s[key][whichLevelToRender] = d3.svg.line()
            .x(renderFunction)
            .y(function (d, i) { return yScale(d.val); })
            .interpolate( interpolationMethod )(lineFilter);

        } // if quartiles else lines

        // update the Ranges of rendered data
        renderedD0s[key + "Ranges"][whichLevelToRender] = [renderRange[0], renderRange[1]];
      } // if we should render anything
    } // for

    // If we rendered anything, see if we need more data from the server
    // AKA see if we didn't have enough data to render the entire domain.
    if (didWeRenderAnything && !waitingForServer) {
      // TODO: this may be happening twice as often as necessary, see server output as well as above similar TODO note

      // If we don't have every piece of data in this range, ask for it all.
      if (!binData.haveDataInRange(renderRange, whichLevelToRender)) {
        var req = {
          sensor: whichGirder,
          ms_start: renderRange[0],
          ms_end: renderRange[1],
          bin_level: whichLevelToRender,
        }

        waitingForServer = true;
        dataReq(req);
      }
    }

    reRenderTheNextTime = false;
    freshArrivalFromServer = false;

    // GENERATE ALL d0s. (generate the lines paths) }}}

    //// SELECTION.EACH ////

    selection.each(function () {

      //{{{ CONTAINER AND CLIPPING

      chart = d3.select(this); //Since we're using a .call(), "this" is the svg element.

      //Set it's container's dimensions
      selection
        .attr("width", width);

      //Set the chart's dimensions
      chart
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      //Allow dragging and zooming.
      //chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));


      //Make the clipPath (for cropping the paths)
      if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip" + whichGirder).append("rect"); }
      defclip
        //.transition().duration(transitionDuration)
        .attr("width", width)
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("height", height);

      //Apply the clipPath
      paths = !paths ? chart.append("g") : paths;
      paths
        .attr("clip-path", "url(#clip" + whichGirder + ")")
        .attr("class", "paths")
        .attr("height", height);

      // CONTAINER AND CLIPPING }}}

      //{{{ LINES

      //Make and render the Positive lines.
      var dataObjectForKeyFanciness = makeDataObjectForKeyFanciness(binData, whichLinesToRender, whichLevelToRender, interpolationMethod);
      var currentSelection = paths.selectAll(".posPath")
        .data(dataObjectForKeyFanciness, function (d) { return d.key + d.which + d.interpolate; });

      drawElements(currentSelection,
                   function (d) { return "rgba(0,0,0,0)"; },
                   function (d) { return binData.getColor(d.key); },
                   xScale,
                   transitionNextTime,
                   previousXScale,
                   easingMethod,
                   transitionDuration,
                   renderedD0s,
                   binData,
                   margin,
                   renderScale,
                   strokeWidth);

      // LINES }}}

      //{{{ AREAS
      //make and render the area
      var quartileObjectForKeyFanciness = makeQuartileObjectForKeyFanciness(whichLinesToRender, whichLevelToRender, interpolationMethod)
      currentSelection = paths.selectAll(".posArea")
        .data(quartileObjectForKeyFanciness, function (d) {return d.key + d.which + d.interpolate; });

      drawElements(currentSelection,
                   function (d) { return binData.getColor(d.key); },
                   function (d) { return "rgba(0,0,0,0)"; },
                   xScale,
                   transitionNextTime,
                   previousXScale,
                   easingMethod,
                   transitionDuration,
                   renderedD0s,
                   binData,
                   margin,
                   renderScale,
                   strokeWidth);

      // AREAS }}}

      //{{{ AXES
      // Draw Axes using msToCentury.js format and values
      xAxis = d3.svg.axis()
        .tickSize(6, 3, 3) //major, minor, end
        .tickFormat(msToCenturyTickFormat)
        .tickValues(msToCenturyTickValues(xScale, width))
        .tickSubdivide(msToCenturyTickSubDivide(xScale, width))
        .scale(xScale).orient("bottom");

      //d3.selectAll(".tick text").attr("opacity", function (d, i) { console.log(d); return i % 4 * 0.25; });
      // TODO: instead of the above nonsense, put a gradient box as a mask over the x axes.

      if (!xAxisContainer) { xAxisContainer = chart.append("g"); }
      xAxisContainer.attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        //.attr("transform", "translate(" + margin.left + "," + height + ")");
      if (transitionNextTime) {
        xAxisContainer.transition().duration(transitionDuration).ease(easingMethod).call(xAxis);
      } else {
        xAxisContainer/*.transition().duration(transitionDuration)*/.call(xAxis);
      }

      yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(3)
        .tickSubdivide(true)
        .tickSize(width, 0, 0) // major, minor, end
        .orient("left");

      if (!yAxisContainer) { yAxisContainer = chart.append("g"); }
      yAxisContainer.attr("class", "y axis")
        .attr("transform", "translate(" + (width + margin.left) + ", " + margin.top + ")");
        //.attr("transform", "translate(" + margin.left + "," + height + ")");
      yAxisContainer/*.transition().duration(transitionDuration)*/.call(yAxis);
      // AXES }}}

      //{{{ TIME CONTEXT
      if (!timeContextContainer) { timeContextContainer = chart.append("g"); }

      // Draw Time Context
      var timeContextSelection = timeContextContainer.selectAll("text")
        .data(getTimeContextString(xScale, showTimeContext));

      // enter
      timeContextSelection.enter().append("text");

      // update
      timeContextSelection
        .text(function (d) { return d; })
        .attr("x", margin.left)
        .attr("y", function (d, i) { return TIME_CONTEXT_VERTICAL_EACH; });

      // exit
      timeContextSelection.exit()
        .remove();

      // TIME CONTEXT }}}

      //{{{ TRANSITION NEXT TIME
      if (transitionNextTime) {
        // So that this only happens once per button click
        transitionNextTime = false;
      }
      // TRANSITION NEXT TIME }}}

    });
  };

  //{{{ Getters and Setters

  my.milliSecondsPerSample = function (value) {
    if (!arguments.length) return milliSecondsPerSample;
    milliSecondsPerSample = value;
    return my;
  }

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
    whichLevelToRender = value;
    return my;
  };

  my.whichLinesToRender  = function (value) {
    if (!arguments.length) return whichLinesToRender;
    if (  _.difference(value, whichLinesToRender).length !== 0
       || _.difference(whichLinesToRender, value).length !== 0 ) { // contain the different things
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

  my.transitionNextTime = function (value) {
    if (!arguments.length) return transitionNextTime;
    transitionNextTime = value;
    return my;
  }

  my.reRenderTheNextTime = function (value) {
    if (!arguments.length) return reRenderTheNextTime;
    reRenderTheNextTime = value;
    return my;
  }

  my.xScale = function (value) {
    if (!arguments.length) return xScale;

    // if value is the same as xScale, don't modify previousXScale
    if (!xScale) {
      previousXScale = d3.scale.linear(); // now it's initialized.
      previousLevelToRender = whichLevelToRender;
    }else if (xScale && ( xScale.domain()[0] != value.domain()[0] || xScale.domain()[1] != value.domain()[1] )) {
      previousXScale = xScale.copy();
      previousLevelToRender = whichLevelToRender;
    } // else, don't change previousXScale

    xScale = value;
    //my.reRenderTheNextTime(true);
    return my;
  }

  my.yScale = function (value) {
    if (!arguments.length) return yScale;
    yScale = value;
    //my.reRenderTheNextTime(true);
    return my;
  }

  my.update = function (reRender) {
    my.setSelectedLines();
    my(slctn);
  };

  my.showTimeContext = function (show) {
    if (!arguments.length) return showTimeContext;

    showTimeContext = show;
    margin.top = margin.top + (showTimeContext ? TIME_CONTEXT_VERTICAL_EACH : 0);

    return my;
  };

  // TODO: make this independent of the actual HTML. Do it through bridgecharts.js instead
  my.setSelectedLines = function () {
    var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), function (checkbox) { return checkbox.value;} );
    my.whichLinesToRender(a);

    my.whichLevelToRender(goToLevel(xScale, milliSecondsPerSample));

    var b = document.querySelector("#render-method input:checked").value;
    if (b !== interpolationMethod) {
      my.reRenderTheNextTime(true);
    }
    interpolationMethod = b;
    return my;
  };

  my.uniqueID = function (value) {
    if (!arguments.length) return whichGirder;
    whichGirder = value;
    return my;
  }

  my.binData = function () { // TODO: just for testing
    return binData;
  }

  my.addDataToBinData = function (datas, level) {
    // add data to binData IN THE CORRECT ORDER

    if (datas.length === 0) {
      console.log("NO DATA");
      return my;
    }

    if (level === 0) {
      binData.addRawData(datas);
    } else {
      binData.addBinnedData(datas, level);
    }

    waitingForServer = false;
    freshArrivalFromServer = true;

    return my;
  }

  // TODO: this is just for testing
  my.bd = function () {
    return binData;
  }

  // Getters and Setters }}}

  return my;
};

/* vim: set foldmethod=marker: */
