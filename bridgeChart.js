//{{{ TODO AND NOTES:
//  CURRENT TASK:
//      Only render what is on-screen.
//      - See "new section" for the beginnings of a fix for this.
// TODO: }}}

var binnedLineChart = function (data, dataRequester) {

  //{{{ VARIABLES

  var datReq = dataRequester;
  var strokeWidth = 1;

  // TODO: sync this with the one in bridgecharts.js
  var margin = {top: 10, right: 27, bottom: 25, left: 40};

  var height = 150 - margin.top - margin.bottom;

  var minDistanceBetweenXAxisLabels = 75;

  // the width of the chart, including margins
  var containerWidth = document.getElementById("chartContainer").offsetWidth;
  var width = containerWidth - margin.left - margin.right;

  var howManyBinLevels = 10; // TODO: phase this out (preferable) OR set it as a really high number
  var whichLevelToRender = 0;
  var whichLinesToRender = ['average', 'rawData', 'average', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];

  var transitionDuration = 500;
  var easingMethod = 'cubic-in-out';

  var defclip; // the clipping region TODO: stop using ids, or have a unique id per chart. This will help the firefox problem. Id should be based on the type of data which is being stored by the chart (AA, CC, DD, etc.) ?
              //  - could have this clip path set by bridgecharts.js instead
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;
  var previousXScale; // used for rendering transitions
  var previousLevelToRender; // used for rendering transitions;

  var chart; // the svg element (?)
  var paths;

  var slctn; // Save the selection so that my.update() works.

  // whether we used the buttons to zoom
  var transitionNextTime = false;
  var reRenderTheNextTime = true;

  // Where all data is stored, but NOT rendered d0's
  var binData = {
    keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
    rawData : {
      color: '#000',
      opacity: 0.5,
      levels: [], // stores all of the values for each level in an array.
                 // example: [[1, 2, 3, 4], [2, 4]]
                 // NEW: TODO: example: [[{val: 1, date: new Date()}, {val: 2, date: new Date()}], [etc.]]
    },
    average : {
      color : '#F00',
      opacity: 1,
      func   : function (a, b) { return (a+b)/2; },
      levels: [],
    },
    maxes : {
      color : '#000FB5',
      opacity: 1,
      func   : function (a, b) { return d3.max([a,b]); },
      levels: [],
    },
    mins : {
      color : '#00B515',
      opacity: 1,
      func   : function (a, b) { return d3.min([a,b]); },
      levels: [],
    },
    q1 : {
      color : '#800',
      opacity: 1,
      func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
      levels: [],
    },
    q3 : {
      color : '#800',
      opacity: 1,
      func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
      levels: [],
    },
    quartiles : {
      color : '#800',
      opacity: 0.3,
      //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
      levels: [],
    },
  };

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

  var testTime = "Mon Jan 02 2012 23:12:33 GMT-0600 (CST)";
  var testTime = testTime.substring(0,24);
  var testScale = d3.time.scale()
    .range([0, width]);
  var parseDate = d3.time.format("%a %b %d %Y %H:%M:%S").parse;
  //console.log(parseDate(testTime));
  var samplesPerSecond = 200;
  var samplesPerMillisecond = 1000/samplesPerSecond;
  var mils = 196*samplesPerMillisecond;
  var testTimeMilliseconds = testTime + "." + mils;
  // TODO: This ^^ combining should be done on the server
  // good idea: pass around date.getTime()'s

  var parseDateMilliseconds = d3.time.format("%a %b %d %Y %H:%M:%S.%L").parse;
  //console.log(testTimeMilliseconds);
  //console.log(parseDateMilliseconds(testTimeMilliseconds));

  // VARIABLES }}}

  //{{{ HELPER FUNCTIONS

  //TODO:
  //    - need a function here which requests specific data from bridgecharts.js
  //    - need a function in bridgecharts.js which requests that data from the server
  //    - each bridgeChart.js will be asking for different data (from different girders) so there won't be redundancy :)
  function requestForData(dat) {
    // send a request to bridgecharts.js for specific data
    // request: [Date, Date]
    // receive: not in this function. TODO: make a new function which updates binData.
  }

  // TODO: use this for two things:
  // - draw a line under the charts to show the size of day/minute/second/etc.
  // - display the currently-viewed year&day&hour&minutes&etc.
  //   - See Issue #11 (https://github.com/MattWoelk/www/issues/11)
  //   - display whichever ones are larger than the current domain
  //   - and by 'domain' I mean getTicks(scal)[-1] - getTicks(scal)[0]
  // - thought: could the second of these fullfill the purpose of the 1st?
  function getTicks(scal) {
    //console.log(scal.ticks(width / 100));
  }

  // selection are the objects,
  // fill and stroke are functions,
  // scal is the scale
  function drawElements(sel, fill, stroke, scal) {
    //update
    if (transitionNextTime) {
      sel
        .transition().duration(transitionDuration).ease(easingMethod)
          .attr("d", function (d, i) { return renderedD0s[d.type][d.which]; })
          .attr("opacity", function (d) { return binData[d.type].opacity; })
          .attr("transform", transformScale(xScale, whichLevelToRender));
    } else {
      sel
        .attr("d", function (d, i) { return renderedD0s[d.type][d.which]; })
        .attr("opacity", function (d) { return binData[d.type].opacity; })
        .attr("transform", transformScale(xScale, whichLevelToRender));
    }

    //enter
    if (transitionNextTime) {
      sel.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", fill)
        .style("stroke-width", strokeWidth)
        .attr("transform", transformScale(previousXScale, whichLevelToRender))
        .attr("opacity", 0)
        .attr("d", function (d, i) { return renderedD0s[d.type][d.which]; })
        .style("stroke", stroke)
        .transition().ease(easingMethod).duration(transitionDuration)
          .attr("transform", transformScale(xScale, whichLevelToRender))
          .attr("opacity", function (d) { return binData[d.type].opacity; });
    } else {
      sel.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", fill)
        .style("stroke-width", strokeWidth)
        .attr("d", function (d, i) { return renderedD0s[d.type][d.which]; })
        .attr("transform", transformScale(xScale, whichLevelToRender))
        .style("stroke", stroke)
        .attr("opacity", function (d) { return binData[d.type].opacity; });
    }

    //exit
    if (transitionNextTime) {
      sel.exit()
        .transition().ease(easingMethod).duration(transitionDuration)
          .attr("transform", transformScale(xScale, previousLevelToRender))
          .attr("opacity", 0)
          .remove();
    } else {
      sel.exit()
        .attr("transform", transformScale(xScale, previousLevelToRender))
        .attr("opacity", 0.0)
        .remove();
    }
  }

  function roundUpToNearestTime(val, tim) {
    return Math.ceil(val/tim) * tim;
  }

  function roundDownToNearestTime(val, tim) {
    return Math.floor(val/tim) * tim;
  }

  function millisecond(val) {
    var newdate = new Date();
    newdate.setTime(roundDownToNearestTime(val, times.ms));
    return newdate;
  }

  var times = {
    ms: 1, //milliseconds
    s: 1000, //seconds
    m: 6e4, //minutes
    h: 36e5, //hours
    d: 864e5, //days
    // These are approximations:
    mo: 2592e6, //months
    y: 31536e6, //years
  };

  // Convert milliseconds to a Date object
  function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
  }

  function getNumberOfDaysInCurrentMonth(dat) {
    var curmo = dat.getMonth();
    var addYear;
    if (( curmo + 1 ) / 12.0 >= 1.0) {
      // we rolled over to the next year
      addYear = dat.getFullYear() + 1;
    } else {
      addYear = dat.getFullYear();
    }
    var newdate = new Date(
        addYear,
        (curmo + 1) % 12,
        1,
        1,
        1,
        1,
        1);
    newdate = dt(newdate.getTime() - 4000000);
    return newdate.getDate();
  }

  function getNumberOfDaysInCurrentYear(dat) {
    var newdateStart = new Date(dat.getFullYear()    , 0, 0);
    var newdateEnd   = new Date(dat.getFullYear() + 1, 0, 0);
    var diff = newdateEnd.getTime() - newdateStart.getTime();
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  // Data object to help make custom axis' tick values
  // [ estimate size in milliseconds,
  //   how many to increment,
  //   precise time rounder for anchoring,
  //   precise time rounder ]
  var rounding_scales = [
    [ times.ms , 1   , d3.time.second , millisecond],
    [ times.ms , 2   , d3.time.second , millisecond],
    [ times.ms , 5   , d3.time.second , millisecond],
    [ times.ms , 10  , d3.time.second , millisecond],
    [ times.ms , 20  , d3.time.second , millisecond],
    [ times.ms , 50  , d3.time.second , millisecond],
    [ times.ms , 100 , d3.time.second , millisecond],
    [ times.ms , 200 , d3.time.second , millisecond],
    [ times.ms , 500 , d3.time.second , millisecond],
    [ times.s  , 1   , d3.time.minute , d3.time.second],
    [ times.s  , 2   , d3.time.minute , d3.time.second],
    [ times.s  , 5   , d3.time.minute , d3.time.second],
    [ times.s  , 15  , d3.time.minute , d3.time.second],
    [ times.s  , 30  , d3.time.minute , d3.time.second],
    [ times.m  , 1   , d3.time.hour   , d3.time.minute],
    [ times.m  , 2   , d3.time.hour   , d3.time.minute],
    [ times.m  , 5   , d3.time.hour   , d3.time.minute],
    [ times.m  , 15  , d3.time.hour   , d3.time.minute],
    [ times.m  , 30  , d3.time.hour   , d3.time.minute],
    [ times.h  , 1   , d3.time.day    , d3.time.hour],
    [ times.h  , 3   , d3.time.day    , d3.time.hour],
    [ times.h  , 6   , d3.time.day    , d3.time.hour],
    [ times.h  , 12  , d3.time.day    , d3.time.hour],
    [ times.d  , 1   , d3.time.month  , d3.time.day],
    [ times.d  , 2   , d3.time.month  , d3.time.day],
    [ times.d  , 5   , d3.time.month  , d3.time.day],
    [ times.d  , 10  , d3.time.month  , d3.time.day],
    [ times.d  , 15  , d3.time.month  , d3.time.day],
    [ times.mo , 1   , d3.time.year   , d3.time.month],
    [ times.mo , 2   , d3.time.year   , d3.time.month],
    [ times.mo , 3   , d3.time.year   , d3.time.month],
    [ times.mo , 6   , d3.time.year   , d3.time.month],
    [ times.mo , 12  , d3.time.year   , d3.time.month],
    [ times.y  , 1  , d3.time.year , d3.time.year],
    [ times.y  , 2  , d3.time.year , d3.time.year],
    [ times.y  , 5  , d3.time.year , d3.time.year],
    [ times.y  , 10 , d3.time.year , d3.time.year],
    [ times.y  , 25 , d3.time.year , d3.time.year],
    [ times.y  , 50 , d3.time.year , d3.time.year],
    [ times.y  , 100, d3.time.year , d3.time.year],
    [ times.y  , 100, d3.time.year , d3.time.year],
  ];

  function makeTickRange(start, end, increment, incrementOf, baseFunc, smallInc) {
    if ( incrementOf === d3.time.year ) {
      // For Years
      var startyear = d3.time.year.floor(dt(start));
      var endyear   = d3.time.year.ceil( dt(end  ));

      var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

      // Filter for proper increments
      curange = _.filter(curange, function (d, i) {
        return d % increment == 0;
      });

      curange = _.map(curange, function (d) { return new Date(d, 0); });

      return curange;

    } else if ( incrementOf === d3.time.month ) {
      // For Months
      var startyear = d3.time.year.floor(dt(start));
      var endyear   = d3.time.year.ceil( dt(end  ));

      var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

      // for each year, get all of the months for it
      curange = _.map(curange, function (d, i) {
        return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (f) {
          // For each month of the year
          return new Date(d, f);
        });
      });
      curange = _.flatten(curange);

      curange = _.filter(curange, function (d, i) {
        // Filter for proper increments
        return i % increment == 0;
      });

      return curange;

    } else if (baseFunc === d3.time.month){
      // For Days
      var startyear = d3.time.year.floor(dt(start));
      var endyear   = d3.time.year.ceil( dt(end  ));

      var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

      // For each year, get all of the months for it
      curange = _.map(curange, function (year, i) {
        return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (month) {
          // For each month of the year
          var monthDays = getNumberOfDaysInCurrentMonth(new Date(year, month));
          return _.map(d3.range(1, monthDays + 1), function (day) {
            // For each day of the month
            // Filter for proper increments
            //   and remove ones which are too close
            //   together near the ends of the months
            if ((day - 1) % increment == 0 && monthDays + 1 - day >= increment ) {
              return new Date(year, month, day);
            } else {
              return [];
            }
          });
        });
      });

      curange = _.flatten(curange);

      return curange;

    } else {
      // For everything smaller than days
      return d3.range( baseFunc.floor( dt(start) ).getTime(),
                       baseFunc.ceil(  dt( end ) ).getTime(),
                       roundUpToNearestTime(
                         smallInc*minDistanceBetweenXAxisLabels/width,
                         smallInc));
    }
  }

  function onScreenSizeOfLabels(millisecondsPerLabel, screenWidth, distanceBtwnLabels) {
    return millisecondsPerLabel * screenWidth / distanceBtwnLabels;
  }

  function msToCenturyTickValues(scal) {
    var dom = scal.domain();

    var i = 0;
    for (i = 0; i < rounding_scales.length; i++) {
      var ro = rounding_scales[i];
      var compr = onScreenSizeOfLabels(ro[0]*ro[1], width, minDistanceBetweenXAxisLabels);

      if (dom[1] - dom[0] <= compr ) {
        var result = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1]);

        // filter this for only what is actually on-screen.
        result = _.filter(result, function (num) {
          return num < dom[1] && num > dom[0];
        });

        return result;
      }
    }

    // This should never occur
    // TODO: set the extents of zoom so that this is indeed the case.
    // - might have to use compr again.
    // - and therefore use onScreenSizeOfLabels()
    return [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
  }

  // custom formatting for x axis time
  function msToCenturyTickFormat(ti) {
    function timeFormat(formats) {
      return function(date) {
        var newdate = new Date();
        newdate.setTime(date);
        var i = formats.length - 1, f = formats[i];
        while (!f[1](newdate)) f = formats[--i];
        return f[0](newdate);
      };
    }

    var customTimeFormat = timeFormat([
       [ d3.time.format("%Y")    , function() { return true; }                 ],
       [ d3.time.format("%b")    , function(d) { return d.getMonth(); }        ],
       [ d3.time.format("%a %d") , function(d) { return d.getDate() != 1; }    ],
       [ d3.time.format("%I %p") , function(d) { return d.getHours(); }        ],
       [ d3.time.format("%I:%M") , function(d) { return d.getMinutes(); }      ],
       [ d3.time.format("%Ss")   , function(d) { return d.getSeconds(); }      ],
       [ d3.time.format("%Lms")  , function(d) { return d.getMilliseconds(); } ]
      ]);

    return function(d) { return customTimeFormat(ti); }();
  }

  function maxBinRenderSize () {
    return document.getElementById("renderdepth").value / 4;
    // TODO: magic:
    // the 4 is to balance something which is due to the
    // sampling rate being 200Hz
  }

  function goToLevel(scal) {
    //Want: samples/bin --> level
    //Have: pixels/bin, pixels/sample

    // pixels/bin:
    var pixelsPerBin = maxBinRenderSize();
    var pixelsPerSample = getScaleValue(scal);

    // sam   pix   sam
    // --- = --- * ---
    // bin   bin   pix
    var samplesPerBin = pixelsPerBin / pixelsPerSample;

    //now convert to level and floor
    var toLevel = Math.log( samplesPerBin ) / Math.log( 2 );
    var toLevel = Math.floor(toLevel);
    var toLevel = d3.max([0, toLevel]);
    var toLevel = d3.min([howManyBinLevels - 1, toLevel]);

    return toLevel;
  }

  // This is the function used to render the data at a specific size.
  var renderFunction = function (d) {
    // See transformScale for the inverse.
    oldxS = getScaleValue(xScale);
    oldLevel = goToLevel(xScale);
    //return d.date.getTime() * oldxS;
    return d.date.getTime() * m(oldLevel, oldxS);
  };

  var oldxS = 1;
  var oldLevel = 1;

  function mB () {
    return maxBinRenderSize();
  }

  function lmBl (lvl, scalVal) {
    return Math.pow(2, lvl) * scalVal;
  }

  function m (lvl, scalVal) {
    //return 1;                  // lines change size with zoom
    //console.log("mB: " + mB() + ", |mB|: " + lmBl(lvl));
    return 1/Math.pow(2, lvl) * lmBl(lvl, scalVal); // lines change size with slider
    return 1/Math.pow(2, lvl - 3); // lines change size with slider
  }

  //TODO: instead of using maxBinRenderSize straight-up here ^^^ and here vvv
  //      - we need to round it to powers of 2 or something...

  // This is the transform which is done on the data after it has been rendered.
  function transformScale(scal, level) {
    var pixelsPerSample = getScaleValue(scal);
    var xS = getScaleValue(scal);

    // TODO: fix the scrolling offset here (likely somewhere else, actually)
    var tx = margin.left - (getScaleValue(scal) * scal.domain()[0]);
    var ty = margin.top; // translate y value
    //var ty = (margin.top + yScale.domain()[0]); // translate y value (this is here if we ever want to dynamically change the y scale)

    // See renderFunction for the inverse.
    // TODO: replace maxBinRenderSize with what it SHOULD be at this level

    // TODO: need some 2^love going on here.
    var sx = xS / oldxS;
    //var sx = xS / m(oldLevel, oldxS); //pixelsPerSample / m(); //renderRatio; // scale x value

    //console.log(sx, oldLevel);
    //var sx = pixelsPerSample * Math.pow(2, goToLevel(xScale)); //pixelsPerSample / m(); //renderRatio; // scale x value
    var sy = 1; // scale y value

    return "translate(" + tx + "," + ty + ")scale(" + sx + "," + sy + ")";
  }

  function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
  }

  function copyScale(scal) {
    return d3.scale.linear().domain([scal.domain()[0], scal.domain()[1]]).range([scal.range()[0], scal.range()[1]]);
  }

  // The following function returns something which looks like this:
  // [
  //   {type: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
  //   {type: 'average', which: 2, interpolate: blabla}, <-- the current level is 'which'
  //   {type: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
  // ]
  var makeDataObjectForKeyFanciness = function (bin) {
    var resultArray = new Array();

    if (whichLinesToRender.indexOf('rawData') > -1){
      resultArray.push({
        type: 'rawData',
        which: 0
      });
    }

    var j = 0;
    for (var keyValue in bin['keys']){ // for each of 'average', 'max', 'min'
      var key = bin.keys[keyValue];

      if (whichLinesToRender.indexOf(key) > -1){
        for (j = 0; j < howManyBinLevels; j++) {
          if (whichLevelToRender === j){
            resultArray.push({
              type: key,
              which: j,
              interpolate: interpolationMethod
            });
          }
        }
      }
    }

    return resultArray;
  };

  // See makeDataObjectForKeyFanciness for explanation of output
  var makeQuartileObjectForKeyFanciness = function () {
    var resultArray = new Array();
    var key = 'quartiles';

    var j = 0;
    if (whichLinesToRender.indexOf('quartiles') > -1)
    {
      for (j = 0; j < howManyBinLevels; j++) {
        if (whichLevelToRender === j){
          resultArray.push({
            type: key,
            which: j,
            interpolate: interpolationMethod
          });
        }
      }
    }
    return resultArray;
  }

  var isWithinRange = function (r1, r2) {
    // see if r1 is within r2
    return r1[0] >= r2[0] && r1[1] <= r2[1];
  };

  var getTwoLargest = function (array) {
    var arr = array.slice();
    first = d3.max(arr);
    arr.splice(arr.indexOf(first),1);
    second = d3.max(arr);
    return [first, second];
  };

  var average = function (array) {
    return d3.sum(array)/array.length;
  };

  var getTwoSmallest = function (array) {
    var arr = array.slice();
    first = d3.min(arr);
    arr.splice(arr.indexOf(first),1);
    second = d3.min(arr);
    return [first, second];
  };

  // Bin the data into abstracted bins
  var binTheDataWithFunction = function (bin, curLevel, key, func) {
    var bDat = new Array();
    var i = 0;
    for(i = 0; i < bin[key].levels[curLevel].length; i = i + 2){
      if (bin[key].levels[curLevel][i+1]){
        var newdate = new Date();
        newdate.setTime(bin['q1'].levels[curLevel][i/*+1*/].date.getTime());

        if (key === 'q1' || key === 'q3') {
          //console.log( bin['q1'].levels[curLevel][i+1].date.getTime() );

          bDat.push({ val:  func(
                bin['q1'].levels[curLevel][i].val,
                bin['q1'].levels[curLevel][i+1].val,
                bin['q3'].levels[curLevel][i].val,
                bin['q3'].levels[curLevel][i+1].val)
              , date: newdate }); // This is messy and depends on a lot of things
        }else{
          bDat.push( { val: func(
                bin[key].levels[curLevel][i].val,
                bin[key].levels[curLevel][i+1].val)
              , date: newdate });
        }
      }else{
        var newdate = new Date();
        newdate.setTime(bin[key].levels[curLevel][i].date);
        bDat.push( { val: bin[key].levels[curLevel][i].val // TODO: FIX
                   , date: newdate } );
      }
    }
    return bDat;
  };

  // HELPER FUNCTIONS }}}

  //{{{ POPULATE THE BINNED DATAS (binData)

  binData.rawData.levels[0] = _.map(data, function (num) { var newdate = new Date(); newdate.setTime(num.SampleIndex); return {val: num.ESGgirder18, date: newdate }; });

  for (var keyValue in binData['keys']){ // set level 0 data for each of 'average', 'max', 'min', etc.
    binData[binData.keys[keyValue]].levels[0] = _.map(data, function (num) { var newdate = new Date(); newdate.setTime(num.SampleIndex); return {val: num.ESGgirder18, date: newdate}; });
    var j = 0;
    //console.log(_.map(data, function (num) { return {val: num};}));
    for (j = 1; j < howManyBinLevels; j++){ // add a new object for each bin level
      binData[binData.keys[keyValue]].levels[j] = [];
    }
  }

  for (j = 1; j < howManyBinLevels; j++){ // for each bin level
    for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
      var key = binData.keys[keyValue];
      binData[key].levels[0] = _.map(data, function (num, py) { var newdate = new Date(); newdate.setTime(num.SampleIndex); return {val: num.ESGgirder18, date: newdate }; });
      binData[key].levels[j] = binTheDataWithFunction(binData, j-1, key, binData[key]['func']);
    }
  }

  // POPULATE THE BINNED DATAS (binData) }}}

  //// MY ////

  var my = function (selection) {

    //{{{ SELECTION AND SCALES

    my.setSelectedLines();
    slctn = selection; // Saving the selection so that my.update() works.

    width = containerWidth - margin.left - margin.right;

    if (!xScale) {
      xScale = d3.scale.linear().domain([0, binData.levels[0].rawData.length - 1]);
    }
    xScale
      .range([0, width]); // So that the furthest-right point is at the right edge of the plot
    //getTicks(xScale);

    if (!yScale){ yScale = d3.scale.linear(); }
    yScale
      .domain([d3.min(binData.rawData.levels[0], function(d) { return d.val; }), d3.max(binData.rawData.levels[0], function(d) { return d.val; })])
      .range([height, 0]);

    // SELECTION AND SCALES }}}

    //{{{ GENERATE d0s. (generate the lines paths)

    // Currently, we are abandoning non-contiguous values as if they don't exist. This may be just fine. :)
    // Also, when you scroll left, then scroll back right it will have forgotten the part that was on the left. This also may be just fine. :)

    //var findTimeRange = function (arr) {
    //TODO: use getTime instead
    //  var max = _.max(arr, function (d) { return d.date; /* TODO: define structure */ }).date; /* TODO: define structure */
    //  var min = _.min(arr, function (d) { return d.date; /* TODO: define structure */ }).date; /* TODO: define structure */
    //  return [min, max];
    //};

    // Choose which d0s need to be generated
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

    // initialize the array if it's the first time for this level and key:
    for (var keyValue in renderThis) {
      var key = renderThis[keyValue];

      if (!renderedD0s[key + "Ranges"][whichLevelToRender]) {
        //console.log("FIRST TIME FOR THIS LEVEL/KEY, " + key);
        renderedD0s[key + "Ranges"][whichLevelToRender] = [0, 0];
      }
    }

    for (var keyValue in whichLinesToRender) {
      var key = whichLinesToRender[keyValue];

      if (isWithinRange([xScale.domain()[0], xScale.domain()[1]], renderedD0s[key + "Ranges"][whichLevelToRender]) && !reRenderTheNextTime) {
          // necessary range is already rendered for this key
          // render nothing new; just use what is already there
      } else if (reRenderTheNextTime){

        // console.log(getScaleValue(xScale));
        if (key === 'quartiles') {
          // render AREA d0s
          renderedD0s["q1"][0] = renderedD0s["rawData"][0]; // TODO: learn to do without this line
          renderedD0s["q3"][0] = renderedD0s["rawData"][0]; // TODO: learn to do without this line

          renderedD0s["quartiles"][whichLevelToRender] = d3.svg.area()
            .x(renderFunction)
            .y0(function (d, i) { return yScale(binData["q1"].levels[whichLevelToRender][i].val); }) //.val
            .y1(function (d, i) { return yScale(binData["q3"].levels[whichLevelToRender][i].val); }) //.val
            .interpolate( interpolationMethod )(binData["q1"].levels[whichLevelToRender]);
        } else {
          // render LINES d0s

          // figure out how much to render:
          var xdiff = xScale.domain()[1] - xScale.domain()[0];
          var newRange = [0, 0];
          newRange[0] = xScale.domain()[0] - (xdiff / 2); // render twice what is necessary.
          newRange[1] = xScale.domain()[1] + (xdiff / 2);

          renderedD0s[key + "Ranges"][whichLevelToRender] = [newRange[0], newRange[1]];

          // TODO: when to poll server for more data ???
          //     - we will ask binData (through a function) if it has the data
          //     - if that binData doesn't have it, we'll request information
          //       from the server througoh bridgecharts.js somehow.

          renderedD0s['rawData'][0] = d3.svg.line() // TODO: learn to do without this line
            .x(renderFunction)
            .y(function (d, i) { return yScale(binData.rawData.levels[0][i].val); })
            .interpolate(interpolationMethod)(binData.rawData.levels[0]);

          renderedD0s[key][0] = renderedD0s['rawData'][0]; // TODO: learn to do without this line

          renderedD0s[key][whichLevelToRender] = d3.svg.line()
            .x(renderFunction)
            .y(function (d, i) { return yScale(binData[key].levels[whichLevelToRender][i].val); })
            .interpolate( interpolationMethod )(binData[key].levels[whichLevelToRender]);
        } // if quartiles
      } // if don't need to render
    } // for

    reRenderTheNextTime = false;






///////////// vvv START NEW SECTION vvv /////////////
//    // TODO: This takes binData and trims it so that we are only rendering things which are on the screen.
//    var generateRenderData = function (bin, render) {
//      newobject = {};
//      newobject.keys = bin.keys.slice(0); // using slice(0) to make a copy
//      newobject.properties = bin.properties; // direct reference; sharing a pointer
//
//      newobject.levels = [];
//      // use _.filter to keep only the data which we want to render
//      // this will be much easier once we have timestamps on our data ...
//      _.times(bin.levels.length, function (i) {
//        //console.log(i); // 0, 1, 2, 3, 4, 5, 6
//        newobject.levels.push({});
//        _.forEach(bin.levels[i], function (d, levelName) {
//          //console.log(levelName); //rawData, rawDatad0, average, etc.
//          newobject.levels[i][levelName] = _.filter(bin.levels[i][levelName], function (dat, iter) {
//            // TODO: filter out what is off-screen.
//            // this will be much easier once we have timestamps on our data ...
//            // TODO: start using newobject instead of binData in my();
//          });
//        });
//      });
//      var i = 0;
//      //for (i = 0; i < )
//      //newobject.levels
//
//      return newobject;
//    };
//
//    //var renderData = generateRenderData(binData, renderData);
///////////// ^^^ END NEW SECTION ^^^ /////////////
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
      if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip").append("rect"); }
      defclip
        //.transition().duration(transitionDuration)
        .attr("width", width)
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("height", document.getElementById("chartContainer").offsetHeight); // this is a hack:
          // it makes every clip path as tall as the container, so that firefox can always choose the first one and it'll work.
          // should be .attr("height", height);

      //Apply the clipPath
      paths = !paths ? chart.append("g") : paths;
      paths
        .attr("clip-path", "url(#clip)") // Firefox issue: We're using the same "clip" id more than once; once for each bridgeChart that exists. :S
        .attr("class", "paths")
        .attr("height", height);

      var dataObjectForKeyFanciness = makeDataObjectForKeyFanciness(binData);

      // CONTAINER AND CLIPPING }}}

      //{{{ LINES
      //Make and render the Positive lines.
      var currentSelection = paths.selectAll(".posPath")
        .data(dataObjectForKeyFanciness, function (d) {return d.type + d.which + d.interpolate; });

      drawElements(currentSelection,
                   function (d) { return "rgba(0,0,0,0)"; },
                   function (d) { return binData[d.type].color; },
                   xScale);

      // LINES }}}

      //{{{ AREAS
      //make and render the area
      currentSelection = paths.selectAll(".posArea")
        .data(makeQuartileObjectForKeyFanciness(), function (d) {return d.type + d.which + d.interpolate; });

      drawElements(currentSelection,
                   function (d) { return binData[d.type].color; },
                   function (d) { return "rgba(0,0,0,0)"; },
                   xScale);

      // AREAS }}}

      //{{{ AXES
      // Draw Axes
      xAxis = d3.svg.axis()
        //.tickSize(6)
        .tickFormat(msToCenturyTickFormat)
        .tickValues(msToCenturyTickValues(xScale))
        //.ticks(width / 100) // TODO: magic number. It looks good, though.
        .scale(xScale).orient("bottom");

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

      if (transitionNextTime) {
        // So that this only happens once per button click
        transitionNextTime = false;
      }
      // AXES }}}

    });
  };

  //{{{ Getters and Setters

  my.containerWidth = function (value) {
    if (!arguments.length) return containerWidth;
    if (containerWidth !== value) my.reRenderTheNextTime(true);
    containerWidth = value;
    return my;
  };

  my.height = function (value) {
    if (!arguments.length) return height;
    if (height !== value) my.reRenderTheNextTime(true);
    height = value;
    return my;
  };

  my.marginTop = function (value) {
    if (!arguments.length) return margin.top;
    if (margin.top !== value) my.reRenderTheNextTime(true);
    margin.top = value;
    return my;
  };

  my.howManyBinLevels = function (value) {
    if (!arguments.length) return howManyBinLevels ;
    if (howManyBinLevels !== value) my.reRenderTheNextTime(true);
    howManyBinLevels = value;
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
    whichLinesToRender   = value;
    //my.reRenderTheNextTime(true);
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
      previousXScale = copyScale(xScale);
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
    if (!arguments.length) {
      my(slctn);
    } else {
      //my.reRenderTheNextTime(reRender);
      my(slctn);
    }
  };

  my.setSelectedLines = function () {
    var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), function (checkbox) { return checkbox.value;} );
    whichLinesToRender = a;

    //var b = [Number(document.querySelector("li input:checked[name='render-depth']").value)];
    //whichLevelToRender = b[0];

    my.whichLevelToRender(goToLevel(xScale));

    var b = document.querySelector("#render-method input:checked").value;
    if (b !== interpolationMethod) {
      my.reRenderTheNextTime(true);
    }
    interpolationMethod = b;
    return my;
  };

  // Getters and Setters }}}

  return my;
};

/* vim: set foldmethod=marker: */
