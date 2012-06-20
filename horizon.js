var data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

console.log(data);

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

var mode = "offset",
    buffer = document.createElement("svg"),
    width = buffer.width = 300,
    height = buffer.height = 300,
    scale = d3.scale.linear().interpolate(d3.interpolateRound),
    colors = ["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"];

var chart = d3.select("#chart")

var x = d3.scale.linear().domain([0, data.length - 1]).range [0, width],
    y = d3.scale.linear().domain([0, d3.max(data)]).range [height, 0],
    duration = 1500,
    delay = 500;

//var area = d3.svg.area()
//    .interpolate("basis")
//    .x(function (d, i) { return i; })
//    .y(function (d) { return d; });

//area.y0(50);

chart.attr("width", width)
  .attr("height", height);

chart.selectAll('path.line')
    .data([data])
  .enter().append("svg:path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "maroon")
    .attr("stroke-width", 2)
    .attr("d", d3.svg.line()
//      .x(function(d) { return x(d.date); })
//      .y(function(d) { return y(d.price); })
//        .x(function(d) { return x(d); })
//        .y(function(d) { return y(d); }));
    );

var shmeu = d3.svg.line().x(function (d) { return d; });

//    .attr("d", d3.svg.line()
//        .x(data)
//        .y(y));
//

//chart.selectAll(".area")
//    .data(data)
//  .enter().insert("svg:path", ".line")
//    .attr("class", "area")
//    .attr("d", area(data))
//    .style("fill", "#f0f")
//    .style("fill-opacity", 1e-6);


//selection.each(function (d, i) {
//  var that = this,
//      colors_ = typeof colors === "function" ? colors.call(that, d, i) : colors,
//      start = -Infinity,
//      m = colors_.length >> 1,
//      canvas = d3.select(that).select("svg"),
//      ready;

//  for (var j = 0; j < m; ++j) {
//    canvas.fillStyle = colors_[m + j];
//
//    var y0 = (j - m + 1) * height;
//    scale.range([m + height + y0, y0]);
//    y0 = scale(0);
//
//    for (var i = 0, n = width, y1; i < n; ++i) {
//      y1 = metric_.valueAt(i);
//      if (y1 <= 0) { negative = true; continue; }
//      canvas.fillRect(i, y1 = scale(y1), 1, y0 - y1);
//    }
//  }

//  canvas.restore();
//})
