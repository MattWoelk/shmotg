// TODO:
// BUGS AND IMPROVEMENTS:
//      When going from a large window to a small window, some background elements are still being rendered as being very large (so a horizontal scroll bar appears).
//      [ TODO CURRENT TASK!!!!  ]    Make the levels-calculating dynamic; as needed
//      Only render what is on-screen.
//      - this involves dynamically changing the size of the curves based on what is on-screen.
//      - might need to store all of the data we know about in one place (per girder, so, per bridgeChart) and have a separate data structure which stores the actual data which is to be mapped to a curve.
//        - create a new data structure called "renderData"
//        - add new functions which add data to binData (based on level and time)
//          - might need to keep it all sorted by date
//          - might need to change the way things are initialized
//      Make an animation to show that data is being downloaded
//      - background could have a color sweep in from one side
//        - so the whole thing would look like a progress bar, but classier
//      - could have a spinner in some corner
//      - could load data into the lines as it's generated
//      - could have a flat, grey line which comes out of the last data point (or the average only or something) which would then transition to the right location and become the right colour as data comes in
//      Don't allow zooming in more than what the max bin size would allow
//      Steal time format for x axis from here: http://bl.ocks.org/4015254
//      - wait until it's using the time data from the json feed
//      Make an equation which calculates the size of the x-axis labels, and changes their format if they can't all fit beside each other
//      - They could be staggered, then. Which would look cool.
//      - They could be abbreviated
//      - There could be less of them (most likely scenario)
//      - could be worth a pull request. :D
//      - OR rotate them when necessary: http://www.d3noob.org/2013/01/how-to-rotate-text-labels-for-x-axis-of.html

// FEATURE IDEAS:
//      Threshold integration to show all points over a certain value in a certain color?
//      - maybe just have a movable dashed line which a user can use to look at thresholds
//      - maybe only show values which are above a threshold
//      Bin Size of 1 should show data points as circles
//      - mouseover data points to show exact values
//      - ... maybe
//      Make a small multiples mode which allows comparisons between years (or between whatever the user likes)

