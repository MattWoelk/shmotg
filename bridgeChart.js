// TODO:
// BUGS AND IMPROVEMENTS:
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
//      Make an equation which calculates the size of the x-axis labels, and changes their format if they can't all fit beside eachother
//      - They could be staggered, then. Which would look cool.
//      - They could be appreviated
//      - There could be less of them (most likely scenario)
//      - could be worth a pull request. :D

// PERHAPS DONE:
//      Make transitions happen between levels on zoom button presses.
//      - This now looks great, but is not COMPLETELY perfect. Making it perfect would require much work and storage and brain injury.

// FEATURE IDEAS:
//      Threshold integration to show all points over a certain value in a certain color?
//      - maybe just have a movable dashed line which a user can use to look at thresholds
//      - maybe only show values which are above a threshold
//      Bin Size of 1 should show data points as circles
//      - mouseover data points to show exact values
//      - ... maybe
//      Use nice sliders like these:
//      - http://moebio.com/research/orderoutofchaos/
//      - http://css-tricks.com/value-bubbles-for-range-inputs/
//      Make a small multiples mode which allows comparisons between years (or between whatever the user likes)

var binnedLineChart = function (data) {
  var strokeWidth = 1;

  // sync this with the one in bridgecharts.js
  var margin = {top: 10, right: 10, bottom: 25, left: 40};

  var height = 150 - margin.top - margin.bottom;

  // the width of the chart, including margins
  var container_width = document.getElementById("charts").offsetWidth;
  var width = container_width - margin.left - margin.right;

  var howManyBinLevels = 6;
  var whichLevelsToRender = []; // example: [1, 2, 3];
  var whichLinesToRender = ['rawData', 'averages', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];
  var easingMethod = 'cubic-out';

  var defclip;
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;

  var chart;
  var paths;
  var dataObjectForKeyFanciness;

  var slctn; // Save the selection so that my.update() works.

  var transition_the_next_time = false;

  // The following function returns something which looks like this:
  // [
  //   {type: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
  //   {type: 'averages', which: 2, interpolate: blabla}, <-- the current level is 'which'
  //   {type: 'mins',     which: 2, interpolate: blabla},
  //   {type: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
  // ]
  // add to it if you want more lines displayed
  var makeDataObjectForKeyFanciness = function (data) {
    var resultArray = new Array();

    if (whichLinesToRender.indexOf('rawData') > -1){
      resultArray.push({
        type: 'rawData',
        which: 0
      });
    }

    var j = 0;
    for (var keyValue in data['keys']){ // for each of 'average', 'max', 'min'
      var key = data.keys[keyValue];

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


  //Where everything is stored:
  var binData = {
    keys : ['averages', 'maxes', 'mins', 'q1', 'q3'],
    properties : {
      rawData : {
        color: '#000',
        opacity: 0.5
      },
      averages : {
        color : '#F00',
        opacity: 1,
        func   : function (a, b) { return (a+b)/2; }
      },
      maxes : {
        color : '#000FB5',
        opacity: 1,
        func   : function (a, b) { return d3.max([a,b]); }
      },
      mins : {
        color : '#00B515',
        opacity: 1,
        func   : function (a, b) { return d3.min([a,b]); }
      },
      q1 : {
        color : '#800',
        opacity: 1,
        func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); } // average the two smallest values from q1 and q3
      },
      q3 : {
        color : '#800',
        opacity: 1,
        func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); } // average the two largest values from q1 and q3
      },
      quartiles : {
        color : '#800',
        opacity: 0.3,
        //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); } // average the two largest values from q1 and q3
      }
    },
    levels : [
      { // level 0
        rawData   : new Array(),
        rawDatad0 : new Array(),
        average   : new Array(),
        averaged0 : new Array(),
        maxes     : new Array(),
        maxesd0   : new Array(),
        mins      : new Array(),
        minsd0    : new Array(),
        q1        : new Array(),
        q1d0      : new Array(),
        q2        : new Array(),
        q2d0      : new Array(),
        q3        : new Array(),
        q3d0      : new Array(),
        quartilesd0: new Array()
      },
      { // level 1
        average   : new Array(),
        averaged0 : new Array(),
        maxes     : new Array(),
        maxesd0   : new Array(),
        mins      : new Array(),
        minsd0    : new Array(),
        q1        : new Array(),
        q1d0      : new Array(),
        q2        : new Array(),
        q2d0      : new Array(),
        q3        : new Array(),
        q3d0      : new Array(),
        quartilesd0: new Array()
      } // etc.
    ]
  }

      // Bin the data into abstracted bins
      var binTheDataWithFunction = function (curLevelData, key, func) {
        var bDat = new Array();
        var i = 0;
        for(i = 0; i < curLevelData[key].length; i = i + 2){
          if (curLevelData[key][i+1]){
            if (key === 'q1' || key === 'q3') {
              bDat.push( func(
                    curLevelData['q1'][i],
                    curLevelData['q1'][i+1],
                    curLevelData['q3'][i],
                    curLevelData['q3'][i+1])); // This is messy and depends on a lot of things
            }else{
              bDat.push( func(
                    curLevelData[key][i],
                    curLevelData[key][i+1]));
            }
          }else{
            bDat.push( curLevelData[key][i] );
          }
        }
        return bDat;
      };

      // populate the binned datas (binData):

      binData.levels[0].rawData = data;

      var j = 0;
      for (j = 1; j < howManyBinLevels; j++){ // add a new object for each bin level
        binData.levels.push({});
      }

      for (var keyValue in binData['keys']){ // set level 0 data for each of 'average', 'max', 'min', etc.
        binData.levels[0][binData.keys[keyValue]] = data;
      }

      for (j = 1; j < howManyBinLevels; j++){ // for each bin level
        for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
          var key = binData.keys[keyValue];
          binData.levels[0][key] = data;

          binData.levels[j][key] = new Array(0);
          binData.levels[j][key] = binTheDataWithFunction(binData.levels[j-1], key, binData.properties[key]['func']);
        }
      }

  var my = function (selection) {
    my.setSelectedLines();
    slctn = selection; // Saving the selection so that my.update() works.

    width = container_width - margin.left - margin.right;

    // This takes binData and trims it so that we are only rendering things which are on the screen.
    var generateRenderData = function (data) {
      newobject = {};
      newobject.keys = data.keys.slice(0); // using slice(0) to make a copy
      newobject.properties = data.properties; // direct reference; sharing a pointer

      newobject.levels = [];
      // use _.filter to keep only the data which we want to render
      // this will be much easier once we have timestamps on our data ...
      _.times(binData.levels.length, function (i) {
        //console.log(i); // 0, 1, 2, 3, 4, 5, 6
        newobject.levels.push({});
        _.forEach(binData.levels[i], function (d, level_name) {
          //console.log(level_name); //rawData, rawDatad0, average, etc.
          newobject.levels[i][level_name] = _.filter(binData.levels[i][level_name], function (dat, iter) {
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

    var renderData = generateRenderData(binData);


    if (!xScale) { xScale = d3.scale.linear().domain([0, binData.levels[0].rawData.length - 1]); }
    xScale
      .range([0, width]); // So that the furthest-right point is at the right edge of the plot

    if (!yScale){ yScale = d3.scale.linear(); }
    yScale
      .domain([d3.min(binData.levels[0].rawData), d3.max(binData.levels[0].rawData)])
      .range([height, 0]);

    var fillScale = d3.scale.linear()
      .domain([0, d3.max(binData.levels[0].rawData)])
      .rangeRound([255, 0]);


    //Generate all d0s. (generate the lines paths)

    binData.levels[0]['rawDatad0'] = d3.svg.line()
      .x(function (d, i) { return xScale(i); })
      .y(function (d, i) { return yScale(binData.levels[0].rawData[i]); })
      .interpolate(interpolationMethod)(binData.levels[0].rawData);

    //For the lines:
    for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min', etc.
      var j = 0;
      var key = binData['keys'][keyValue];

      binData.levels[0][key + "d0"] = binData.levels[0]['rawDatad0'];

      for (j = 1; j < howManyBinLevels; j++){ // for each level of binning
        binData.levels[j][key + "d0"] = d3.svg.line()
          .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
          .y(function (d, i) { return yScale(binData.levels[j][key][i]); })
          .interpolate( interpolationMethod )(binData.levels[j][key]);
      }
    }

    //For the areas:
    binData.levels[0]["q1d0"] = binData.levels[0]['rawDatad0'];
    binData.levels[0]["q3d0"] = binData.levels[0]['rawDatad0'];

    for (j = 0; j < howManyBinLevels; j++){ // for each level of binning
      binData.levels[j]["quartilesd0"] = d3.svg.area()
        .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
        .y0(function (d, i) { return yScale(binData.levels[j]["q1"][i]); })
        .y1(function (d, i) { return yScale(binData.levels[j]["q3"][i]); })
        .interpolate( interpolationMethod )(binData.levels[j]["q1"]);
    }

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
        //.transition().duration(500)
        .attr("width", width)
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .attr("height", height);

      //Apply the clipPath
      paths = !paths ? chart.append("g") : paths;
      paths
        .attr("clip-path", "url(#clip)")
        .attr("class", "paths")
        .attr("height", height);


      //TODO: use this to deep copy whatever has been removed, so that we can have the entering paths transition properly.
      //tmpObjectForKeyFanciness = dataObjectForKeyFanciness;

      //CURVES
      //Make and render the Positive curves.
      var currentSelection = paths.selectAll(".posPath")
        .data(makeDataObjectForKeyFanciness(binData), function (d) {return d.type + d.which + d.interpolate; });

      //update
      if (transition_the_next_time) {
        currentSelection
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .style("stroke", function (d, i) { return binData.properties[d.type].color; })
          .transition().duration(500).ease(easingMethod)
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      } else {
        currentSelection
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .style("stroke", function (d, i) { return binData.properties[d.type].color; })
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      }

      //enter
      if (transition_the_next_time) {
        currentSelection.enter().append("path")
          .attr("class", "posPath")
          .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .style("stroke", function (d, i) { return binData.properties[d.type].color; })
          .attr("opacity", 0)
          .transition().ease(easingMethod).duration(500)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; });
      } else {
        currentSelection.enter().append("path")
          .attr("class", "posPath")
          .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
          .style("stroke-width", strokeWidth)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .style("stroke", function (d, i) { return binData.properties[d.type].color; })
          .attr("opacity", 0)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; });
      }

      //exit
      if (transition_the_next_time) {
        currentSelection.exit()
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .transition().ease(easingMethod).duration(500)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("opacity", 0)
          .remove();
      } else {
        currentSelection.exit()
          .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("opacity", 0)
          .remove();
      }


      // AREAS
      //make and render the area
      currentSelection = paths.selectAll(".posArea")
        .data(makeQuartileObjectForKeyFanciness(), function (d) {return d.type + d.which + d.interpolate; });

      //update area
      currentSelection
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
        .style("stroke-width", strokeWidth);

      if (transition_the_next_time) {
        currentSelection.transition().duration(500).ease(easingMethod)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      } else {
        currentSelection.attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      }

      //enter area
      if (transition_the_next_time) {
        currentSelection.enter().append("path")
          .attr("class", "posArea")
          .attr("fill", function (d, i) {return binData.properties[d.type].color; })
          .style("stroke-width", strokeWidth)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .attr("opacity", 0.0)
          .transition().duration(500).ease(easingMethod)
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; });
      } else {
        currentSelection.enter().append("path")
          .attr("class", "posArea")
          .attr("fill", function (d, i) {return binData.properties[d.type].color; })
          .style("stroke-width", strokeWidth)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; });
      }

      //exit area
      if (transition_the_next_time) {
        currentSelection.exit()
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
          .transition().duration(500).ease(easingMethod)
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
          .attr("opacity", 0.0)
          .remove();
      } else {
        currentSelection.exit()
          .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
          .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
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
        xAxisContainer.transition().duration(500).ease(easingMethod).call(xAxis);
      } else {
        xAxisContainer/*.transition().duration(500)*/.call(xAxis);
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
      yAxisContainer/*.transition().duration(500)*/.call(yAxis);

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

    whichLevelsToRender = [ toLevel ];

    var b = document.querySelector("#render-method input:checked").value;
    interpolationMethod = b;
    return my;
  };

  return my;
};
