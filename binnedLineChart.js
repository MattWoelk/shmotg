// TODO:
//      think about using a moving average instead of binning ???
//
//      Current thought process regarding mean vs. median:
//      - if we use median, then we can work with data we already have in order to show abstracted data ONLY because we are always using 2 pieces of data at a time.
//      - mean won't work for quartiles. I checked.
//      Fade based on how many pixels are being rendered.

// This function is courtesy of http://bl.ocks.org/3916621
// which comes originally from https://gist.github.com/3916621
function pathTween(d1, precision, that) {
  return function() {
    var path0 = that
    var path1 = path0.cloneNode(),
        n0 = path0.getTotalLength(),
        n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

    // Uniform sampling of distance based on specified precision.
    var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
    while ((i += dt) < 1) distances.push(i);
    distances.push(1);

    // Compute point-interpolators at each distance.
    var points = distances.map(function(t) {
      var p0 = path0.getPointAtLength(t * n0),
          p1 = path1.getPointAtLength(t * n1);
      return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
    });

    return function(t) {
      return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
    };
  };
}

var binnedLineChart = function () {
  var outlinesOrNot = true;

  var margins = {top: 0, left: 25, bottom: 25, right: 25};

  var height = 150;
  var width = d3.max([window.innerWidth, screen.width]);

  var howManyBinLevels = 6;
  var whichLevelsToRender = [1, 2, 3];
  var whichLinesToRender = ['rawData', 'averages', 'maxes', 'mins'];
  var interpolationMethod = ['linear'];

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
  //   {type: 'rawData',  which: 0}, <-- this one is for the raw data
  //   {type: 'averages', which: 2}, <-- the current level is 'which'
  //   {type: 'mins',     which: 2},
  //   {type: 'maxes',    which: 2}, <-- etc.
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
              which: j
            });
          }
        }
      }
    }

    return resultArray;
  };

  var makeQuartileObjectForKeyFanciness = function () {
    var resultArray = new Array();
    var thekeys = ['q1', 'q3'];

    var j = 0;
    for (var keyValue in thekeys){ // for each of 'q1', 'q2'
      var key = binData.keys[keyValue];

      for (j = 0; j < howManyBinLevels; j++) {
        if (whichLevelsToRender.indexOf(j) > -1){
          resultArray.push({
            type: key,
            which: j
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

    realWidth = width - margins.right - margins.left;

    selection.each(function (data) {

      //     TODO: with this method, we can send binData.levels[0] to func so that functions can share data between themselves. yay!
      //TODO NEW binData way of storing things:        usage: binData.levels[0].rawData = new Array;
      //                                                      binData.properties.averages.opacity = 0.75;
      //             SUMMARY:
      //             binData = {
      //               keys : [names-of-functions],
      //               properties : {
      //                 function-name : {
      //                   property: value,
      //                   property2: value2
      //                 }
      //               },
      //               levels : [
      //                 { // level 0
      //                   rawData : new Array();
      //                 },
      //                 { // level 1
      //                   rawData : new Array();
      //                   averages: new Array();
      //                   maxes   : new Array();
      //                 },
      //               ]
      //             }



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
             colour : '#0F0',
             opacity: 1,
             func   : function (a, b) { return d3.max([a,b]); }
           },
           mins : {
             colour : '#00F',
             opacity: 1,
             func   : function (a, b) { return d3.min([a,b]); }
           },
           q1 : {
             colour : '#009',
             opacity: 1,
             func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); } // average the two smallest values from q1 and q3
           },
           q3 : {
             colour : '#090',
             opacity: 1,
             func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); } // average the two largest values from q1 and q3
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
             q3d0      : new Array()
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
             q3d0      : new Array()
           } // etc.
         ]
       }

      binData.levels[0].rawData = data;


      // TODO: this must be re-written for the sake of q1 and q3 (because they rely on eachother
      //       return a populated array, and take in the levels structure, the current level, they key, and the function which works on that data structure
      var binTheDataWithFunction = function (curLevelData, key, func){
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
        .range([0, realWidth]); // So that the furthest-right point is at the right edge of the plot

      if (!xAxisScale) { xAxisScale = d3.scale.linear().domain([0, data.length - 1]); } //different than xScale because we want the right-most point to be at the right edge of the chart
      xAxisScale
        .range([0, realWidth]);

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

      for (var keyValue in binData['keys']){ // for each of 'average', 'max', 'min'
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

//      var thekeys = ['q1'];
//
//      for (var keyValue in thekeys){ // for each of 'average', 'max', 'min'
//        var j = 0;
//        var key = 'q1';
//
//        binData.levels[0][key + "d0"] = binData.levels[0]['rawDatad0'];
//        binData.levels[0]['q3' + "d0"] = binData.levels[0]['rawDatad0'];
//
//        for (j = 1; j < howManyBinLevels; j++){ // for each level of binning
//          binData.levels[j][key + "d0"] = d3.svg.area()
//            .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
//            .y0(function (d, i) { return yScale(binData.levels[j][key][i]); })
//            .y1(function (d, i) { return yScale(binData.levels[j]['q3'][i]); })
//            .interpolate( interpolationMethod )(binData.levels[j][key]);
//        }
//      }
//

      chart = d3.select(this); //Since we're using a .call(), "this" is the svg element.

      //Set it's container's dimensions
      selection
        .attr("height", height + margins.bottom)
        .attr("width", width);

      //Set the chart's dimensions
      chart
        .attr("width", width - 10) //TODO: magic numbers to get rid of scroll bars
        .attr("height", height + margins.bottom);

      //Allow dragging and zooming.
      chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));
      //selection.call(d3.behavior.zoom().x(xAxisScale));


      //Draw the background for the chart
      if (!bkgrect) { bkgrect = chart.insert("svg:rect"); }
      bkgrect
        //.transition().duration(500)
        .attr("width", realWidth)
        .attr("height", height)
        .attr("class", "bkgrect")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .style("fill", "#FFF");

      //Make the clipPath (for cropping the paths)
      if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip").append("rect"); }
      defclip
        //.transition().duration(500)
        .attr("width", realWidth)
        .attr("transform", "translate(" + margins.left + ", 0)")
        .attr("height", height);

      //Apply the clipPath
      paths = !paths ? chart.append("g") : paths;
      paths
        .attr("clip-path", "url(#clip)")
        .attr("class", "paths")
        .attr("height", height);

      var currentSelection;


      //Make and render the Positive curves.
      currentSelection = paths.selectAll(".posPath")
        .data(makeDataObjectForKeyFanciness(), function (d) {return d.type /*+ d.which*/; });

      //update
      currentSelection
        .transition().duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; }) // TODO: delete this line?
        .attr("fill", "rgba(0,0,0,0)")
        .style("stroke-width", outlinesOrNot ? 1 : 0)
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .transition().duration(500)
        .attrTween("d", function(d) {
          //console.log(pathTween(binData.levels[d.which][d.type + "d0"], 4, this)()());
          return     (pathTween(binData.levels[d.which][d.type + "d0"], 4, this)());
        })
        .attr("transform", function (d, i) { return "translate(" + margins.left + ", 0)"; });

      //enter
      currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", 0)"; })
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("opacity", 0)
        .transition().ease("cubic-out").duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; });

      //exit
      currentSelection.exit()
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .transition().ease("cubic-out").duration(500)
        .attr("opacity", 0)
        .remove();

      currentSelection = paths.selectAll(".posArea")
        .data(makeQuartileObjectForKeyFanciness, function (d) {return d.type + d.which; });

      //update
      currentSelection
        .transition().duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; }) // TODO: delete this line?
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .transition().duration(500)
        .attr("transform", function (d, i) { return "translate(" + margins.left + ", 0)"; });

      //enter
      currentSelection.enter().append("area")
        .attr("class", "posArea")
        .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .attr("d", function (d, i) { return binData.levels[d.which][d.type + "d0"]; })
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", 0)"; })
        .style("stroke", function (d, i) { return binData.properties[d.type].colour; })
        .attr("opacity", 0)
        .transition().ease("cubic-out").duration(500)
        .attr("opacity", function (d) { return binData.properties[d.type].opacity; });

      //exit
      currentSelection.exit()
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .transition().ease("cubic-out").duration(500)
        .attr("opacity", 0)
        .remove();

      // Draw Axes
      xAxis = d3.svg.axis()
        .scale(xAxisScale).orient("bottom");
      //yAxis = d3.svg.axis().scale(yScale).orient("bottom");

      if (!xAxisContainer) { xAxisContainer = chart.append("svg:g"); }
      xAxisContainer.attr("class", "x axis")
        .attr("transform", "translate(" + margins.left + "," + height + ")");
      xAxisContainer.transition().duration(500).call(xAxis);

      //Draw the outline for the chart
      if (!frgrect) { frgrect = chart.append("svg:rect"); }
      frgrect
        .attr("width", realWidth)
        .attr("height", height)
        .attr("class", "frgrect")
        .style("fill", "rgba(0,0,0,0)")
        .style("stroke-width", 3)
        .attr("transform", "translate(" + margins.left + ", 0)")
        .style("stroke", "#000");

    });
  };


  // == Getters and Setters ==

  my.width = function (value) {
    if (!arguments.length) return width;
    width = value;
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

  my.outlinesOrNot = function (value) {
    if (!arguments.length) return outlinesOrNot;
    outlinesOrNot = value;
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

    var b = [Number(document.querySelector("#render-depth input:checked").value)];
    whichLevelsToRender = b;

    var b = document.querySelector("#render-method input:checked").value;
    interpolationMethod = b;
    return my;
  };

  return my;
};



//
//var width = 960,
//    height = 500;
//
//var svg = d3.select("body").append("svg")
//    .attr("width", width)
//    .attr("height", height);
//
//var d0 = "M0,0c100,0 0,100 100,100c100,0 0,-100 100,-100",
//    d1 = "M0,0c100,0 0,100 100,100c100,0 0,-100 100,-100c100,0 0,100 100,100";
//
//svg.append("path")
//    .attr("transform", "translate(180,150)scale(2,2)")
//    .attr("fill", "rgba(0,0,0,0)")
//    .attr("stroke", "#FF0")
//    .attr("d", d0)
//    .transition().duration(2000)
//    .attrTween("d", pathTween(d1, 4));
