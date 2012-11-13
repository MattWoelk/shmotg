// TODO:
//      Fade based on how many pixels are being rendered.
//      Bin Size of 1 should show data points as circles
//      - mouseover data points to show exact values
//      Threshold integration to show all points over a certain value in a certain colour?
//      - maybe just have a movable dashed line which a user can use to look at thresholds
//      Integrate all the amazing things I drew up last night.
//      Fix zooming so that it zooms to exactly where the cursor is

var binnedLineChart = function () {
  var strokeWidth = 1;

  var margin = {top: 10, right: 10, bottom: 25, left: 10};

  var height = 150 - margin.top - margin.bottom;
  var offsetWidth = document.getElementById("charts").offsetWidth;
  var width = offsetWidth - margin.left - margin.right;

  var howManyBinLevels = 6;
  var whichLevelsToRender = [1, 2, 3];
  var whichLinesToRender = ['rawData', 'averages', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];
  var easingMethod = 'cubic-out';

  var bkgrect;
  var frgrect;
  var defclip;
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;
  var xAxisScale;

  var chart;
  var paths;

  var slctn; // Save the selection so that my.update() works.

  // The following function returns something which looks like this:
  // [
  //   {type: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
  //   {type: 'averages', which: 2, interpolate: blabla}, <-- the current level is 'which'
  //   {type: 'mins',     which: 2, interpolate: blabla},
  //   {type: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
  // ]
  // add to it if you want more lines displayed
  var makeDataObjectForKeyFanciness = function () {
    var resultArray = new Array();

    if (whichLinesToRender.indexOf('rawData') > -1){
      resultArray.push({
        type: 'rawData',
        which: 0
      });
    }

    var j = 0;
    for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min'
      var key = binData.keys[keyValue];

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


  var my = function (selection) {
    my.setSelectedLines();
    slctn = selection; // Saving the selection so that my.update() works.

    width = offsetWidth - margin.left - margin.right;

    selection.each(function (data) {

      //Where everything is stored:
      binData = {
        keys : ['averages', 'maxes', 'mins', 'q1', 'q3'],
        properties : {
          rawData : {
            colour: '#000',
            opacity: 0.5
          },
          averages : {
            colour : '#F00',
            opacity: 1,
            func   : function (a, b) { return (a+b)/2; } //This is actually the mean AND the median ???
          },
          maxes : {
            colour : '#00B515',
            opacity: 1,
            func   : function (a, b) { return d3.max([a,b]); }
          },
          mins : {
            colour : '#00F',
            opacity: 1,
            func   : function (a, b) { return d3.min([a,b]); }
          },
          q1 : {
            colour : '#800',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); } // average the two smallest values from q1 and q3
          },
          q3 : {
            colour : '#800',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); } // average the two largest values from q1 and q3
          },
          quartiles : {
            colour : '#800',
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

      binData.levels[0].rawData = data;


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


      if (!xScale) { xScale = d3.scale.linear().domain([0, data.length - 1]); }
      xScale
        .range([0, width]); // So that the furthest-right point is at the right edge of the plot

      if (!xAxisScale) { xAxisScale = d3.scale.linear().domain([0, data.length - 1]); } //different than xScale because we want the right-most point to be at the right edge of the chart
      xAxisScale
        .range([0, width]);

      if (!yScale){ yScale = d3.scale.linear(); }
      yScale
        .domain([d3.min(data), d3.max(data)])
        .range([0, height]);

      var fillScale = d3.scale.linear()
        .domain([0, d3.max(data)])
        .rangeRound([255, 0]);


      //Generate all d0s. (generate the lines paths)

      binData.levels[0]['rawDatad0'] = d3.svg.line()
        .x(function (d, i) { return xScale(i); })
        .y(function (d, i) { return yScale(binData.levels[0].rawData[i]); })
        .interpolate(interpolationMethod)(binData.levels[0].rawData);

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

      binData.levels[0]["q1d0"] = binData.levels[0]['rawDatad0'];
      binData.levels[0]["q3d0"] = binData.levels[0]['rawDatad0'];

      for (j = 0; j < howManyBinLevels; j++){ // for each level of binning
        binData.levels[j]["quartilesd0"] = d3.svg.area()
          .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
          .y0(function (d, i) { return yScale(binData.levels[j]["q1"][i]); })
          .y1(function (d, i) { return yScale(binData.levels[j]["q3"][i]); })
          .interpolate( interpolationMethod )(binData.levels[j]["q1"]);
      }


      chart = d3.select(this); //Since we're using a .call(), "this" is the svg element.

      //Set it's container's dimensions
      selection
        .attr("height", height + margin.bottom)
        .attr("width", width);

      //Set the chart's dimensions
      chart
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      //Allow dragging and zooming.
      chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));
      //selection.call(d3.behavior.zoom().x(xAxisScale));


      //Draw the background for the chart
      if (!bkgrect) { bkgrect = chart.insert("svg:rect"); }
      bkgrect
        //.transition().duration(500)
        .attr("width", width)
        .attr("height", height)
        .attr("class", "bkgrect")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .style("fill", "#FFF");

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


      //CURVES
      //Make and render the Positive curves.
      var currentSelection = paths.selectAll(".posPath")
        .data(makeDataObjectForKeyFanciness(), function (d) {return d.type + d.which + d.interpolate; });

      //update
      currentSelection
        //.transition().duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .style("stroke-width", strokeWidth)
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

      //enter
      currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
        .style("stroke-width", strokeWidth)
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("opacity", 0)
        .transition().ease(easingMethod).duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; });

      //exit
      currentSelection.exit()
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .transition().ease(easingMethod).duration(500)
        .attr("opacity", 0)
        .remove();


      // AREAS
      //make and render the area
      currentSelection = paths.selectAll(".posArea")
        .data(makeQuartileObjectForKeyFanciness(), function (d) {return d.type + d.which + d.interpolate; });

      //update area
      currentSelection
        //.transition().duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
        //.attr("fill", function (d, i) { console.log("this happens to "); console.log(d); return binData.properties[d.type].colour; })
        .style("stroke-width", strokeWidth)
        //.style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

      //enter area
      currentSelection.enter().append("path")
        .attr("class", "posArea")
        .attr("fill", function (d, i) {return binData.properties[d.type].colour; })
        .style("stroke-width", strokeWidth)
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        //.attr("transform", function (d, i) {return "translate(" + margin.left + ", 0)"; })
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        //.style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("opacity", 0.0)
        .transition().duration(500).ease(easingMethod)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; });

      //exit area
      currentSelection.exit()
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; })
        .transition().duration(500).ease(easingMethod)
        .attr("opacity", 0.0)
        .remove();

      // Draw Axes
      xAxis = d3.svg.axis()
        .scale(xAxisScale).orient("bottom");
      //yAxis = d3.svg.axis().scale(yScale).orient("bottom");

      if (!xAxisContainer) { xAxisContainer = chart.append("svg:g"); }
      xAxisContainer.attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        //.attr("transform", "translate(" + margin.left + "," + height + ")");
      xAxisContainer.transition().duration(500).call(xAxis);

      //Draw the outline for the chart
      if (!frgrect) { frgrect = chart.append("svg:rect"); }
      frgrect
        .attr("width", width)
        .attr("height", height)
        .attr("class", "frgrect")
        .style("fill", "rgba(0,0,0,0)")
        .style("stroke-width", 3)
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
        .style("stroke", "#000");

    });
  };


  // == Getters and Setters ==

  my.offsetWidth = function (value) {
    if (!arguments.length) return offsetWidth;
    offsetWidth = value;
    return my;
  };

  my.height = function (value) {
    if (!arguments.length) return height;
    height = value;
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

  my.zoomout = function () {
    xScale.domain([0, xScale.domain()[1] * 2]); // TODO: modify a constant instead? That way we can re-do each domain each time without worrying or hacking around.
    xAxisScale.domain([0, xAxisScale.domain()[1] * 2]);
    return my;
  };

  my.zoomin = function () {
    xScale.domain([0, xScale.domain()[1] / 2]);
    xAxisScale.domain([0, xAxisScale.domain()[1] / 2]);
    return my;
  };

  my.zoom = function () {
    xAxisScale.domain(xScale.domain());
    xAxisContainer.call(xAxis);
    my.update();
  };

  my.update = function () {
    my(slctn);
  };

  my.setSelectedLines = function () {
    var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), function (checkbox) { return checkbox.value;} );
    whichLinesToRender = a;

    //var b = [Number(document.querySelector("li input:checked[name='render-depth']").value)];
    //whichLevelsToRender = b;
    pixelsPerBin = document.getElementById("renderdepth").value;
    ////binSizePerSamples = Math.pow(2, whichlevel);
    ////whichlevel = Math.log(2, binsizepersamples);

    //find how many samples are in each pixelsPerBin
    if (xScale) { // isn't there on the first rendering
      var totalSamplesShown = xScale.domain()[1] - xScale.domain()[0]
    }else{
      var totalSamplesShown = 100; //dummy value
    }

    var totalPixelsShown = width;
    var SamplesPerPixel = totalSamplesShown / totalPixelsShown;
    //round down to the nearest 2**binsize
    whichLevelsToRender = [ d3.min([
        d3.max([
          0,
          Math.round(Math.log( SamplesPerPixel*pixelsPerBin, 2))
          ]),
        (howManyBinLevels - 1)
        ])];
    //TODO: fix this so that it fits with the "Bin Render Size" mentality properly
    //       whichLevelsToRender = [ Math.round(Math.log(SamplesPerPixel, 2)*pixelsPerBin) ]; ?????

    console.log(pixelsPerBin);
    console.log(whichLevelsToRender);
    //console.log( Math.log(SamplesPerPixel*pixelsPerBin, 2) );

    var b = document.querySelector("#render-method input:checked").value;
    interpolationMethod = b;
    return my;
  };

  return my;
};
