/* Usage: TODO: this is wrong
* var mySlider = slider({width: 960, height: 500, id: "loader"});
* mySlider();
*/

// {{{ TODO:
// - The height of the boxes should change depending on
//   how many we want to be visible at a time, which is
//   based on how many levels we want available to choose
// TODO }}}

(function () {

slider = function () {
    // {{{ Set Defaults
    var boxSize        = 30;
    var width          = 90;
    var height         = 140;
    var numberOfLevels = 12;
    var id             = "_id";
    var side_margin    = 0;

    var changeCallBack = function () {};
    var slctn; // Save the selection so that my.update() works.
    var slide_region;
    var handle_region;
    var handle_lines;
    var svg;
    var defclip;
    var line;
    var handleClip;
    var handle;

    var handlePosition = 0;//boxSize*2;
    var scrollPosition = 0;

    var surrounding_lines;
    var line_bottom;
    var line_left;
    var line_right;
    var line_top;

    var avoidChangeCallBack; // TODO: make this not required.
    // Set Defaults }}}

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

    var onclick = function() {
        if (d3.event.defaultPrevented) return; // click suppressed
        d3.select(this).classed("hover", false);
        d3.select(this).classed("mousedown", false);
        // TODO: set as selected and trigger stuff
        var which_box = this.__data__;
        var newPos = (which_box * boxSize) + scrollPosition;
        my.handlePosition(newPos).update();
    }
    // EVENTS }}}

    // {{{ HELPER FUNCTIONS
    function highlightSliderElement() {
        var locationOfHandle = d3.transform(handle_region.attr("transform")).translate[1] + (boxSize/2);
        var locationOfSlider = d3.transform(slide_region.attr("transform")).translate[1];
        var beingPointedTo = Math.floor((locationOfHandle - locationOfSlider) / boxSize); // level being pointed to
        changeCallBack(currentScrollPosition(), beingPointedTo, avoidChangeCallBack);
        d3.selectAll(".slider_boxes")
            .classed("highlighted", function (d, i) { return i == beingPointedTo; });
    }

    function currentHandlePosition () {
        var dragTarget = handle_region;
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        return curTrans[1];
    }

    function currentScrollPosition () {
        var dragTarget = slide_region;
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        return curTrans[1];
    }

    function dragSlider() {
        var adjustment = d3.event.dy;
        var dragTarget = slide_region;
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        var finalX = curTrans[0];
        var finalY = Math.max(-numberOfLevels*boxSize + height, Math.min(0, curTrans[1] + adjustment));
        dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")

        highlightSliderElement();
    }

    function dragHandle(han) {
        console.log(han);
        var adjustment = d3.event.dy;
        var dragTarget = handle_region;
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        var finalX = curTrans[0];
        var finalY = Math.min(height - boxSize, Math.max(0, curTrans[1] + adjustment));
        handlePosition = finalY;
        console.log(handlePosition, d3.event.y);
        dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")")

        highlightSliderElement();
    }

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

    var drawHandle = function (top, bot, dist) {
        dat = [ {x: boxSize + side_margin, y: top},
                {x: boxSize + side_margin + dist, y: 0},
                {x: boxSize + side_margin + dist + boxSize, y: 0},
                {x: boxSize + side_margin + dist + boxSize, y: 0+boxSize},
                {x: boxSize + side_margin + dist, y: 0+boxSize},
                {x: boxSize + side_margin, y: bot} ];
        return function () {
            return d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("linear")(dat);
        }
    }

    var drawDragLines = function (d, i) {
        dat = [ {x: (1/3)*boxSize, y: ((i+2)/6)*boxSize},
                {x: (2/3)*boxSize, y: ((i+2)/6)*boxSize} ];
        return d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate("linear")(dat);
    }

    // HELPER FUNCTIONS }}}


    function my (g, av) {
        slctn = g; // Saving the selection so that my.update() works.
        avoidChangeCallBack = av;

        g.each(function(d, i) {
            var g = d3.select(this);

            // {{{ VARIABLES
            svg = svg ? svg : g.append("svg");
            svg
                .attr("width", width)
                .attr("height", height);
            // VARIABLES }}}

            // {{{ CLIPPING
            defclip = defclip ? defclip : svg.insert("defs").append("clipPath").attr("id", "clip" + id).append("rect");
            defclip
                .attr("width", boxSize)
                .attr("transform", "translate(" + side_margin + ", " + 0 + ")")
                .attr("height", height);
            // CLIPPING }}}

            // {{{ SLIDER
            slide_region = slide_region ? slide_region : svg.append("g")
                .attr("id", "slide_container" + id)
                .attr("clip-path", "url(#clip" + id + ")")
                .append("g") // another 'g' so that the clip doesn't move with the slide_region
                .attr("id", "slide_region" + id)
                .attr("class", "slide_region")

            slide_dat_applied = slide_region.selectAll("g")
                .data(d3.range(numberOfLevels));
            slide_enter = slide_dat_applied.enter().append("g");
            slide_enter.append("path")
                .attr("d", drawBox)
                .on("mouseover", onhover)
                .on("mouseout", onoff)
                .on("mousedown", ondown)
                .on("click", onclick)
                //.on("mousewheel", onscroll)
                .attr("class", "slider_boxes");
            slide_enter.append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("x", function (d) { return side_margin + (boxSize / 2.0); })
                .attr("y", function (d, i) { return (i+1)*boxSize - (boxSize/2); })
                .text(function (d, i) { return i; })
                .attr("class", "slider_text");
            slide_dat_applied.exit()
                .remove();
            // SLIDER }}}

            // {{{ SURROUNDING LINES
            surrounding_lines = surrounding_lines ? surrounding_lines : svg.append("g")
                .attr("id", "surrounding_lines" + id);

            var line_top_data = [ {x: 0,     y: 0},
                                  {x: boxSize + (2*side_margin), y: 0} ];

            var line_bottom_data = [ {x: 0,     y: height},
                                     {x: boxSize + (2*side_margin), y: height} ];

            var line_left_data = [ {x: side_margin, y: 0},
                                   {x: side_margin, y: height}];

            var line_right_data = [ {x: boxSize + side_margin, y: 0},
                                    {x: boxSize + side_margin, y: height}];

            line = line ? line : d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate("linear");

            line_top = line_top ? line_top : surrounding_lines.append("path")
                .attr("class", "slider_outlines");
            line_top
                .attr("d", line(line_top_data));

            line_bottom = line_bottom ? line_bottom : surrounding_lines.append("path")
                .attr("class", "slider_outlines");
            line_bottom
                .attr("d", line(line_bottom_data));

            line_left = line_left ? line_left : surrounding_lines.append("path")
                .attr("class", "slider_outlines");
            line_left
                .attr("d", line(line_left_data));

            line_right = line_right ? line_right : surrounding_lines.append("path")
                .attr("class", "slider_outlines");
            line_right
                .attr("d", line(line_right_data));
            // SURROUNDING LINES }}}

            // {{{ HANDLE
            handle_region = handle_region ? handle_region : svg.append("g")
                .attr("id", "handle_region" + id)
                .attr("class", "handle_region");
            handle_region
                .attr("transform", "translate(0," + handlePosition + ")");

            // TODO: make top and bottom dynamic
            var pointer_top = Math.max(0, boxSize/2);
            var pointer_bottom = Math.min(height, boxSize/2);
            var handle_distance = boxSize/2;

            handleClip = handleClip ? handleClip : handle_region.append("clipPath");
            handleClip
                .attr("id", "clip-handle" + id)
                .append("path")
                .attr("d", drawHandle(pointer_top, pointer_bottom, handle_distance))

            handle = handle ? handle : handle_region.append("path");
            handle
                .attr("d", drawHandle(pointer_top, pointer_bottom, handle_distance))
                //.on("mouseover", onhover)
                //.on("mouseout", onoff)
                //.on("mousedown", ondown)
                //.on("click", onclick)
                .attr("id", "handle" + id)
                .attr("clip-path", "url(#clip-handle" + id + ")")
                .attr("class", "handle");

            handle_lines = handle_lines ? handle_lines : handle_region.append("g").attr("id", "dragLines" + id)
            handle_lines.selectAll("path").data([0, 1, 2])
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


            // DRAGGING }}}

            highlightSliderElement();
        });
        d3.timer.flush();
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

    my.changeCallBack = function (value) {
        if (!arguments.length) return changeCallBack;
        changeCallBack = value;
        return my;
    }

    my.pastExtents = function (val) {
        // return true if we are out of bounds
        if (val < height - boxSize*numberOfLevels) {
            return true;
        } else if (val > 0) {
            return true;
        } else {
            return false;
        }
        var scrl = d3.min([0, d3.max([height - boxSize*numberOfLevels, value])]);
    }

    my.scrollPosition = function (value) {
        if (!arguments.length) return scrollPosition;
        if (value === scrollPosition) { return my; }
        scrollPosition = d3.min([0, d3.max([height - boxSize*numberOfLevels, value])]);
        var dragTarget = d3.select("#slide_region" + id);
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        var finalX = curTrans[0];
        dragTarget.attr("transform", "translate(" + curTrans[0] + "," + scrollPosition + ")")
        return my;
    }

    my.handlePosition = function (value) {
        if (!arguments.length) return handlePosition;
        handlePosition = Math.max(0, Math.min(height - boxSize, value));//d3.min([0, d3.max([height - boxSize, value])]);
        return my;
    }

    my.highlightSliderElement = function () {
        highlightSliderElement();
    }

    my.update = function (avoidChangeCallBack) {
        if (avoidChangeCallBack) {
            my(slctn, true);
        }
        my(slctn);
    };

    // GETTERS AND SETTERS }}}

    return my;
}

})();

/* vim: set foldmethod=marker: */
