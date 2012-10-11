// TODO:
//      data on the far right is being useless. Can we change this?
//      think about using a moving average instead of binning ???
//      !! get data to always be at the back. I think it has something to do with the mega data object trickery. It might need some sorting. :)
//      - nope. it has to do with updates not killing and re-making objects. this is normal I guess.
//      - possible solution is to make it always on top, but with transparency

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
  var flatLined0; // a useful average line for interpolation purposes

  var chart;
  var paths;

  var slctn; // Save the selection so that my.update() works.


  var my = function (selection) {
    my.setSelectedLines();
    slctn = selection; // Saving the selection so that my.update() works.

    realWidth = width - margins.right - margins.left;

    selection.each(function (data) {

      var binData = {
        keys : ['averages', 'maxes', 'mins'],
        rawData : {
          data  : new Array(),
          d0    : new Array(),
          colour: '#BBB'
        },
        averages: {
          data  : new Array(),
          d0    : new Array(),
          colour: '#F00',
          func  : function (a, b) { return (a+b)/2; }
        },
        maxes : {
          data  : new Array(),
          d0    : new Array(),
          colour: '#0F0',
          func  : function (a, b) { return d3.max([a, b]); }
        },
        mins : {
          data  : new Array(),
          d0    : new Array(),
          colour: '#00F',
          func  : function (a, b) { return d3.min([a, b]); }
        },
      };

      binData.rawData.data[0] = data;


      var binTheDataWithFunction = function (datas, func) {
        var bDat = new Array();
        var i = 0;
        for(i = 0; i < datas.length; i = i + 2){
          if (i % 2 == 0) {
            if (datas[i+1]){
              bDat.push( func( datas[i], datas[i+1]));
            }else{
              bDat.push( datas[i] );
            }
          }else{
            // do nothing;
          }
        }
        return bDat;
      }


      // populate the binned datas (binData):
      var j = 0;
      for (var key in binData['keys']){ // for each of 'average', 'max', 'min'
        binData[binData.keys[key]]['data'][0] = data;

        //TODO: refactor this type of thing so it's more like function(binData[binData.keys[key]]), so we don't have to keep tying that out a bunch of times. :)
        for (j = 1; j < howManyBinLevels; j++){ // for each bin level
          binData[binData.keys[key]]['data'][j] = binTheDataWithFunction(binData[binData.keys[key]]['data'][j-1], binData[binData.keys[key]]['func']);
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

      flatLined0 = d3.svg.line()
        .x(function (d, i) { return xScale(i); })
        .y(function (d, i) { return d3.avg(binData.rawData.data[0]); })
        .interpolate("linear");

      binData.rawData.d0[0] = d3.svg.line()
        .x(function (d, i) { return xScale(i); })
        .y(function (d, i) { return yScale(binData.rawData.data[0][i]); })
        .interpolate(interpolationMethod)(binData.rawData.data[0]);

      for (var key in binData['keys']){ // for each of 'average', 'max', 'min'
        var j = 0;

        binData[binData['keys'][key]].d0[0] = binData['rawData'].d0[0];

        for (j = 1; j < howManyBinLevels; j++){ // for each level of binning
          binData[binData['keys'][ key ]].d0[j] = d3.svg.line()
            .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
            .y(function (d, i) { return yScale(binData[binData.keys[key]].data[j][i]); })
            .interpolate(interpolationMethod )(binData[binData.keys[key]].data[j]);
        }
      }


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


      // The following function returns something which looks like this:
      // [
      //   {type: 'rawData',     which: 0}, <-- this one is for the raw data
      //   {type: 'averages', which: 2},
      //   {type: 'mins',     which: 2},
      //   {type: 'maxes',    which: 2},
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
        for (var key in binData['keys']){ // for each of 'average', 'max', 'min'
          if (whichLinesToRender.indexOf(binData.keys[key]) > -1){
            for (j = 0; j < howManyBinLevels; j++) {
              if (whichLevelsToRender.indexOf(j) > -1){
                resultArray.push({
                  type: binData.keys[key],
                  which: j
                });
              }
            }
          }
        }

        return resultArray;
      };

      //Make and render the Positive curves.
      currentSelection = paths.selectAll(".posPath")
        .data(makeDataObjectForKeyFanciness(), function (d) {return d.type + d.which; });

      //update
      currentSelection
        .transition().duration(500)
        .attr("opacity", 1)
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", function (d, i) { return binData[d.type].colour; })
        .attr("d", function (d, i) { return binData[d.type].d0[d.which]; })
        .transition().duration(500)
        .attr("transform", function (d, i) { return "translate(" + margins.left + ", 0)"; });

      //enter
      currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) {return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .attr("d", function (d, i) { return binData[d.type].d0[d.which]; })
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", 0)"; })
        .style("stroke", function (d, i) { return binData[d.type].colour; })
        .attr("opacity", 0)
        .transition().ease("cubic-out").duration(500)
        .attr("opacity", 1);

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
  }


  // == Getters and Setters ==

  my.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return my;
  }

  my.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  }

  my.howManyBinLevels = function (value) {
    if (!arguments.length) return howManyBinLevels ;
    howManyBinLevels = value;
    return my;
  }

  my.whichLevelsToRender = function (value) {
    if (!arguments.length) return whichLevelsToRender  ;
    whichLevelsToRender = value;
    return my;
  }

  my.whichLinesToRender  = function (value) {
    if (!arguments.length) return whichLinesToRender   ;
    whichLinesToRender   = value;
    return my;
  }

  my.outlinesOrNot = function (value) {
    if (!arguments.length) return outlinesOrNot;
    outlinesOrNot = value;
    return my;
  }

  my.zoomout = function () {
    xScale.domain([0, xScale.domain()[1] * 2]); // TODO: modify a constant instead? That way we can re-do each domain each time without worrying or hacking around.
    xAxisScale.domain([0, xAxisScale.domain()[1] * 2]);
    return my;
  }

  my.zoomin = function () {
    xScale.domain([0, xScale.domain()[1] / 2]);
    xAxisScale.domain([0, xAxisScale.domain()[1] / 2]);
    return my;
  }

  my.zoom = function () {
    xAxisScale.domain(xScale.domain());
    xAxisContainer.call(xAxis);
    my.update();
  }

  my.update = function () {
    my(slctn);
  }

  my.setSelectedLines = function () {
    var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), function (checkbox) { return checkbox.value;} );
    whichLinesToRender = a;

    var b = [Number(document.querySelector("#render-depth input:checked").value)];
    whichLevelsToRender = b;

    var b = document.querySelector("#render-method input:checked").value;
    interpolationMethod = b;
    return my;
  }

  return my;
}
