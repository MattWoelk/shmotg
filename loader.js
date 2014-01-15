/* Usage:
* var myLoader = loader().width(25).height(25);
* d3.select("#loader_container").call(myLoader);
* myLoader();
*/

(function () {

var interpolateRotateString = function() {
    return d3.interpolateString("rotate(0)", "rotate(360)");
};


loader = function () {
    var tau = 2 * Math.PI;
    var innerRadiusRatio = 0.5;
    var outerRadiusRatio = 0.9;
    var width = 25;
    var height = 25;
    var isShowing = true;

    var slctn;
    var svg;
    var background;

    var spin = function(selection, duration) {
        if (isShowing){
            selection.transition()
            .ease("linear")
            .duration(duration)
            .attrTween("transform", interpolateRotateString);

            setTimeout(spin, duration, selection, duration);
        }
    };


    function my (g) {
        slctn = g;

        g.each(function(d, i) {
            var g = d3.select(this);

            svg = svg ? svg : g.append("svg")
                .attr("width", width)
                .attr("height", height);

            var radius = Math.min(width, height) / 2;

            var arc = d3.svg.arc()
                    .innerRadius(radius*innerRadiusRatio)
                    .outerRadius(radius*outerRadiusRatio)
                    .startAngle(0);

            var gElement = svg.append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            background = gElement.append("path")
                    .datum({endAngle: 0.33*tau})
                    .style("fill", "#4D4D4D")
                    .attr("d", arc)
                    .call(spin, 1500);
        });
        d3.timer.flush();
    }

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

    my.update = function () {
        my(slctn);
    };

    my.isShowing = function (value) {
        if (!arguments.length) return isShowing;
        if (value && !isShowing) {
            isShowing = true;
            spin(background, 1500); }
        isShowing = value;
        return my;
    };

    return my;
};

})();

/* vim: set foldmethod=marker: */
