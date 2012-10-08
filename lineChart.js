var lineChart = function () {
  var outlinesOrNot = true;

  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

  var margins = {top: 0, left: 25, bottom: 25, right: 25};
  //var colours = {avg: "#F00", max: "#0F0", min: "#00F"};
  var colours = ["#BBB", "#F00", "#0F0", "#00F" ];

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
  var d3area1;

  var slctn; // Save the selection so that my.update() works.


  var my = function (selection) {
    slctn = selection; // Save the selection so that my.update() works.

    realWidth = width - margins.right - margins.left;

    selection.each(function (data) {

      var binnedData = new Array(0);
      var binnedMaxes = new Array(0);
      var binnedMins = new Array(0);

      binnedData[0] = data;
      binnedMaxes[0] = data;
      binnedMins[0] = data;

      binnedData[1] = new Array(0);
      binnedMaxes[1] = new Array(0);
      binnedMins[1] = new Array(0);

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
      [ binnedData[1], binnedMaxes[1], binnedMins[1] ] = binTheData(data);


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


      if (!d3area1){ d3area1 = d3.svg.line(); }
      var d3areaArray = new Array(1);
      var d0 = new Array(1);
      var j = 0;
      for (j = 0; j < 2; j++) {
        d3areaArray[j] = d3.svg.line();
        d0[j] = d3areaArray[j]
          .x(function (d, i) { return xScale(i * Math.pow(2, j)); })
          .y(function (d, i) { return yScale(binnedData[j][i]); })
          .interpolate("linear")(binnedData[j]);
      }

      d3areaArray[2] = d3.svg.line();
      d0[2] = d3areaArray[2]
        .x(function (d, i) { return xScale(i * Math.pow(2, 1)); })
        .y(function (d, i) { return yScale(binnedMaxes[1][i]); })
        .interpolate("linear")(binnedMaxes[1]);

      d3areaArray[3] = d3.svg.line();
      d0[3] = d3areaArray[3]
        .x(function (d, i) { return xScale(i * Math.pow(2, 1)); })
        .y(function (d, i) { return yScale(binnedMins[1][i]); })
        .interpolate("linear")(binnedMins[1]);

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
        .data(new Array(d0.length));


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
