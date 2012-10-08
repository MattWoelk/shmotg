// TODO:
//       store the binnedData, binnedMaxes, and binnedMins in a convenient object.

var lineChart = function () {
  var outlinesOrNot = true;

//  Array.prototype.clean = function(deleteValue) {
//    for (var i = 0; i < this.length; i++) {
//      if (this[i] == deleteValue) {
//        this.splice(i, 1);
//        i--;
//      }
//    }
//    return this;
//  };

  var margins = {top: 0, left: 25, bottom: 25, right: 25};

  var height = 50;
  var width = d3.max([window.innerWidth, screen.width]);

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


  var my = function (selection) {
    slctn = selection; // Save the selection so that my.update() works.

    realWidth = width - margins.right - margins.left;

    selection.each(function (data) {

      var binData = {
        keys : ['averages', 'maxes', 'mins'],
        averages : {
          data  : new Array(0),
          d0    : new Array(0),
          colour: '#F00',
          func  : function (a, b) { return (a+b)/2; }
        },
        maxes : {
          data  : new Array(0),
          d0    : new Array(0),
          colour: '#0F0',
          func  : function (a, b) { return d3.max([a, b]); }
        },
        mins : {
          data  : new Array(0),
          d0    : new Array(0),
          colour: '#00F',
          func  : function (a, b) { return d3.min([a, b]); }
        },
      };

//      console.log("iterate through keys");
//      for (var key in binData['keys']){
//        console.log(binData['keys'][ key ]);
//      }

      function binTheDataWithFunction (datas, func) {
        var bDat = new Array(0);
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

      function binTheData (datas) {
        var bDat = new Array(0);
        var bMax = new Array(0);
        var bMin = new Array(0);
        var i = 0;
        for(i = 0; i < datas.length; i = i + 2){
          if (i % 2 == 0) {
            if (datas[i+1]){
              bDat.push( ( datas[i] + datas[i+1] ) / 2 );
              bMax.push( d3.max([datas[i], datas[i+1]]) );
              bMin.push( d3.min([datas[i], datas[i+1]]) );
            }else{
              bDat.push( datas[i] );
              bMax.push( datas[i] );
              bMin.push( datas[i] );
            }
          }else{
            // do nothing;
          }
        } ///////// TODO: get this upper block working because it will be more efficient than what follows.
        return [bDat, bMax, bMin];
      }

      // populate the binned datas (binData):
      var j = 0;
      var howManyBinLevels = 4;
      for (var key in binData['keys']){ // for each of 'average', 'max', 'min'
        binData[binData.keys[key]]['data'][0] = data;

        //TODO: refactor this type of thing so it's more like function(binData[binData.keys[key]]), so we don't have to keep tying that out a bunch of times. :)
        for (j = 1; j < howManyBinLevels; j++){ // for each bin level
          binData[binData.keys[key]]['data'][j] = binTheDataWithFunction(binData[binData.keys[key]]['data'][j-1], binData[binData.keys[key]]['func']);
        }
      }

      //[binData['averages']['data'][0], binData['maxes']['data'][0], binData['mins']['data'][0]] = binTheData(data);

      console.log("after binning:");
      console.log(binData);

//      var j = 0;
//      for (j = 1; j < howManyBinLevels; j++) {
//        [binData['averages']['data'][j], binData['maxes']['data'][j], binData['mins']['data'][j]] = binTheData(binData['averages']['data'][j-1]);
//      }
//
//      console.log("populated:");
//      console.log(binData);

      //console.log("object keys:");
      //console.log(Object.keys(binData));

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


      //generate all d0s. (generate the lines paths)
      console.log("big complex part");

      for (var key in binData['keys']){ // for each of 'average', 'max', 'min'
        var j = 0;
        for (j = 1; j < howManyBinLevels; j++){ // for each level of binning
          console.log(binData['keys'][ key ]);

          binData[binData['keys'][ key ]].d0[j] = d3.svg.line()
            .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
            .y(function (d, i) { return yScale(binData[binData.keys[key]].data[j][i]); }) //TODO: get rid of this line ????????
            .interpolate("linear")(binData[binData.keys[key]].data[j]);
        }
      }

      console.log(binData);

      chart = d3.select(this); //TODO: Since we're using a .call(), "this" is the svg element.

      //Set it's container's dimensions
      selection
        .attr("height", height + margins.bottom)
        .attr("width", width);

      //Set the chart's dimensions
      chart
        .attr("width", width - 10) //TODO: magic numbers to get rid of scroll bars
        .attr("height", height + margins.bottom);

      //Allow dragging and zooming.
      //console.log("before: " + xScale.domain());
      chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));
      //selection.call(d3.behavior.zoom().x(xAxisScale));
      //console.log("after: " + xScale.domain());


      //Draw the background for the chart
      if (!bkgrect) { bkgrect = chart.insert("svg:rect"); }
      bkgrect
        //.transition().duration(1000)
        .attr("width", realWidth)
        .attr("height", height)
        .attr("class", "bkgrect")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .style("fill", "#FFF");

      //Make the clipPath (for cropping the paths)
      if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip").append("rect"); }
      defclip
        //.transition().duration(1000)
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
        .data(new Array(binData.keys.length));
      console.log("keys length");
      console.log(binData.keys.length);


      //update
      currentSelection
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", function (d, i) { return colours[i]; })
        //.transition().duration(1000)
        .attr("d", function (d, i) { return d0[i]; })
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", 0)"; });

      //enter
      currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) { return "rgba(0,0,0,0)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", function (d, i) { return colours[i]; })
        .attr("d", function (d, i) { return d0[i]; })
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", 0)"; });


      // Draw Axes
      xAxis = d3.svg.axis()
        .scale(xAxisScale).orient("bottom");
//      yAxis = d3.svg.axis().scale(yScale).orient("bottom");

      if (!xAxisContainer) { xAxisContainer = chart.append("svg:g"); }
      xAxisContainer.attr("class", "x axis")
        .attr("transform", "translate(" + margins.left + "," + height + ")");
      xAxisContainer.transition().duration(1000).call(xAxis);

      //Draw the outline for the chart
      if (!frgrect) { frgrect = chart.append("svg:rect"); }
      frgrect
        //.transition().duration(1000)
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
    //yAxisContainer.call(yAxis);
    my.update();
  }

  my.update = function () {
    my(slctn);
  }

  return my;
}
