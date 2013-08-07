/* Usage: TODO
* var mySlider = slider({width: 960, height: 500, container: "#loader_container", id: "loader"});
* mySlider();
*/

// {{{ TODO:
// - The height of the boxes should change depending on
//   how many we want to be visible at a time, which is
//   based on how many levels we want available to choose
// TODO }}}

function slider(container_in, id_in) {
    // {{{ Set Defaults
    var boxSize        = 30;
    var width          = 90;
    var height         = 140;
    var numberOfLevels = 12;
    var id             = id_in ? id_in : "slider";
    var container      = container_in ? container_in : "body";
    var defaultYValue  = boxSize*2;

    var changeCallBack = function () {};
    // Set Defaults }}}

    var my = function () {
        // {{{ VARIABLES
        var side_margin = boxSize / 2;
        side_margin = 0; // looks nicer without the extra lines

        var svg = d3.select("#"+id)
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

        var ondown = function(e) {
            d3.select(this).classed("hover", false);
            d3.select(this).classed("mousedown", true);
            if (e.preventDefault) {
                e.preventDefault(); // So Chrome doesn't change the cursor to be text-select
            }
            e.returnValue = false;
        }

        var onscroll = function(e) {
            console.log(e);
            if (e.preventDefault) {
                console.log("PREVENTING");
                e.preventDefault(); // So Chrome doesn't change the cursor to be text-select
            }
            e.returnValue = false;
            d3.select(this).classed("hover", false);
            d3.select(this).classed("mousedown", false);
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
            dat = [ {x: side_margin + boxSize,  y: i*boxSize},
                    {x: side_margin,            y: i*boxSize},
                    {x: side_margin,            y: (i+1)*boxSize},
                    {x: side_margin + boxSize,  y: (i+1)*boxSize} ];
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
            .attr("class", "slider_boxes");
        slide_enter.append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("x", function (d) { return side_margin + (boxSize / 2.0); })
            .attr("y", function (d, i) { return (i+1)*boxSize - (boxSize/2); })
            .text(function (d, i) { return i; })
            .attr("class", "slider_text");
        // SLIDER }}}

        // {{{ SURROUNDING LINES
        var line_top_data = [ {x: 0,     y: 0},
                              {x: boxSize + (2*side_margin), y: 0} ];

        var line_bottom_data = [ {x: 0,     y: height},
                                 {x: boxSize + (2*side_margin), y: height} ];

        var line_left_data = [ {x: side_margin, y: 0},
                               {x: side_margin, y: height}];

        var line_right_data = [ {x: boxSize + side_margin, y: 0},
                                {x: boxSize + side_margin, y: height}];

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
            .attr("transform", "translate(0," + defaultYValue + ")")

        // TODO: make top and bottom dynamic
        var pointer_top = Math.max(0, boxSize/2);
        var pointer_bottom = Math.min(height, boxSize/2);
        var handle_distance = boxSize/2;

        var drawHandle = function () {
            dat = [ {x: boxSize + side_margin, y: pointer_top},
                    {x: boxSize + side_margin + handle_distance, y: 0},
                    {x: boxSize + side_margin + handle_distance + boxSize, y: 0},
                    {x: boxSize + side_margin + handle_distance + boxSize, y: 0+boxSize},
                    {x: boxSize + side_margin + handle_distance, y: 0+boxSize},
                    {x: boxSize + side_margin, y: pointer_bottom} ];
            return d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("linear")(dat);
        }

        var drawDragLines = function (d, i) {
            dat = [ {x: (1/3)*boxSize, y: ((i+2)/6)*boxSize},
                    {x: (2/3)*boxSize, y: ((i+2)/6)*boxSize} ];
            return d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("linear")(dat);
        }

        var handleClip = handle_region.append("clipPath")
            .attr("id", "clip-handle" + id)
            .append("path")
            .attr("d", drawHandle)

        var handle = handle_region.append("path")
            .attr("d", drawHandle)
            //.on("mouseover", onhover)
            //.on("mouseout", onoff)
            //.on("mousedown", ondown)
            //.on("click", onclick)
            .attr("id", "handle" + id)
            .attr("clip-path", "url(#clip-handle" + id + ")")
            .attr("class", "handle");

        handle_region.append("g").attr("id", "dragLines" + id).selectAll("path").data([0, 1, 2])
            .enter().append("path")
            .attr("d", drawDragLines)
            .attr("class", "dragLines")
            .attr("transform", "translate(" + (side_margin + boxSize + handle_distance) + "," + 0 + ")")
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

        function currentScrollPosition () {
            var dragTarget = d3.select("#slide_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            return curTrans[1];
        }

        function dragSlider(usethis) {
            var adjustment = usethis ? usethis : d3.event.dy;
            var dragTarget = d3.select("#slide_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            var finalX = curTrans[0];
            var finalY = Math.max(-numberOfLevels*boxSize + height, Math.min(0, curTrans[1] + adjustment));
            dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")

            highlightSliderElement();
        }

        function dragHandle(usethis) {
            var adjustment = usethis ? usethis : d3.event.dy;
            var dragTarget = d3.select("#handle_region" + id);
            var curTrans = d3.transform(dragTarget.attr("transform")).translate;
            var finalX = curTrans[0];
            var finalY = Math.min(height - boxSize, Math.max(0, curTrans[1] + adjustment));
            dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")

            highlightSliderElement();
        }

        // DRAGGING }}}

        // {{{ HIGHLIGHT SELECTED
        function highlightSliderElement() {
            var locationOfHandle = d3.transform(d3.select("#handle_region" + id).attr("transform")).translate[1] + (boxSize/2);
            var locationOfSlider = d3.transform(d3.select("#slide_region" + id).attr("transform")).translate[1];
            var beingPointedTo = Math.floor((locationOfHandle - locationOfSlider) / boxSize);
            changeCallBack(currentScrollPosition(), beingPointedTo);
            d3.selectAll(".slider_boxes")
                .classed("highlighted", function (d, i) { return i == beingPointedTo; });
        }

        highlightSliderElement();
        // HIGHLIGHT SELECTED}}}
    };

    // {{{ GETTERS AND SETTERS
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

    my.boxSize = function (value) {
        if (!arguments.length) return boxSize;
        boxSize = value;
        return my;
    }

    my.numberOfLevels = function (value) {
        if (!arguments.length) return numberOfLevels;
        numberOfLevels = value;
        return my;
    }

    my.container = function (value) {
        if (!arguments.length) return container;
        container = value;
        return my;
    }

    my.changeCallBack = function (value) {
        if (!arguments.length) return changeCallBack;
        changeCallBack = value;
        return my;
    }

    my.scrollPosition = function (value) {
        if (!arguments.length) return scrollPosition;
        scrollPosition = value;
        return my;
    }

    // GETTERS AND SETTERS }}}

    return my;
}

/* vim: set foldmethod=marker: */