var binnedLineChart = function (data) {
  var strokeWidth = 1;

  // sync this with the one in bridgecharts.js
  var margin = {top: 10, right: 10, bottom: 25, left: 40};

  var height = 150 - margin.top - margin.bottom;

  // the width of the chart, including margins
  var container_width = document.getElementById("chart_container").offsetWidth;
  var width = container_width - margin.left - margin.right;

  var howManyBinLevels = 6;
  var whichLevelsToRender = []; // example: [1, 2, 3];
  var whichLinesToRender = ['average', 'rawData', 'average', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];

  var transition_duration = 500;
  var easingMethod = 'cubic-in-out';

  var defclip;
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;
  var previous_xScale;

  var chart;
  var paths;
  var dataObjectForKeyFanciness;

  var slctn; // Save the selection so that my.update() works.

  var transition_the_next_time = false;

  function copy_scale(scal) {
    return d3.scale.linear().domain([scal.domain()[0], scal.domain()[1]]).range([scal.range()[0], scal.range()[1]]);
  }


  // Where all data is stored, but NOT rendered d0's
  var binData = {
    keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
    rawData : {
      color: '#000',
      opacity: 0.5,
      levels: [], // stores all of the values for each level in an array.
                 // example: [[1, 2, 3, 4], [2, 4]]
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
    }
  };

  var rendered_d0s = {
    rawData : new Array(), // an array of levels
    average : new Array(),
    maxes   : new Array(),
    mins    : new Array(),
    q1      : new Array(),
    q2      : new Array(),
    q3      : new Array(),
    quartiles: new Array()
  };

  // The following function returns something which looks like this:
  // [
  //   {type: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
  //   {type: 'average', which: 2, interpolate: blabla}, <-- the current level is 'which'
  //   {type: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
  // ]
  // add to it if you want more lines displayed
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
          if (whichLevelsToRender.indexOf(j) > -1){
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

  var makeQuartileObjectForKeyFanciness = function () {
    var resultArray = new Array();
    var key = 'quartiles';

    var j = 0;
    if (whichLinesToRender.indexOf('quartiles') > -1)
    {
      for (j = 0; j < howManyBinLevels; j++) {
        if (whichLevelsToRender.indexOf(j) > -1){
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
        if (key === 'q1' || key === 'q3') {
          bDat.push( func(
                bin['q1'].levels[curLevel][i],
                bin['q1'].levels[curLevel][i+1],
                bin['q3'].levels[curLevel][i],
                bin['q3'].levels[curLevel][i+1])); // This is messy and depends on a lot of things
        }else{
          bDat.push( func(
                bin[key].levels[curLevel][i],
                bin[key].levels[curLevel][i+1]));
        }
      }else{
        bDat.push( bin[key].levels[curLevel][i] );
      }
    }
    return bDat;
  };

  // populate the binned datas (binData):

  binData.rawData.levels[0] = data;

  for (var keyValue in binData['keys']){ // set level 0 data for each of 'average', 'max', 'min', etc.
    binData[binData.keys[keyValue]].levels[0] = data;

    var j = 0;
    for (j = 1; j < howManyBinLevels; j++){ // add a new object for each bin level
      binData[binData.keys[keyValue]].levels[j] = [];
    }
  }

  for (j = 1; j < howManyBinLevels; j++){ // for each bin level
    for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
      var key = binData.keys[keyValue];
      binData[key].levels[0] = data;

      binData[key].levels[j] = binTheDataWithFunction(binData, j-1, key, binData[key]['func']);
    }
  }

  var my = function (selection) {
    my.setSelectedLines();
    slctn = selection; // Saving the selection so that my.update() works.

    width = container_width - margin.left - margin.right;



    if (!xScale) { xScale = d3.scale.linear().domain([0, binData.levels[0].rawData.length - 1]); }
    xScale
      .range([0, width]); // So that the furthest-right point is at the right edge of the plot

    if (!yScale){ yScale = d3.scale.linear(); }
    yScale
      .domain([d3.min(binData.rawData.levels[0]), d3.max(binData.rawData.levels[0])])
      .range([height, 0]);

    var fillScale = d3.scale.linear()
      .domain([0, d3.max(binData.rawData.levels[0])])
      .rangeRound([255, 0]);


    //// GENERATE ALL d0s. (generate the lines paths) ////

    //Raw Data
    rendered_d0s['rawData'][0] = d3.svg.line()
      .x(function (d, i) { return xScale(i); })
      .y(function (d, i) { return yScale(binData.rawData.levels[0][i]); })
      .interpolate(interpolationMethod)(binData.rawData.levels[0]);

    //For the lines:
    for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
      var j = 0;
      var key = binData['keys'][keyValue];

      rendered_d0s[key][0] = rendered_d0s['rawData'][0];

      for (j = 1; j < howManyBinLevels; j++){ // for each level of binning
        rendered_d0s[key][j] = d3.svg.line()
          .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
          .y(function (d, i) { return yScale(binData[key].levels[j][i]); })
          .interpolate( interpolationMethod )(binData[key].levels[j]);
      }
    }

    //For the areas:
    rendered_d0s["q1"][0] = rendered_d0s["rawData"][0];
    rendered_d0s["q3"][0] = rendered_d0s["rawData"][0];

    for (j = 0; j < howManyBinLevels; j++){ // for each level of binning
      rendered_d0s["quartiles"][j] = d3.svg.area()
        .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
        .y0(function (d, i) { return yScale(binData["q1"].levels[j][i]); })
        .y1(function (d, i) { return yScale(binData["q3"].levels[j][i]); })
        .interpolate( interpolationMethod )(binData["q1"].levels[j]);
    }

///////////// vvv START NEW SECTION vvv /////////////
    // This takes binData and trims it so that we are only rendering things which are on the screen.
    var generateRenderData = function (bin, render) {
      newobject = {};
      newobject.keys = bin.keys.slice(0); // using slice(0) to make a copy
      newobject.properties = bin.properties; // direct reference; sharing a pointer

      newobject.levels = [];
      // use _.filter to keep only the data which we want to render
      // this will be much easier once we have timestamps on our data ...
      _.times(bin.levels.length, function (i) {
        //console.log(i); // 0, 1, 2, 3, 4, 5, 6
        newobject.levels.push({});
        _.forEach(bin.levels[i], function (d, level_name) {
          //console.log(level_name); //rawData, rawDatad0, average, etc.
          newobject.levels[i][level_name] = _.filter(bin.levels[i][level_name], function (dat, iter) {
            // TODO: filter out what is off-screen.
            // this will be much easier once we have timestamps on our data ...
            // TODO: start using newobject instead of binData in my();
          });
        });
      });
      var i = 0;
      //for (i = 0; i < )
      //newobject.levels

      return newobject;
    };

    //var renderData = generateRenderData(binData, renderData);
///////////// ^^^ END NEW SECTION ^^^ /////////////

    selection.each(function () {

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
        //.transition().duration(transition_duration)
        .attr("width", width)
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("height", document.getElementById("chart_container").offsetHeight); // this is a hack:
          // it makes every clip path as tall as the container, so that firefox can always choose the first one and it'll work.

      //Apply the clipPath
      paths = !paths ? chart.append("g") : paths;
      paths
        .attr("clip-path", "url(#clip)") // Firefox issue: We're using the same "clip" id more than once; once for each bridgeChart that exists. :S
        .attr("class", "paths")
        .attr("height", height);

      dataObjectForKeyFanciness = makeDataObjectForKeyFanciness(binData);

      //// CURVES ////
      //Make and render the Positive curves.
      var currentSelection = paths.selectAll(".posPath")
        .data(dataObjectForKeyFanciness, function (d) {return d.type + d.which + d.interpolate; });

      //update
      if (transition_the_next_time) {
        currentSelection
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .style("stroke", function (d, i) { return binData[d.type].color; })
          .transition().duration(transition_duration).ease(easingMethod)
          .attr("opacity", function (d) { return binData[d.type].opacity; })
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      } else {
        currentSelection
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .style("stroke", function (d, i) { return binData[d.type].color; })
          .attr("opacity", function (d) { return binData[d.type].opacity; })
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      }

      //enter
      if (transition_the_next_time) {
        // TODO: make this into a nice function!
        //       this will need to happen when we switch from indices to time-stamps
        var prevd0s = [];
        for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
          var j = 0;
          var key = binData['keys'][keyValue];
          var xdiff = xScale.domain()[1] - xScale.domain()[0];
          var xScale2 = d3.scale.linear().domain([ xScale.domain()[0] + (xdiff / 2), xScale.domain()[1] + (xdiff / 2) ]).range(xScale.range());

          prevd0s[key] = d3.svg.line()
            .x(function (d, i) { return previous_xScale(i * Math.pow(2, whichLevelsToRender[0])); })
            .y(function (d, i) { return yScale(binData[key].levels[whichLevelsToRender[0]][i]); })
            .interpolate( interpolationMethod )(binData[key].levels[whichLevelsToRender[0]]);
        }
        currentSelection.enter().append("path")
          .attr("class", "posPath")
          .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .style("stroke", function (d, i) { return binData[d.type].color; })
          .attr("opacity", 0)
          .attr("d", function (d, i) { return prevd0s[d.type]; })
          .transition().ease(easingMethod).duration(transition_duration)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", function (d) { return binData[d.type].opacity; });
      } else {
        currentSelection.enter().append("path")
          .attr("class", "posPath")
          .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .style("stroke", function (d, i) { return binData[d.type].color; })
          .attr("opacity", 0)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", function (d) { return binData[d.type].opacity; });
      }

      //exit
      if (transition_the_next_time) {
        currentSelection.exit()
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .transition().ease(easingMethod).duration(transition_duration)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", 0)
          .remove();
      } else {
        currentSelection.exit()
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", 0)
          .remove();
      }


      //// AREAS ////
      //make and render the area
      currentSelection = paths.selectAll(".posArea")
        .data(makeQuartileObjectForKeyFanciness(), function (d) {return d.type + d.which + d.interpolate; });

      //update area
      currentSelection
        .attr("opacity", function (d) { return binData[d.type].opacity; })
        .style("stroke-width", strokeWidth);

      if (transition_the_next_time) {
        currentSelection.transition().duration(transition_duration).ease(easingMethod)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      } else {
        currentSelection.attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      }

      //enter area
      if (transition_the_next_time) {
        // TODO: make this into a nice function!
        var prevd0s_quar = d3.svg.area()
          .x(function (d, i) { return previous_xScale(i * Math.pow(2, whichLevelsToRender[0])); })
          .y0(function (d, i) { return yScale(binData["q1"].levels[whichLevelsToRender[0]][i]); })
          .y1(function (d, i) { return yScale(binData["q3"].levels[whichLevelsToRender[0]][i]); })
          .interpolate( interpolationMethod )(binData["q1"].levels[whichLevelsToRender[0]]);
        currentSelection.enter().append("path")
          .attr("class", "posArea")
          .attr("fill", function (d, i) {return binData[d.type].color; })
          .style("stroke-width", strokeWidth)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .attr("opacity", 0.0)
          .attr("d", function (d, i) { return prevd0s_quar; })
          .transition().ease(easingMethod).duration(transition_duration)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", function (d) { return binData[d.type].opacity; });
      } else {
        currentSelection.enter().append("path")
          .attr("class", "posArea")
          .attr("fill", function (d, i) {return binData[d.type].color; })
          .style("stroke-width", strokeWidth)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .attr("opacity", function (d) { return binData[d.type].opacity; });
      }

      //exit area
      if (transition_the_next_time) {
        currentSelection.exit()
          .attr("opacity", function (d) { return binData[d.type].opacity; })
          .transition().duration(transition_duration).ease(easingMethod)
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", 0.0)
          .remove();
      } else {
        currentSelection.exit()
          .attr("opacity", function (d) { return binData[d.type].opacity; })
          .attr("d", function (d, i) { return rendered_d0s[d.type][d.which]; })
          .attr("opacity", 0.0)
          .remove();
      }

      // Draw Axes
      xAxis = d3.svg.axis()
        .tickSize(6)
        .scale(xScale).orient("bottom");

      if (!xAxisContainer) { xAxisContainer = chart.append("svg:g"); }
      xAxisContainer.attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        //.attr("transform", "translate(" + margin.left + "," + height + ")");
      if (transition_the_next_time) {
        xAxisContainer.transition().duration(transition_duration).ease(easingMethod).call(xAxis);
      } else {
        xAxisContainer/*.transition().duration(transition_duration)*/.call(xAxis);
      }

      yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(3)
        .tickSubdivide(true)
        .tickSize(width, 0, 0) // major, minor, end
        .orient("left");

      if (!yAxisContainer) { yAxisContainer = chart.append("svg:g"); }
      yAxisContainer.attr("class", "y axis")
        .attr("transform", "translate(" + (width + margin.left) + ", " + margin.top + ")");
        //.attr("transform", "translate(" + margin.left + "," + height + ")");
      yAxisContainer/*.transition().duration(transition_duration)*/.call(yAxis);

      if (transition_the_next_time) {
        // So that this only happens once per button click
        transition_the_next_time = false;
      }
    });
  };


  // == Getters and Setters ==

  my.container_width = function (value) {
    if (!arguments.length) return container_width;
    container_width = value;
    return my;
  };

  my.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  };

  my.margin_top = function (value) {
    if (!arguments.length) return margin.top;
    margin.top = value;
    return my;
  };

  my.howManyBinLevels = function (value) {
    if (!arguments.length) return howManyBinLevels ;
    howManyBinLevels = value;
    return my;
  };

  my.whichLevelsToRender = function (value) {
    if (!arguments.length) return whichLevelsToRender  ;
    whichLevelsToRender = value;
    return my;
  };

  my.whichLinesToRender  = function (value) {
    if (!arguments.length) return whichLinesToRender   ;
    whichLinesToRender   = value;
    return my;
  };

  my.strokeWidth = function (value) {
    if (!arguments.length) return strokeWidth;
    strokeWidth = value;
    return my;
  };

  my.transition_the_next_time = function (value) {
    if (!arguments.length) return transition_the_next_time;
    transition_the_next_time = value;
    return my;
  }

  my.xScale = function (value) {
    if (!arguments.length) return xScale;

    // if value is the same as xScale, don't modify previous_xScale
    if (!xScale) {
      previous_xScale = d3.scale.linear(); // now it's initialized.
    }else if (xScale && ( xScale.domain()[0] != value.domain()[0] || xScale.domain()[1] != value.domain()[1] )) {
      previous_xScale = copy_scale(xScale);
    } // else, don't change previous_xScale

    xScale = value;
    return my;
  }

  my.yScale = function (value) {
    if (!arguments.length) return yScale;
    yScale = value;
    return my;
  }

  my.update = function () {
    my(slctn);
  };

  my.setSelectedLines = function () {
    var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), function (checkbox) { return checkbox.value;} );
    whichLinesToRender = a;

    //var b = [Number(document.querySelector("li input:checked[name='render-depth']").value)];
    //whichLevelsToRender = b;


    //Want: samples/bin --> level
    //Have: pixels/bin, screen/pixels, samples/screen

    // pixels/bin:
    var pixelsPerBin = document.getElementById("renderdepth").value;
    // screen/pixels:
    var screenPerPixels = 1/width;
    // samples/screen:
    if (xScale) { // isn't there on the first rendering
      var samplesPerScreen = xScale.domain()[1] - xScale.domain()[0]
    }else{
      var samplesPerScreen = 100; //dummy value
    }

    // sam   pix   scr   sam
    // --- = --- * --- * ---
    // bin   bin   pix   scr
    var samplesPerBin = pixelsPerBin * screenPerPixels * samplesPerScreen;

    //now convert to level and floor
    var toLevel = Math.log( samplesPerBin ) / Math.log( 2 );
    var toLevel = Math.floor(toLevel);
    var toLevel = d3.max([0, toLevel]);
    var toLevel = d3.min([howManyBinLevels - 1, toLevel]);

    my.whichLevelsToRender([ toLevel ]);

    var b = document.querySelector("#render-method input:checked").value;
    interpolationMethod = b;
    return my;
  };

  return my;
};
