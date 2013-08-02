/* Usage: TODO
* var mySlider = slider({width: 960, height: 500, container: "#loader_container", id: "loader"});
* mySlider();
*/

// {{{ TODO:
// - The height of the boxes should change depending on
//   how many we want to be visible at a time, which is
//   based on how many levels we want available to choose
// TODO }}}

function slider(config) {
    return function() {
        // {{{ Set Defaults
        var d = function(first, second) {
            return config[first] ? config[first] : second;
        }

        var boxSize        = d('boxSize',         30);
        var width          = d('width',           105);
        var height         = d('height',          140);
        var numberOfLevels = d('numberOfLevels',  12);
        var id             = d('id',              "slider");
        var container      = d('container',       "body");
        // Set Defaults }}}

        // {{{ VARIABLES
        var side_margin = boxSize / 2;

        var svg = d3.select(container).append("svg")
            .attr("id", id)
            .attr("width", width)
            .attr("height", height);
        // VARIABLES }}}

        // {{{ CLIPPING
        var defclip = svg.insert("defs").append("clipPath").attr("id", "clip" + id).append("rect")
            .attr("width", boxSize)
            .attr("transform", "translate(" + side_margin + ", " + 0 + ")")
            .attr("height", height);
        // CLIPPING }}}

        // {{{ EVENTS
        var onhover = function() {
            d3.select(this).classed("hover", true);
            d3.select(this).classed("mousedown", false);
        }

        var onoff = function() {
            d3.select(this).classed("hover", false);
            d3.select(this).classed("mousedown", false);
        }

        var ondown = function() {
            d3.select(this).classed("hover", false);
            d3.select(this).classed("mousedown", true);
        }

        var onscroll = function() {
            dragSlider(d3.event.wheelDeltaY / 5);
        }

        var onclick = function() {
            d3.select(this).classed("hover", false);
            d3.select(this).classed("mousedown", false);
            // TODO: set as selected and trigger stuff
            console.log("CLICK");
        }
        // EVENTS }}}

        // {{{ SLIDER
        var slide_region = svg.append("g")
            .attr("clip-path", "url(#clip" + id + ")")
            .append("g") // another 'g' so that the clip doesn't move with the slide_region
            .attr("id", "slide_region" + id)
            .attr("class", "slide_region")

        var drawBox = function (d, i) {
            dat = [ {x: boxSize*2 - side_margin,  y: i*boxSize},
                    {x: side_margin,          y: i*boxSize},
                    {x: side_margin,          y: (i+1)*boxSize},
                    {x: boxSize*2 - side_margin,  y: (i+1)*boxSize} ];
            return d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("linear")(dat);
        }

        slide_dat_applied = slide_region.selectAll("path")
            .data(d3.range(numberOfLevels))
        slide_enter = slide_dat_applied.enter()
        slide_enter.append("path")
            .attr("d", drawBox)
            .on("mouseover", onhover)
            .on("mouseout", onoff)
            .on("mousedown", ondown)
            .on("click", onclick)
            .on("mousewheel", onscroll)
            .attr("class", "slider_outlines");
        slide_enter.append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("x", function (d) { return boxSize; })
            .attr("y", function (d, i) { return (i+1)*boxSize - (boxSize/2); })
            .text(function (d, i) { return i; })
            .attr("class", "slider_text");
        // SLIDER }}}

        // {{{ SURROUNDING LINES
        var line_top_data = [ {x: 0,     y: 0},
                              {x: boxSize*2, y: 0} ];

        var line_bottom_data = [ {x: 0,     y: height},
                                 {x: boxSize*2, y: height} ];

        var line_left_data = [ {x: side_margin, y: 0},
                               {x: side_margin, y: height}];

        var line_right_data = [ {x: boxSize*2 - side_margin, y: 0},
                                {x: boxSize*2 - side_margin, y: height}];

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
        // SURROUNDING LINES }}}

        // {{{ HANDLE
        var handle_region = svg.append("g")
            .attr("id", "handle_region" + id)
            .attr("class", "handle_region")

        // TODO: make top and bottom dynamic
        var pointer_top = Math.max(0, boxSize/2);
        var pointer_bottom = Math.min(height, boxSize/2);
        var handle_distance = boxSize/2;

        var drawHandle = function () {
            dat = [ {x: boxSize*2 - side_margin, y: pointer_top},
                    {x: boxSize*2 - side_margin + handle_distance, y: 0},
                    {x: boxSize*2 - side_margin + handle_distance + boxSize, y: 0},
                    {x: boxSize*2 - side_margin + handle_distance + boxSize, y: 0+boxSize},
                    {x: boxSize*2 - side_margin + handle_distance, y: 0+boxSize},
                    {x: boxSize*2 - side_margin, y: pointer_bottom} ];
            return d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("linear")(dat);
        }

        var handle = handle_region.append("path")
            .attr("d", drawHandle)
            //.on("mouseover", onhover)
            //.on("mouseout", onoff)
            //.on("mousedown", ondown)
            //.on("click", onclick)
            .attr("class", "handle");
        // HANDLE }}}

        // {{{ DRAGGING
        var dragS = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragSlider);

        var dragH = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragHandle);

        slide_region.call(dragS);
        handle_region.call(dragH);

        function dragSlider(usethis) {
            var adjustment = usethis ? usethis : d3.event.dy;
            var dragTarget = d3.select("#slide_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            var finalX = curTrans[0];
            var finalY = Math.max(-numberOfLevels*boxSize + height, Math.min(0, curTrans[1] + adjustment));
            dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")
        }

        function dragHandle(usethis) {
            var adjustment = usethis ? usethis : d3.event.dy;
            var dragTarget = d3.select("#handle_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            var finalX = curTrans[0];
            var finalY = Math.min(height - boxSize, Math.max(0, curTrans[1] + adjustment));
            dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")
        }

        // DRAGGING }}}

    };
}

/* vim: set foldmethod=marker: */
