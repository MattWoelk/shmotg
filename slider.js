/* Usage: TODO
* var mySlider = slider({width: 960, height: 500, container: "#loader_container", id: "loader"});
* mySlider();
*/

// TODO:
// - The height of the boxes should change depending on
//   how many we want to be visible at a time, which is
//   based on how many levels we want available to choose

function slider(config) {
    return function() {
        // {{{ Set Defaults
        var d = function(first, second) {
            return config[first] ? config[first] : second;
        }

        var boxSize        = d('boxSize',         30);
        var width          = d('width',           50);
        var height         = d('height',          150);
        var numberOfLevels = d('numberOfLevels',  35);
        var id             = d('id',              "slider");
        var container      = d('container',       "body");
        // Set Defaults }}}

        // {{{ VARIABLES
        var side_margin = (width - boxSize) / 2.0;

        var radius = Math.min(width, height) / 2;
        var tau = 2 * Math.PI;

        var arc = d3.svg.arc()
            .innerRadius(radius*0.5)
            .outerRadius(radius*0.9)
            .startAngle(0);

        var svg = d3.select(container).append("svg")
            .attr("id", id)
            .attr("width", width)
            .attr("height", height);
        // VARIABLES }}}

        // {{{ TOP AND BOTTOM LINES
        var line_top_data = [ {x: 0,     y: 0},
                              {x: width, y: 0} ];

        var line_bottom_data = [ {x: 0,     y: height},
                                 {x: width, y: height} ];

        var line_left_data = [ {x: side_margin, y: 0},
                               {x: side_margin, y: height}];

        var line_right_data = [ {x: width - side_margin, y: 0},
                                {x: width - side_margin, y: height}];

        var line = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        var line_top = svg.append("path")
            .attr("d", line(line_top_data))
            .attr("class", "slider_outlines");

        var line_bottom = svg.append("path")
            .attr("d", line(line_bottom_data))
            .attr("class", "slider_outlines");

        var line_left = svg.append("path")
            .attr("d", line(line_left_data))
            .attr("class", "slider_outlines");

        var line_right = svg.append("path")
            .attr("d", line(line_right_data))
            .attr("class", "slider_outlines");
        // TOP AND BOTTOM LINES }}}

        // {{{ CLIPPING
        var defclip = svg.insert("defs").append("clipPath").attr("id", "clip" + id).append("rect")
            .attr("width", boxSize)
            .attr("transform", "translate(" + side_margin + ", " + 0 + ")")
            .attr("height", height);

        // TODO: pathArea.attr("clip-path", "url(#clip" + sensorType+sensorNumber + ")")
        // CLIPPING }}}

        var slide_region = svg.append("g")
            .attr("clip-path", "url(#clip" + id + ")")
            .append("g") // another 'g' so that the clip doesn't move with the slide_region
            .attr("id", "slide_region" + id)
            .attr("class", "slide_region")

        var stagnant = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        slide_dat_applied = slide_region.selectAll("path")
            .data(d3.range(12))
        slide_enter = slide_dat_applied.enter()
        slide_enter.append("circle")
            .attr("cx", width/2)
            .attr("cy", function (d,i) { return i*boxSize; })
            .attr("r", boxSize/2)
        //slide_enter.append("circle")
        //    .attr("cx", width/2 - 5)
        //    .attr("cy", function (d,i) { return i*boxSize; })
        //    .attr("r", boxSize/2)
            //.enter().append("path")
            //    .attr("d", line({x: side_margin, y: boxSize}, {x: width - side_margin, y: boxSize}));
            //.attr("d", function (d, i) { return line({x: side_margin, y: boxSize*i}, {x: width - side_margin, y: boxSize*i}); });

        var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove);

        slide_region.call(drag);

        function dragmove() {
            //var dragTarget = d3.select(this);
            var dragTarget = d3.select("#slide_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            dragTarget.attr("transform", "translate(" + curTrans[0] + "," + (curTrans[1] + d3.event.dy) + ")")
        }

        //slide_region.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom))
        // TODO: chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));

        // d3.range(12); // integers from 0 through 12

    };
}

/* vim: set foldmethod=marker: */
