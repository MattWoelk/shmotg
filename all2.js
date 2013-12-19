// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name default.js
// ==/ClosureCompiler==

// ADD YOUR CODE HERE

shmotg = function() {
    var shmotg = {};
    shmotg.MAX_NUMBER_OF_BIN_LEVELS = 46; // TODO keep sync'd with ../binnedChart.js and scraper.js
    shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY = 32; // TODO MUST BE A POWER OF 2. The number of items per bin container
    shmotg.TIME_CONTEXT_VERTICAL_EACH = 25;
    return shmotg;
}();



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

    var slctn; // Save the selection so that my.update() works.
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
        slctn = g; // Saving the selection so that my.update() works.

        g.each(function(d, i) {
            var g = d3.select(this);

            // {{{ VARIABLES
            svg = svg ? svg : g.append("svg")
                .attr("width", width)
                .attr("height", height);
            // VARIABLES }}}

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

    // {{{ GETTERS AND SETTERS
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
    // GETTERS AND SETTERS }}}

    return my;
};

})();

/* vim: set foldmethod=marker: */








///////////////////////////////////////
// Custom Time Axis                  //
// ----------------                  //
// - Allows for smooth scrolling at  //
//   smaller-than-millisecond zoom   //
//   levels                          //
// - Provides time axis labeling     //
//   see customTimeFormat            //
// - Depends on underscore.js, d3.js //
///////////////////////////////////////
// USAGE
// ----------------
// xAxis = d3.svg.axis()
//   .tickFormat(msToCentury.TickFormat)
//   .tickValues(msToCentury.TickValues(xScale, width))
//   .tickSubdivide(msToCentury.TickSubDivide(xScale, width))
//   .scale(xScale).orient("bottom");
///////////////////////////////////////

msToCentury = function() {
    var msToCentury = {};

    var MIN_DISTANCE_BETWEEN_X_AXIS_LABELS = 100;

    function dt (num) {
        var newdate = new Date();
        newdate.setTime(num);
        return newdate;
    }

    function millisecond(val) {
        var newdate = new Date();
        newdate.setTime(roundDownToNearestTime(val, times.ms));
        return newdate;
    }

    function roundUpToNearestTime(val, tim) {
        return Math.ceil(val/tim) * tim;
    }

    function roundDownToNearestTime(val, tim) {
        return Math.floor(val/tim) * tim;
    }

    function getNumberOfDaysInCurrentMonth(dat) {
        var curmo = dat.getMonth();
        var addYear;
        if (( curmo + 1 ) / 12.0 >= 1.0) {
            // we rolled over to the next year
            addYear = dat.getFullYear() + 1;
        } else {
            addYear = dat.getFullYear();
        }
        var newdate = new Date(
            addYear,
            (curmo + 1) % 12,
            1,
            1,
            1,
            1,
            1);
            newdate = dt(newdate.getTime() - 4000000);
            return newdate.getDate();
    }

    var times = {
        ms: 1, //milliseconds
        s: 1000, //seconds
        m: 6e4, //minutes
        h: 36e5, //hours
        d: 864e5, //days
        // These are approximations:
        mo: 2592e6, //months
        y: 31536e6 //years
    };
    msToCentury.times = times;

    msToCentury.NumberOfDaysInYear = function (dat) {
        var newdateStart = new Date(dat.getFullYear()    , 0, 0);
        var newdateEnd   = new Date(dat.getFullYear() + 1, 0, 0);
        var diff = newdateEnd.getTime() - newdateStart.getTime();
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    // custom formatting for x axis time
    msToCentury.TickFormat = function (ti) {
        function timeFormat(formats) {
            return function(date) {
                var newdate = new Date();
                newdate.setTime(date);
                var i = formats.length - 1, f = formats[i];
                while (!f[1](newdate)) f = formats[--i];
                return f[0](newdate);
            };
        }

        var customTimeFormat = timeFormat([
            [ d3.time.format("%Y")    , function() { return true; }                 ],
            [ d3.time.format("%b")    , function(d) { return d.getMonth(); }        ],
            [ function (d) { return d3.time.format("%a %-d")(d).toLowerCase(); } ,
                function(d) { return d.getDate() != 1; }    ],
                [ d3.time.format("%H:00") , function(d) { return d.getHours(); }        ],
                [ d3.time.format("%H:%M") , function(d) { return d.getMinutes(); }      ],
                [ d3.time.format("%Ss")   , function(d) { return d.getSeconds(); }      ],
                [ d3.time.format("%Lms")  , function(d) { return d.getMilliseconds(); } ]
        ]);

        return function() { return customTimeFormat(ti); }();
    };

    function onScreenSizeOfLabels(millisecondsPerLabel, screenWidth, distanceBtwnLabels) {
        return millisecondsPerLabel * screenWidth / distanceBtwnLabels;
    }

    function findLevel(dom, wid) {
        var numInDom = function (num) {
            return num < dom[1] && num > dom[0];
        };

        for (var i = 0; i < rounding_scales.length; i++) {
            var ro = rounding_scales[i];
            var compr = onScreenSizeOfLabels(ro[0]*ro[1], wid, MIN_DISTANCE_BETWEEN_X_AXIS_LABELS);

            if (dom[1] - dom[0] <= compr ) {
                var result = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

                // filter this for only what is actually on-screen.
                result = _.filter(result, numInDom);

                return i;
            }
        }
        return -1;
    }

    msToCentury.TickValues = function (scal, wid) {
        var dom = scal.domain();

        var lvl = findLevel(dom, wid);

        // This should never occur if the zoom limits are correct
        if (lvl === -1) {
            return [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
        }

        var ro = rounding_scales[lvl];
        var rng = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

        // filter this for only what is actually on-screen.
        var result = _.filter(rng, function (num) {
            return num < dom[1] && num > dom[0];
        });

        return result;
    };

    msToCentury.SubTickValues = function (scal, wid) {
        var dom = scal.domain();

        var lvl = findLevel(dom, wid);

        // This should never occur if the zoom limits are correct
        if (lvl === -1) {
            return [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
        }

        var ro = rounding_scales[lvl];
        var rng = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

        var res = [];

        var numToInterpolate = msToCenturyTickSubDivide(scal, wid);

        var whichToGet = d3.range(1, numToInterpolate);

        var spaceBetweenMajorTicks = ro[0]*ro[1];

        for (var b = 0; b < whichToGet.length; b++) {
            res.push(rng[0] - whichToGet[b]*(spaceBetweenMajorTicks / numToInterpolate));
        }

        for (var i = 0; i < rng.length; i++) {
            for (var c = 0; c < whichToGet.length; c++) {
                res.push(rng[i] + whichToGet[c]*(spaceBetweenMajorTicks / numToInterpolate));
            }
        }

        // filter this for only what is actually on-screen.
        var result = _.filter(res, function (num) {
            return num < dom[1] && num > dom[0];
        });

        return result;
    };

    function msToCenturyTickSubDivide(scal, wid) {
        var dom = scal.domain();

        var lvl = findLevel(dom, wid);
        if (lvl === -1) { return 0; }

        var baseSize = rounding_scales[lvl][1];
        var tickSpace = rounding_ticks[baseSize];

        return (baseSize / tickSpace);
    }

    function makeTickRange(start, end, increment, incrementOf, baseFunc, smallInc, wid) {
        var startyear, endyear, curange;
        if ( incrementOf === d3.time.year ) {
            // For Years
            startyear = d3.time.year.floor(dt(start));
            endyear   = d3.time.year.ceil( dt(end  ));

            curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

            // Filter for proper increments
            curange = _.filter(curange, function (d) {
                return d % increment === 0;
            });

            curange = _.map(curange, function (d) { return (new Date(d, 0)).getTime(); });

            return curange;

        } else if ( incrementOf === d3.time.month ) {
            // For Months
            startyear = d3.time.year.floor(dt(start));
            endyear   = d3.time.year.ceil( dt(end  ));

            curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

            // for each year, get all of the months for it
            curange = _.map(curange, function (d) {
                return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (f) {
                    // For each month of the year
                    return (new Date(d, f)).getTime();
                });
            });
            curange = _.flatten(curange);

            curange = _.filter(curange, function (d, i) {
                // Filter for proper increments
                return i % increment === 0;
            });

            return curange;

        } else if (baseFunc === d3.time.month){
            // For Days
            startyear = d3.time.year.floor(dt(start));
            endyear   = d3.time.year.ceil( dt(end  ));

            curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

            // For each year, get all of the months for it
            curange = _.map(curange, function (year) {
                return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (month) {
                    // For each month of the year
                    var monthDays = getNumberOfDaysInCurrentMonth(new Date(year, month));
                    return _.map(d3.range(1, monthDays + 1), function (day) {
                        // For each day of the month
                        // Filter for proper increments
                        //   and remove ones which are too close
                        //   together near the ends of the months
                        if ((day - 1) % increment === 0 && monthDays + 1 - day >= increment ) {
                            return (new Date(year, month, day)).getTime();
                        } else {
                            return [];
                        }
                    });
                });
            });

            curange = _.flatten(curange);

            return curange;

        } else {
            // For everything smaller than days
            return d3.range( baseFunc.floor( dt(start) ).getTime(),
                            baseFunc.ceil(  dt( end ) ).getTime(),
                            roundUpToNearestTime(
                                smallInc*MIN_DISTANCE_BETWEEN_X_AXIS_LABELS/wid,
                                smallInc));
        }
    }

    // for major ticks every 'a' units,
    // have a minor tick every 'b' units
    // [a, b]
    // b should always be a factor of a
    var rounding_ticks = {
        1   : 0.5, // when we are showing 1 of something, display a tick every 0.5
        2   : 1  ,
        3   : 1  ,
        5   : 1  ,
        6   : 3  , // when we are showing 6 of something, display a tick every 3
        10  : 5  ,
        12  : 3  ,
        15  : 5  ,
        20  : 5  ,
        25  : 5  ,
        30  : 10 ,
        50  : 10 ,
        100 : 50 ,
        200 : 50 ,
        500 : 100
    };

    // Data object to help make custom axis' tick values
    // [ estimate size in milliseconds,
    //   how many to increment,
    //   precise time rounder for anchoring,
    //   precise time rounder ]
    var rounding_scales = [
        [ times.ms , 1   , d3.time.second , millisecond],
        [ times.ms , 2   , d3.time.second , millisecond],
        [ times.ms , 5   , d3.time.second , millisecond],
        [ times.ms , 10  , d3.time.second , millisecond],
        [ times.ms , 20  , d3.time.second , millisecond],
        [ times.ms , 50  , d3.time.second , millisecond],
        [ times.ms , 100 , d3.time.second , millisecond],
        [ times.ms , 200 , d3.time.second , millisecond],
        [ times.ms , 500 , d3.time.second , millisecond],
        [ times.s  , 1   , d3.time.minute , d3.time.second],
        [ times.s  , 2   , d3.time.minute , d3.time.second],
        [ times.s  , 5   , d3.time.minute , d3.time.second],
        [ times.s  , 15  , d3.time.minute , d3.time.second],
        [ times.s  , 30  , d3.time.minute , d3.time.second],
        [ times.m  , 1   , d3.time.hour   , d3.time.minute],
        [ times.m  , 2   , d3.time.hour   , d3.time.minute],
        [ times.m  , 5   , d3.time.hour   , d3.time.minute],
        [ times.m  , 15  , d3.time.hour   , d3.time.minute],
        [ times.m  , 30  , d3.time.hour   , d3.time.minute],
        [ times.h  , 1   , d3.time.day    , d3.time.hour],
        [ times.h  , 3   , d3.time.day    , d3.time.hour],
        [ times.h  , 6   , d3.time.day    , d3.time.hour],
        [ times.h  , 12  , d3.time.day    , d3.time.hour],
        [ times.d  , 1   , d3.time.month  , d3.time.day],
        [ times.d  , 2   , d3.time.month  , d3.time.day],
        [ times.d  , 5   , d3.time.month  , d3.time.day],
        [ times.d  , 10  , d3.time.month  , d3.time.day],
        [ times.d  , 15  , d3.time.month  , d3.time.day],
        [ times.mo , 1   , d3.time.year   , d3.time.month],
        [ times.mo , 2   , d3.time.year   , d3.time.month],
        [ times.mo , 3   , d3.time.year   , d3.time.month],
        [ times.mo , 6   , d3.time.year   , d3.time.month],
        [ times.mo , 12  , d3.time.year   , d3.time.month],
        [ times.y  , 1  , d3.time.year , d3.time.year],
        [ times.y  , 2  , d3.time.year , d3.time.year],
        [ times.y  , 5  , d3.time.year , d3.time.year],
        [ times.y  , 10 , d3.time.year , d3.time.year],
        [ times.y  , 25 , d3.time.year , d3.time.year],
        [ times.y  , 50 , d3.time.year , d3.time.year],
        [ times.y  , 100, d3.time.year , d3.time.year],
        [ times.y  , 100, d3.time.year , d3.time.year]
    ];
    return msToCentury;
}();






// This is binnedData. A convenient way of storing binned data

binnedData = function () {

    //{{{ VARIABLES
    var oneSample = 1000 / 200; // milliseconds per sample

    var bd = { // where all of the data is stored
        keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
        rawData : {
            levels: [] // stores all of the values for each level in an array of objects (shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY).
                        // with one key for each range of object, up to a maximum size
                        // example: [{ ms_key: [{val: 1.7, ms: ms_since_epoch}, {val: 2.3, ms: ms_since_epoch}] }, [etc.]]
                        //           ^-- a "bin container" -----------------------------------------------------^
        },
        average : {
            func   : function (a, b) { return (a+b)/2; },
            levels: []
        },
        maxes : {
            func   : function (a, b) { return d3.max([a,b]); },
            levels: []
        },
        mins : {
            func   : function (a, b) { return d3.min([a,b]); },
            levels: []
        },
        q1 : {
            func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
            levels: []
        },
        q3 : {
            func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: []
        },
        quartiles : {
            levels: []
        },
        missing : {
            levels: []
        },
        missingBox : {
            levels: []
        },
        loadingBox : {
            levels: []
        }
    }; // where everything is stored

    // VARIABLES }}}

    //{{{ HELPER METHODS

    // testing this function. It works.
    //console.log(combineWithoutDuplicates([{ms: 1}, {ms: 2}, {ms: 3, lvl: 5}, {ms: 4}],
    //                                     [{ms: 1}, {ms: 1}, {ms: 3}, {ms: 5}]));

    function sampleSize(lvl) {
        return Math.pow(2, lvl) * oneSample;
    }

    function combineWithoutDuplicates(arr1, arr2) {
        // ASSUMPTION: arr1 and arr2 are both sorted
        //             arr1 and arr2 are in the format: [{ms: _}, {ms: _}]
        // TODO: arr1 gets precedence. Return an array which has no duplicates in the 'ms' field.

        var uniques = []; // The values found in arr2 which were not in arr1
        var arr1Length = arr1.length;
        var arr1Index = 0;

        for (var i = 0; i < arr2.length; i++) {
            // For each element of arr2, go through arr1,
            // element by element, and see how their ms compare

            while (1) {
                if (arr1Index >= arr1Length) {
                    uniques.push(arr2[i]);
                    break;
                } // we've run out of arr1

                if (arr1[arr1Index].ms > arr2[i].ms) {
                    // If the next one is higher,
                    // add this one to the list,
                    // and move on to the next arr2 (don't increment)

                    uniques.push(arr2[i]);

                    //console.log("add them:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else if (arr1[arr1Index].ms === arr2[i].ms) {
                    // If the next one is the same,
                    // move on to the next arr2 (don't increment)

                    // Though, if one is NaN, then the other should be used.
                    if (isNaN(arr1[arr1Index].val)) {
                        arr1[arr1Index].val = arr2[i].val;
                    }

                    //console.log("dont add:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else {
                    // If the next one is lower than this one,
                    // increment and compare to the new one from arr1

                    //console.log("continue:", arr1[arr1Index].ms, arr2[i].ms);
                    arr1Index++;
                }
            }
        }

        return arr1.concat(uniques);
    }

    function getMSStartForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin container
        // [at this level] in which this ms would fit.


        var sizeOfTheBinContainerInMS = sampleSize(lvl) * shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY;

        return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
    }

    function isArray(a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    function getSurroundingBins (start, end, lvl) {
        // return all bin starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var binSize = Math.pow(2, lvl) * oneSample;

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
    }

    function getSurroundingBinContainers (start, end, lvl) {
        // return all bin container starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var binSize = my.binContainerSize(lvl);

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
    }

    function splitIntoBinsAtLevel (data, lvl) {
        // TODO: round level down to nearest maxNumberOfBins
        //       then separate the data out into a structure:
        //       { '0': [{ms: 3}, {ms: 4}]
        //         '5': [{ms: 5}, {ms: 9}]}
        //       This function is to be used when adding raw data
        // Assumption: data is ordered and continuous

        return _.groupBy(data, function (d) {
            return getMSStartForTimeAtLevel(d.ms, lvl);
        });
    }

    function rebin (range_to_rebin, level_to_rebin) {
        // for each level other than raw data level,
        //   for each key,
        //     bin the data from the lower level
        for (var j = level_to_rebin + 1; j < shmotg.MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
            for (var keyValue = 0; keyValue < bd.keys.length; keyValue++) { // for each of 'average', 'max', 'min', etc.
                var key = bd.keys[keyValue];

                // bin and store data from lower bin
                var newData = binTheDataWithFunction(bd, j-1, key, bd[key].func, range_to_rebin);

                if (newData.length === 0) {
                    continue; // Nothing to add; move along.
                }

                // TODO: filter out what is already in the old data, OR add that ability to addData();
                // Combine what was already there and what was just calculated
                // - What was already in this bin level gets precedence
                //   over what is being binned from the lower level

                my.addData(newData, key, j);

            } // for each key
        } // for each bin level
    }

    function combineFilteredBinContainerInformation (bin, lvl, key, range) {
        // Returns ALL data from any container which intersects the requested range
        // AKA:  Grabs ALL containers which line up with the containers of the
        //       one-higher level's intersection with this range

        // get lvl+1's range of containers for this range
        var upperLevelRange = [ // range until very end
            getMSStartForTimeAtLevel(range[0], lvl+1),
            getMSStartForTimeAtLevel(range[1], lvl+1) + my.binContainerSize(lvl+1)
        ];

        // get lvl range of containers for that range
        if (!upperLevelRange[0] || !upperLevelRange[1]) {
            //console.log(upperLevelRange[0], upperLevelRange[1]);
            return [];
        }
        var binsToBeCombined = getSurroundingBinContainers(upperLevelRange[0], upperLevelRange[1], lvl);

        var combo = [];
        for (var i in binsToBeCombined) {
            if (bin[lvl === 0 ? "rawData" : key].levels[lvl][binsToBeCombined[i]]){
                combo = combo.concat(bin[lvl === 0 ? "rawData" : key].levels[lvl][binsToBeCombined[i]]);
            }
        }

        return combo;
    }

    // Bin the data in a level into abstracted bins
    function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin) {
        var bDat = [];
        if (!bin[curLevel === 0 ? "rawData" : key].levels[curLevel]) {
            return bDat;
        }

        // Combine all data which is within range_to_rebin
        var combo = combineFilteredBinContainerInformation(bin, curLevel, key, range_to_rebin);
        var combo2 = [];

        // if we're calculating for quartiles, then we need the other quartile as well
        if (key === 'q1') {
            combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q3', range_to_rebin);
        } else if (key === 'q3'){
            combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q1', range_to_rebin);
        }

        // Use this new combined data instead of bin[key].levels[curLevel].length
        for(var i = 0; i < combo.length; i = i + 2){
            // If we are at a bad spot to begin a bin, decrement i by 1 and continue;
            var sampleIsAtModularLocation = atModularLocation(combo[i].ms, curLevel+1);
            var nextSampleExists = combo.length > i + 1;
            var nextSampleIsRightDistanceAway = nextSampleExists ?
                combo[i+1].ms - combo[i].ms === sampleSize(curLevel) :
                true;

            if (!sampleIsAtModularLocation || !nextSampleExists || !nextSampleIsRightDistanceAway) {
                // This is here so that both the server and client's bins start and end at the same place
                // no matter what range of data they have to work with.
                // we skip over values which are not at the beginning of a bin
                i = i - 1;
                continue;
            }

            if (combo[i+1]){
                var newdate = combo[i/*+1*/].ms;

                if (key === 'q1' || key === 'q3') {
                    bDat.push({ val:  func(
                                        combo[i].val,
                                        combo[i+1].val,
                                        combo2[i].val,
                                        combo2[i+1].val),
                                ms: newdate }); // This is messy and depends on a lot of things
                }else{
                    bDat.push( { val: func( combo[i].val,
                                            combo[i+1].val),
                                 ms: newdate });
                }
            }
        }
        return bDat;
    }

    function atModularLocation(ms, lvl) {
        // True if ms is at the beginning of a bin in level lvl.
        return ms % (Math.pow(2, lvl) * oneSample) === 0;
    }

    function getTwoLargest (array) {
        var arr = array.slice();
        var first = d3.max(arr);
        arr.splice(arr.indexOf(first),1);
        var second = d3.max(arr);
        return [first, second];
    }

    function average (array) {
        return d3.sum(array)/array.length;
    }

    function getTwoSmallest (array) {
        var arr = array.slice();
        var first = d3.min(arr);
        arr.splice(arr.indexOf(first),1);
        var second = d3.min(arr);
        return [first, second];
    }

    function combineAndSortArraysOfDateValObjects (arr1, arr2) {
        // Add the objects from arr2 (array) to arr1 (array)
        //   only if the object from arr2 has a ms value
        //   which no object in arr1 has.
        // AKA: arr1 gets precedence

        // concat them
        var result = combineWithoutDuplicates(arr1, arr2);

        // sort the result TODO: may not be required, as combineWithoutDuplicates gives a sorted result
        result.sort(function (a, b) { return a.ms - b.ms; });

        return result;
    }

    function inAButNotInB(arr1, arr2) {
        return _.filter(arr1, function (d) {
            return !_.contains(arr2, d);
        });
    }

    // HELPER METHODS }}}

    //{{{ INITIALIZATION (runs once)
    // INITIALIZATION }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    };

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addData = function (data, key, lvl) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        var splitData = splitIntoBinsAtLevel(data, lvl);

        for (var prop in splitData) {
            if (splitData.hasOwnProperty(prop)){
                // Create if we don't have:
                if (!bd[key].levels[lvl]) { bd[key].levels[lvl] = {}; }
                if (!bd[key].levels[lvl][prop]) { bd[key].levels[lvl][prop] = []; }

                // combine and put in bd
                bd[key].levels[lvl][prop] = combineAndSortArraysOfDateValObjects(bd[key].levels[lvl][prop], splitData[prop]);
            }
        }
    };

    my.addRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        var range = d3.extent(data, function (d) { return d.ms; });

        my.addData(data, 'rawData', 0);

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;

    };

    my.replaceRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // TODO TODO TODO: update for new bin containers
        var range = d3.extent(data, function (d) { return d.ms; });

        // make this level if it does not yet exist
        if (!bd.rawData.levels[0]) { bd.rawData.levels[0] = []; }

        bd.rawData.levels[0] = data;

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    };

    my.addBinnedData = function (bData, lvl, dontBin) {
        // only the level lvl will be stored
        // data must be in the form of the following example:
        // { average: {
        //     levels: [
        //       [{val: value_point, ms: ms_since_epoch},
        //        {val: value_point, ms: ms_since_epoch},
        //        {etc...}],
        //       [etc.]
        //     ],
        //   },
        //   q1: {
        //     levels: [
        //       [etc.]
        //     ],
        //   },
        //   etc: {},
        // }

        var lows = [];
        var highs = [];
        var keys = ['average', 'q1', 'q3', 'mins', 'maxes'];

        var justms = function(d) { return d.ms; };

        for (var i = 0; i < keys.length; i++) {
            if (bData[keys[i]] && bData[keys[i]].levels && bData[keys[i]].levels[lvl]) {
                var ext = d3.extent(bData[keys[i]].levels[lvl], justms);
                lows.push(ext[0]);
                highs.push(ext[1]);
            }
        }

        var range = [
                d3.min(lows),
                d3.max(highs)
        ];

        //var range = d3.extent(bData.average.levels[lvl], function (d) { return d.ms; }); // ASSUMPTION: average is always included

        for (var k = 0; k < bd.keys.length; k++) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];
            my.addData(bData[key].levels[lvl], key, lvl);
        } // for each of max_val, min_val, etc.

        if(!dontBin) {
            rebin(range, lvl);
        }

        return my;
    };

    my.replaceBinnedData = function(bData, lvl, dontBin) {
        // only the level lvl will be stored
        // data must be in the form of the following example:
        // { average: {
        //     levels: [
        //       [{val: value_point, ms: ms_since_epoch},
        //        {val: value_point, ms: ms_since_epoch},
        //        {etc...}],
        //       [etc.]
        //     ],
        //   },
        //   q1: {
        //     levels: [
        //       [etc.]
        //     ],
        //   },
        //   etc: {},
        // }

        // TODO TODO TODO: update for new bin containers

        var range = d3.extent(bData.average.levels[lvl], function (d) { return d.ms; }); // ASSUMPTION: average is always included

        for (var k = 0; k < bd.keys.length; k++) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];

            //if we don't have a lvl for this already, initialize one
            if (!bd[key].levels[lvl]) {
                bd[key].levels[lvl] = [];
            }

            if(bData[key].levels) {
                bd[key].levels[lvl] = bData[key].levels[lvl];
            }
        } // for each of max_val, min_val, etc.

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    };

    my.replaceAllData = function (bDat) {
        // Replace all data with what is given
        bd = bDat;
    };


    my.haveDataInRange = function(ms_range, level) {
        // Determine the number of samples which we should have in the given range.

        // TODO TODO TODO: update for new bin containers

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var datedRange = my.getDateRange([key], level, ms_range);

        if (datedRange.length === 0) {
            return false;
        }

        var firstSample = datedRange[0].ms;

        if (firstSample > ms_range[0] + sampleSize(level)) {
            return false;
        }

        var actualRange = ms_range[1] - firstSample;
        var numberWeShouldHave = Math.floor(actualRange / sampleSize(level));

        var numberWeHave = datedRange.length;

        return numberWeHave >= numberWeShouldHave;
    };

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // Return which bins which we are missing in the given range and level.
        // returns [[start, end],[start,end],...] ranges of required data

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var fir = Math.floor(ms_range[0] / (Math.pow(2, level) * oneSample));
        var las = Math.floor(ms_range[1] / (Math.pow(2, level) * oneSample));

        var normalizedRange = [ fir * Math.pow(2, level) * oneSample, (las + 1) * Math.pow(2, level) * oneSample ];
        var datedRange = my.getDateRange([key], level, normalizedRange);

        if (datedRange.length === 0) {
            // TODO: for the grey missing data boxes, should this return something different?
            if (samplesInsteadOfRanges) { return [ms_range[0]]; }
            return [ms_range];
        }

        var neededBins = _.range(normalizedRange[0], normalizedRange[1], sampleSize(level));
        neededBins.forEach(function (d) {
            d = d * Math.pow(2, level) * oneSample;
        });

        var missingSamples = inAButNotInB(neededBins, _.pluck(datedRange, 'ms'));
        missingSamples.total = datedRange.length;

        if(samplesInsteadOfRanges) { return missingSamples; }

        var missingRanges = [];

        _.each(missingSamples, function (d) {
            missingRanges.push([d, d + sampleSize(level)]);
            // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
        });

        return missingRanges; // form: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    };

    my.getExtentsForLvlKeysRange = function (lvl, keys, range) {
        return d3.extent(my.getDateRange(keys, lvl, range), function (d) { return d.val; });
    };

    my.getMin = function (lvl) {
        var lowestValue = 999999;
        var k = "";
        var justval = function (d) { return d.val; };

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        for (var key = 0; key < bd[k].levels[lvl].length; key++) {
            lowestValue = Math.min(d3.min(bd[k].levels[lvl][key], justval),
                                    lowestValue);
        }

        return lowestValue;
    };

    my.getMax = function (lvl) {
        var highestValue = -999999;
        var k = "";
        var justval = function (d) { return d.val; };

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        for (var key = 0; key < bd[k].levels[lvl].length; key++) {
            highestValue = Math.max(d3.max(bd[k].levels[lvl][key], justval),
                                    highestValue);
        }

        return highestValue;
    };

    my.getMinMS = function (lvl) {
        // pick the minimum bin (highest key) in bd level lvl
        // and ask for the lowest raw value
        var justms = function (d) { return d.ms; };
        var k = "";

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        var getMinOfArray = function (numArray) {
            return Math.min.apply(null, numArray);
        };

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.min(bd[k].levels[lvl][getMinOfArray(keys)], justms);
    };

    my.getMaxMS = function (lvl) {
        var justms = function (d) { return d.ms; };
        var k = "";

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        var getMaxOfArray = function (numArray) {
            return Math.max.apply(null, numArray);
        };

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.max(bd[k].levels[lvl][getMaxOfArray(keys)], justms);
    };

    my.getColor = function (key) {
        return bd[key].color;
    };

    my.getDash = function (key) {
        return bd[key].dash;
    };

    my.getOpacity = function (key) {
        return bd[key].opacity;
    };

    my.getAllInRange = function(lvl, range) {
        // return a bd-like data structure but only
        // with data in the following range and level
        // from all keys

        // initialize the data structure to be sent
        var theKeys = ["average", "q1", "q3", "mins", "maxes"];
        var send_req = {};

        for (var i = 0; i < theKeys.length; i++) {
            send_req[theKeys[i]] = {};
            send_req[theKeys[i]].levels = [];
            send_req[theKeys[i]].levels[lvl] = my.getDateRange([theKeys[i]], lvl, range);
        }

        return send_req;
    };

    my.getDateRangeWithMissingValues = function (key, lvl, range, extra) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // USE:
        // filter an array so that we don't render much more
        // than the required amount of line and area
        // missing values are NaN's

        // Send one extra value on the front and end of the range, no matter what

        var missings = my.missingBins(range, lvl, true);
        var binSize = my.binSize(lvl);

        var missingsObjs = missings.map(function (d) {
            return {ms: d, val: NaN};
        });

        var result = combineAndSortArraysOfDateValObjects(
                missingsObjs,
                my.getDateRange([key], lvl, [range[0]-binSize, range[1]+binSize])
                );

        // if we should add in an extra value before each NaN
        // so that everything looks nice for step-after interpolation
        if (extra) {
            var toEnd = result.length;
            for (var i = 1; i < toEnd; i++) {
                if (isNaN(result[i].val)) {
                    result.splice(i, 0, { ms: result[i].ms, val: result[i-1].val });
                    i++;
                    toEnd++;
                }
            }
        }

        return result;
    };

    my.getDateRange = function (keys, lvl, range) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // USE:
        // filter an array so that we don't render much more
        // than the required amount of line and area

        var result = [];
        var combineAll = function(n) {
            if(!bd[lvl === 0 ? "rawData" : key] || !bd[lvl === 0 ? "rawData" : key].levels[lvl]) { return; }
            var dat = bd[lvl === 0 ? "rawData" : key].levels[lvl][n];

            result = result.concat(_.filter(dat, function (d) {
                return d.ms <= range[1] && d.ms >= range[0];
            }));
        };

        // where to look for this data:
        var whichBinsToLookIn = getSurroundingBinContainers(range[0], range[1], lvl);

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            _.each(whichBinsToLookIn, combineAll);
        }

        // sort it
        result = result.sort(function (a, b) { return a.ms - b.ms; });

        return result;
    };

    my.removeAllLevelsBelow = function(LowestLevel) {
        //TODO
        for(var i = 0; i < LowestLevel; i++) {
            for(var k = 0; k < bd.keys.length; k++) {
                var key = bd.keys[k];
                //console.log("removing", key, i);
                bd[key].levels[i] = {};
            }
        }

        // remove rawData, too
        if (LowestLevel > 0) {
            //console.log("removing", "rawData", 0);
            bd.rawData.levels[0] = {};
        }

        //console.log("removing ;]");
    };

    my.importDataFromAnotherBinnedDataObject = function (otherBinnedData) {
        for (var k = 0; k < otherBinnedData.keys.length; k++) {
            var key = otherBinnedData.keys[k];
            // for each key in otherBinnedData

            for (var l = 0; l < shmotg.MAX_NUMBER_OF_BIN_LEVELS; l++) {
                // for each level

                if (!otherBinnedData[key].levels[l]) { continue; }

                for (var b = 0; b < otherBinnedData[key].levels[l].length; b++) {
                    // for each bin container

                    if (!bd[key].levels[l]) {
                        bd[key].levels[l] = {};
                    }

                    if (!bd[key].levels[l].hasOwnProperty(b)) {
                        // If we don't have it already, plunk it in
                       bd[key].levels[l][b] = otherBinnedData[key].levels[l][b];
                    } else {
                        // If we do, combine them.
                       bd[key].levels[l][b] = combineWithoutDuplicates(
                           bd[key].levels[l][b],
                           otherBinnedData[key].levels[l][b]);
                    }
                } // for each bin container
            } // for each level
        } // for each key
    };

    my.doToEachContainerInRange = function (range, level, func) {
        getSurroundingBinContainers(range[0], range[1], level).forEach(function (d) {
            func(d);
        });
    };

    // TODO: use this instead of manually doing it everywhere
    my.binSize = function (lvl) {
        return Math.pow(2, lvl) * oneSample;
    };

    my.oneSample = function (value) {
        if (!arguments.length) return oneSample;
        oneSample = value;
        return my;
    };

    my.binContainerSize = function (lvl) {
        return my.binSize(lvl) * shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY;
    };

    my.getSurroundingBinContainers = function (r0, r1, lvl) {
        return getSurroundingBinContainers(r0, r1, lvl);
    };

    my.getSurroundingBins = function (start, end, lvl) {
        return getSurroundingBins(start, end, lvl);
    };

    my.getBinContainerForMSAtLevel = function (ms, lvl) {
        return getMSStartForTimeAtLevel(ms, lvl);
    };

    my.getKeys = function () {
        return bd.keys.slice(0); // give a copy of the array
    };

    my.bd = function () {
        return bd;
    };

    my.combineAndSortArraysOfDateValObjects = function(a, b) {
        return combineAndSortArraysOfDateValObjects(a, b);
    };

    my.getChildBins = function(ms, lvl) {
        // TODO: Return an array of two bins of level lvl-1,
        //       which are the bins which are used to calculate
        //       the value for the bin at ms.
        var result = [ms];
        var siz = my.binSize(lvl-1);
        if (atModularLocation(ms, lvl)) {
            result.push(ms+siz);
        } else {
            result.push(ms-siz);
        }
        return result;
    };

    my.toString = function () {
        // Give bd as a string
        return JSON.stringify(bd);
    };

    my.rebinAll = function (range, lvl) {
        rebin(range, lvl);
    };

    // PUBLIC METHODS }}}

    return my;
};

/* vim: set foldmethod=marker: */





// This is multiData. It sources data from multiple binnedData objects instead of storing anything itself.

multiData = function (multTrueMinusFalse) {

    //{{{ VARIABLES
    var oneSample = 1000 / 200; // milliseconds per sample
    var parentBDs = [];
    var mult = multTrueMinusFalse;

    // VARIABLES }}}

    //{{{ HELPER METHODS

    // testing this function. It works.
    //console.log(combineWithoutDuplicates([{ms: 1}, {ms: 2}, {ms: 3, lvl: 5}, {ms: 4}],
    //                                     [{ms: 1}, {ms: 1}, {ms: 3}, {ms: 5}]));

    function sampleSize(lvl) {
        return Math.pow(2, lvl) * oneSample;
    }

    function combineWithoutDuplicates(arr1, arr2) {
        // ASSUMPTION: arr1 and arr2 are both sorted
        //             arr1 and arr2 are in the format: [{ms: _}, {ms: _}]
        // TODO: arr1 gets precedence. Return an array which has no duplicates in the 'ms' field.

        var uniques = []; // The values found in arr2 which were not in arr1
        var arr1Length = arr1.length;
        var arr1Index = 0;

        for (var i = 0; i < arr2.length; i++) {
            // For each element of arr2, go through arr1,
            // element by element, and see how their ms compare

            while (1) {
                if (arr1Index >= arr1Length) {
                    uniques.push(arr2[i]);
                    break;
                } // we've run out of arr1

                if (arr1[arr1Index].ms > arr2[i].ms) {
                    // If the next one is higher,
                    // add this one to the list,
                    // and move on to the next arr2 (don't increment)

                    uniques.push(arr2[i]);

                    //console.log("add them:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else if (arr1[arr1Index].ms === arr2[i].ms) {
                    // If the next one is the same,
                    // move on to the next arr2 (don't increment)

                    // Though, if one is NaN, then the other should be used.
                    if (isNaN(arr1[arr1Index].val)) {
                        arr1[arr1Index].val = arr2[i].val;
                    }

                    //console.log("dont add:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else {
                    // If the next one is lower than this one,
                    // increment and compare to the new one from arr1

                    //console.log("continue:", arr1[arr1Index].ms, arr2[i].ms);
                    arr1Index++;
                }
            }
        }

        return arr1.concat(uniques);
    }

    function getMSStartForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin container
        // [at this level] in which this ms would fit.


        var sizeOfTheBinContainerInMS = sampleSize(lvl) * shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY;

        return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
    }

    function isArray(a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    function getSurroundingBins (start, end, lvl) {
        // return all bin starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var binSize = Math.pow(2, lvl) * oneSample;

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
    }

    function getSurroundingBinContainers (start, end, lvl) {
        // return all bin container starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var binSize = my.binContainerSize(lvl);

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
    }

    function splitIntoBinsAtLevel (data, lvl) {
        // TODO: round level down to nearest maxNumberOfBins
        //       then separate the data out into a structure:
        //       { '0': [{ms: 3}, {ms: 4}]
        //         '5': [{ms: 5}, {ms: 9}]}
        //       This function is to be used when adding raw data
        // Assumption: data is ordered and continuous

        return _.groupBy(data, function (d) {
            return getMSStartForTimeAtLevel(d.ms, lvl);
        });
    }

    function rebin (range_to_rebin, level_to_rebin) {
        return; // DO NOTHING
    }

    function combineFilteredBinContainerInformation (bin, lvl, key, range) {
        // Returns ALL data from any container which intersects the requested range
        // AKA:  Grabs ALL containers which line up with the containers of the
        //       one-higher level's intersection with this range

        // get lvl+1's range of containers for this range
        var upperLevelRange = [ // range until very end
            getMSStartForTimeAtLevel(range[0], lvl+1),
            getMSStartForTimeAtLevel(range[1], lvl+1) + my.binContainerSize(lvl+1)
        ];

        // get lvl range of containers for that range
        if (!upperLevelRange[0] || !upperLevelRange[1]) {
            //console.log(upperLevelRange[0], upperLevelRange[1]);
            return [];
        }
        var binsToBeCombined = getSurroundingBinContainers(upperLevelRange[0], upperLevelRange[1], lvl);

        var combo = [];
        for (var i in binsToBeCombined) {
            if (bin[key].levels[lvl][binsToBeCombined[i]]){
                combo = combo.concat(bin[key].levels[lvl][binsToBeCombined[i]]);
            }
        }

        return combo;
    }

    // Bin the data in a level into abstracted bins
    function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin) {
        var bDat = [];
        if (!bin[key].levels[curLevel]) {
            return bDat;
        }

        // Combine all data which is within range_to_rebin
        var combo = combineFilteredBinContainerInformation(bin, curLevel, key, range_to_rebin);
        var combo2 = [];

        // if we're calculating for quartiles, then we need the other quartile as well
        if (key === 'q1') {
            combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q3', range_to_rebin);
        } else if (key === 'q3'){
            combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q1', range_to_rebin);
        }

        // Use this new combined data instead of bin[key].levels[curLevel].length
        for(var i = 0; i < combo.length; i = i + 2){
            // If we are at a bad spot to begin a bin, decrement i by 1 and continue;
            var sampleIsAtModularLocation = atModularLocation(combo[i].ms, curLevel+1);
            var nextSampleExists = combo.length > i + 1;
            var nextSampleIsRightDistanceAway = nextSampleExists ?
                combo[i+1].ms - combo[i].ms === sampleSize(curLevel) :
                true;

            if (!sampleIsAtModularLocation || !nextSampleExists || !nextSampleIsRightDistanceAway) {
                // This is here so that both the server and client's bins start and end at the same place
                // no matter what range of data they have to work with.
                // we skip over values which are not at the beginning of a bin
                i = i - 1;
                continue;
            }

            if (combo[i+1]){
                var newdate = combo[i/*+1*/].ms;

                if (key === 'q1' || key === 'q3') {
                    bDat.push({ val:  func(
                                        combo[i].val,
                                        combo[i+1].val,
                                        combo2[i].val,
                                        combo2[i+1].val),
                                ms: newdate }); // This is messy and depends on a lot of things
                }else{
                    bDat.push( { val: func( combo[i].val,
                                            combo[i+1].val),
                                 ms: newdate });
                }
            }
        }
        return bDat;
    }

    function atModularLocation(ms, lvl) {
        // True if ms is at the beginning of a bin in level lvl.
        return ms % (Math.pow(2, lvl) * oneSample) === 0;
    }

    function getTwoLargest (array) {
        var arr = array.slice();
        var first = d3.max(arr);
        arr.splice(arr.indexOf(first),1);
        var second = d3.max(arr);
        return [first, second];
    }

    function average (array) {
        return d3.sum(array)/array.length;
    }

    function getTwoSmallest (array) {
        var arr = array.slice();
        var first = d3.min(arr);
        arr.splice(arr.indexOf(first),1);
        var second = d3.min(arr);
        return [first, second];
    }

    function combineAndSortArraysOfDateValObjects (arr1, arr2) {
        // Add the objects from arr2 (array) to arr1 (array)
        //   only if the object from arr2 has a ms value
        //   which no object in arr1 has.
        // AKA: arr1 gets precedence

        // concat them
        var result = combineWithoutDuplicates(arr1, arr2);

        // sort the result TODO: may not be required, as combineWithoutDuplicates gives a sorted result
        result.sort(function (a, b) { return a.ms - b.ms; });

        return result;
    }

    function inAButNotInB(arr1, arr2) {
        return _.filter(arr1, function (d) {
            return !_.contains(arr2, d);
        });
    }

    // HELPER METHODS }}}

    //{{{ INITIALIZATION (runs once)
    // INITIALIZATION }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    };

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addData = function (data, key, lvl) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        var splitData = splitIntoBinsAtLevel(data, lvl);

        for (var prop in splitData) {
            if (splitData.hasOwnProperty(prop)){
                // Create if we don't have:
                if (!bd[key].levels[lvl]) { bd[key].levels[lvl] = {}; }
                if (!bd[key].levels[lvl][prop]) { bd[key].levels[lvl][prop] = []; }

                // combine and put in bd
                bd[key].levels[lvl][prop] = combineAndSortArraysOfDateValObjects(bd[key].levels[lvl][prop], splitData[prop]);
            }
        }
    };

    my.addRawData = function (data, dontBin) {
        return my; // DO NOTHING
    };

    my.replaceRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // TODO TODO TODO: update for new bin containers
        var range = d3.extent(data, function (d) { return d.ms; });

        // make this level if it does not yet exist
        if (!bd.rawData.levels[0]) { bd.rawData.levels[0] = []; }

        bd.rawData.levels[0] = data;

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    };

    my.addBinnedData = function (bData, lvl, dontBin) {
        return my; // do nothing
    };

    my.replaceBinnedData = function(bData, lvl, dontBin) {
        // only the level lvl will be stored
        // data must be in the form of the following example:
        // { average: {
        //     levels: [
        //       [{val: value_point, ms: ms_since_epoch},
        //        {val: value_point, ms: ms_since_epoch},
        //        {etc...}],
        //       [etc.]
        //     ],
        //   },
        //   q1: {
        //     levels: [
        //       [etc.]
        //     ],
        //   },
        //   etc: {},
        // }

        // TODO TODO TODO: update for new bin containers

        var range = d3.extent(bData.average.levels[lvl], function (d) { return d.ms; }); // ASSUMPTION: average is always included

        for (var k = 0; k < bd.keys.length; k++) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];

            //if we don't have a lvl for this already, initialize one
            if (!bd[key].levels[lvl]) {
                bd[key].levels[lvl] = [];
            }

            if(bData[key].levels) {
                bd[key].levels[lvl] = bData[key].levels[lvl];
            }
        } // for each of max_val, min_val, etc.

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    };

    my.replaceAllData = function (bDat) {
        // Replace all data with what is given
        bd = bDat;
    };


    my.haveDataInRange = function(ms_range, level, visibleKeys) {
        // Determine the number of samples which we should have in the given range.

        // TODO TODO TODO: update for new bin containers

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var datedRange = my.getDateRange([key], level, ms_range, visibleKeys);

        if (datedRange.length === 0) {
            return false;
        }

        var firstSample = datedRange[0].ms;

        if (firstSample > ms_range[0] + sampleSize(level)) {
            return false;
        }

        var actualRange = ms_range[1] - firstSample;
        var numberWeShouldHave = Math.floor(actualRange / sampleSize(level));

        var numberWeHave = datedRange.length;

        return numberWeHave >= numberWeShouldHave;
    };

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // Return which bins which we are missing in the given range and level.
        // returns [[start, end],[start,end],...] ranges of required data

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var fir = Math.floor(ms_range[0] / (Math.pow(2, level) * oneSample));
        var las = Math.floor(ms_range[1] / (Math.pow(2, level) * oneSample));

        var normalizedRange = [ fir * Math.pow(2, level) * oneSample, (las + 1) * Math.pow(2, level) * oneSample ];
        var datedRange = my.getDateRange([key], level, normalizedRange);

        if (datedRange.length === 0) {
            // TODO: for the grey missing data boxes, should this return something different?
            if (samplesInsteadOfRanges) { return [ms_range[0]]; }
            return [ms_range];
        }

        var neededBins = _.range(normalizedRange[0], normalizedRange[1], sampleSize(level));
        neededBins.forEach(function (d) {
            d = d * Math.pow(2, level) * oneSample;
        });

        var missingSamples = inAButNotInB(neededBins, _.pluck(datedRange, 'ms'));
        missingSamples.total = datedRange.length;

        if(samplesInsteadOfRanges) { return missingSamples; }

        var missingRanges = [];

        _.each(missingSamples, function (d) {
            missingRanges.push([d, d + sampleSize(level)]);
            // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
        });

        return missingRanges; // form: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    };

    my.getMin = function (lvl) {
        var lowestValue = 999999;
        var k = "";
        var justval = function (d) { return d.val; };

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        for (var key = 0; key < bd[k].levels[lvl].length; key++) {
            lowestValue = Math.min(d3.min(bd[k].levels[lvl][key], justval),
                                    lowestValue);
        }

        return lowestValue;
    };

    my.getMax = function (lvl) {
        var highestValue = -999999;
        var k = "";
        var justval = function (d) { return d.val; };

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        for (var key = 0; key < bd[k].levels[lvl].length; key++) {
            highestValue = Math.max(d3.max(bd[k].levels[lvl][key], justval),
                                    highestValue);
        }

        return highestValue;
    };

    my.getMinMS = function (lvl) {
        // pick the minimum bin (highest key) in bd level lvl
        // and ask for the lowest raw value
        var justms = function (d) { return d.ms; };
        var k = "";

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        var getMinOfArray = function (numArray) {
            return Math.min.apply(null, numArray);
        };

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.min(bd[k].levels[lvl][getMinOfArray(keys)], justms);
    };

    my.getMaxMS = function (lvl) {
        var justms = function (d) { return d.ms; };
        var k = "";

        if (lvl === 0) {
            k = "rawData";
        } else {
            k = "average";
        }

        var getMaxOfArray = function (numArray) {
            return Math.max.apply(null, numArray);
        };

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.max(bd[k].levels[lvl][getMaxOfArray(keys)], justms);
    };

    my.getColor = function (key) {
        return parentBDs[0].bd()[key].color;
    };

    my.getDash = function (key) {
        return parentBDs[0].bd()[key].dash;
    };

    my.getOpacity = function (key) {
        return parentBDs[0].bd()[key].opacity;
    };

    my.getAllInRange = function(lvl, range) {
        // return a bd-like data structure but only
        // with data in the following range and level
        // from all keys

        // initialize the data structure to be sent
        var theKeys = ["average", "q1", "q3", "mins", "maxes"];
        var send_req = {};

        for (var i = 0; i < theKeys.length; i++) {
            send_req[theKeys[i]] = {};
            send_req[theKeys[i]].levels = [];
            send_req[theKeys[i]].levels[lvl] = my.getDateRange([theKeys[i]], lvl, range);
        }

        return send_req;
    };

    my.getDateRangeWithMissingValues = function (key, lvl, range, extra, visibleKeys) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // USE:
        // filter an array so that we don't render much more
        // than the required amount of line and area
        // missing values are NaN's

        var pdbs = [];
        // Run getDateRange on each parent
        _.each(parentBDs, function (pdb) {
            pdbs.push(my.normalizeArrayToDomainOfKeys(pdb, pdb.getDateRangeWithMissingValues(key, lvl, range, extra), visibleKeys, range, lvl));
        });

        // get lowest value of all keys for this level in all parents
        // to be used as the offset for multiplyArraysOfDateValObjects
        //lowest_of_all = my.lowestOfAllParentsInLevel(lvl, keys);

        // Go through each result and combine them.
        //console.log(pdbs);
        //console.log(my.multiplyArraysOfDateValObjects(pdbs));

        // TODO: normalize each so that it goes from 0 to 1 instead of whatever its range is
        //       - but actually we want to normalize it based on what lines are being shown
        //         based on all lines for each parent.
        //       - NEED KEYS??

        return my.multiplyArraysOfDateValObjects(pdbs);
    };

    my.normalizeArrayToDomainOfKeys = function(parent, array, keys, range, lvl) {
        //Figure out the domain, then call normalizeArrayOfMSValues
        var result = parent.getExtentsForLvlKeysRange(lvl, keys, range);
        return my.normalizeArrayOfMSValues(array, result);
    };

    my.normalizeArrayOfMSValues = function(array, domain){
        // returns the array, normalized to values 0.0001 through 1
        var scal = d3.scale.linear()
            .range([0.0001, 1]);

        if(domain){
            scal.domain(domain);
        } else {
            scal.domain(d3.extent(array, function(d) { return d.val; }));
        }

        return _.map(array, function(d){
            return {ms: d.ms, val: scal(d.val)};
        });
    };

    my.multiplyArraysOfDateValObjects = function (arrays) {
        // TODO: arrays should be normalized (zero to 1) before they get to this function

        // Return an array which is each element of a and b multiplied

        // List of all ms values in either a or b
        var ms_values = [];
        _.each(arrays, function (arr) {
            ms_values = _.union(ms_values, _.pluck(arr, "ms"));
        });
        ms_values = ms_values.sort(function (a, b) { return a - b; });

        var result = [];

        // Go through each one
        _.each(ms_values, function (ms) {
            var found = [];
            _.each(arrays, function (arr) {
                var val = _.find(arr, function (d) { return d.ms === ms; });
                if (val !== undefined && !isNaN(val.ms)) {
                    found.push(val.val);
                } else {
                    found.push(null);
                }
            });
            if (_.contains(found, null)) {
                // do not add to result.
            } else {
            var scal = d3.scale.linear().domain([-1,1]).range([0,1]);
                result.push({
                    ms: ms,
                    val: _.reduce(found, function (memo, num) {
                        if (mult) {
                            return memo * num;
                        } else {
                            return scal(memo - num);
                        }
                    }, 1)
                });
            }
        });

        return result;
    };

    my.getDateRange = function (keys, lvl, range, visibleKeys) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // COMMON USE CASE:
        // filter an array so that we don't render much more
        // than the required amount of line and area

        var pdbs = [];
        // Run getDateRange on each parent
        _.each(parentBDs, function (pdb) {
            pdbs.push(my.normalizeArrayToDomainOfKeys(pdb, pdb.getDateRange(keys, lvl, range), visibleKeys, range, lvl));
        });

        // TODO: normalize each so that it goes from 0 to 1 instead of whatever its range is
        //       - but actually we want to normalize it based on what lines are being shown
        //         based on all lines for each parent.
        //       - NEED KEYS??

        // get lowest value of all keys for this level in all parents
        // to be used as the offset for multiplyArraysOfDateValObjects
        //lowest_of_all = my.lowestOfAllParentsInLevel(lvl, keys);

        // Go through each result and combine them.
        return my.multiplyArraysOfDateValObjects(pdbs);
    };

    my.removeAllLevelsBelow = function(LowestLevel) {
        //TODO
        for(var i = 0; i < LowestLevel; i++) {
            for(var k = 0; k < bd.keys.length; k++) {
                var key = bd.keys[k];
                //console.log("removing", key, i);
                bd[key].levels[i] = {};
            }
        }

        // remove rawData, too
        if (LowestLevel > 0) {
            //console.log("removing", "rawData", 0);
            bd.rawData.levels[0] = {};
        }

        //console.log("removing ;]");
    };

    my.importDataFromAnotherBinnedDataObject = function (otherBinnedData) {
        for (var k = 0; k < otherBinnedData.keys.length; k++) {
            var key = otherBinnedData.keys[k];
            // for each key in otherBinnedData

            for (var l = 0; l < shmotg.MAX_NUMBER_OF_BIN_LEVELS; l++) {
                // for each level

                if (!otherBinnedData[key].levels[l]) { continue; }

                for (var b = 0; b < otherBinnedData[key].levels[l].length; b++) {
                    // for each bin container

                    if (!bd[key].levels[l]) {
                        bd[key].levels[l] = {};
                    }

                    if (!bd[key].levels[l].hasOwnProperty(b)) {
                        // If we don't have it already, plunk it in
                       bd[key].levels[l][b] = otherBinnedData[key].levels[l][b];
                    } else {
                        // If we do, combine them.
                       bd[key].levels[l][b] = combineWithoutDuplicates(
                           bd[key].levels[l][b],
                           otherBinnedData[key].levels[l][b]);
                    }
                } // for each bin container
            } // for each level
        } // for each key
    };

    my.doToEachContainerInRange = function (range, level, func) {
        getSurroundingBinContainers(range[0], range[1], level).forEach(function (d) {
            func(d);
        });
    };

    // TODO: use this instead of manually doing it everywhere
    my.binSize = function (lvl) {
        return Math.pow(2, lvl) * oneSample;
    };

    my.oneSample = function (value) {
        if (!arguments.length) return oneSample;
        oneSample = value;
        return my;
    };

    my.binContainerSize = function (lvl) {
        return my.binSize(lvl) * shmotg.MAX_NUMBER_OF_ITEMS_PER_ARRAY;
    };

    my.getSurroundingBinContainers = function (r0, r1, lvl) {
        return getSurroundingBinContainers(r0, r1, lvl);
    };

    my.getSurroundingBins = function (start, end, lvl) {
        return getSurroundingBins(start, end, lvl);
    };

    my.getBinContainerForMSAtLevel = function (ms, lvl) {
        return getMSStartForTimeAtLevel(ms, lvl);
    };

    my.getKeys = function () {
        return parentBDs[0].bd().keys.slice(0); // give a copy of the array
    };

    my.bd = function () {
        return bd;
    };

    my.combineAndSortArraysOfDateValObjects = function(a, b) {
        return combineAndSortArraysOfDateValObjects(a, b);
    };

    my.getChildBins = function(ms, lvl) {
        // TODO: Return an array of two bins of level lvl-1,
        //       which are the bins which are used to calculate
        //       the value for the bin at ms.
        var result = [ms];
        var siz = my.binSize(lvl-1);
        if (atModularLocation(ms, lvl)) {
            result.push(ms+siz);
        } else {
            result.push(ms-siz);
        }
        return result;
    };

    my.toString = function () {
        // Give bd as a string
        return JSON.stringify(bd);
    };

    my.rebinAll = function (range, lvl) {
        rebin(range, lvl);
    };

    my.addParentData = function (bd) {
        parentBDs.push(bd);
    };

    // PUBLIC METHODS }}}

    return my;
};

/* vim: set foldmethod=marker: */




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

    var beingPointedTo = -1;

    var surrounding_lines;
    var line_bottom;
    var line_left;
    var line_right;
    var line_top;

    var avoidChangeCallBack; // TODO: make this not required.

    var dragS = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragSlider);

    var dragH = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragHandle);

    var once = true; // for things which only run the first time my() is called.
    // Set Defaults }}}

    // {{{ EVENTS
    var onhover = function() {
        d3.select(this).classed("hover", true);
        d3.select(this).classed("mousedown", false);
    };

    var onoff = function() {
        d3.select(this).classed("hover", false);
        d3.select(this).classed("mousedown", false);
    };

    var ondown = function(e) {
        d3.select(this).classed("hover", false);
        d3.select(this).classed("mousedown", true);
        if (e.preventDefault) {
            e.preventDefault(); // So Chrome doesn't change the cursor to be text-select
        }
        e.returnValue = false;
    };

    var onclick = function() {
        if (d3.event.defaultPrevented) return; // click suppressed
        d3.select(this).classed("hover", false);
        d3.select(this).classed("mousedown", false);
        // TODO: set as selected and trigger stuff
        var which_box = this.__data__;
        var newPos = (which_box * boxSize) + scrollPosition;
        my.handlePosition(newPos).update(true);
    };
    // EVENTS }}}

    // {{{ HELPER FUNCTIONS
    function highlightSliderElement() {
        var locationOfHandle = handlePosition + (boxSize / 2);
        var locationOfSlider = scrollPosition;
        var newBeingPointedTo = Math.floor((locationOfHandle - locationOfSlider) / boxSize); // level being pointed to
        changeCallBack(currentScrollPosition(), newBeingPointedTo, avoidChangeCallBack);
        if (beingPointedTo !== newBeingPointedTo){
            d3.selectAll(".slider_boxes")
                .classed("highlighted", function (d, i) { return i == newBeingPointedTo; });
        }
        beingPointedTo = newBeingPointedTo;
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
        dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")");

        highlightSliderElement();
    }

    function dragHandle(han) {
        // console.log(han);
        var adjustment = d3.event.dy;
        var dragTarget = handle_region;
        var curTrans = d3.transform(dragTarget.attr("transform")).translate;
        var finalX = curTrans[0];
        var finalY = Math.min(height - boxSize, Math.max(0, curTrans[1] + adjustment));
        handlePosition = finalY;
        // console.log(handlePosition, d3.event.y);
        dragTarget.attr("transform", "translate(" + finalX + "," + finalY + ")");

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
    };

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
        };
    };

    var drawDragLines = function (d, i) {
        dat = [ {x: (1/3)*boxSize, y: ((i+2)/6)*boxSize},
                {x: (2/3)*boxSize, y: ((i+2)/6)*boxSize} ];
        return d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate("linear")(dat);
    };

    // HELPER FUNCTIONS }}}


    function my (g, av) {
        slctn = g; // Saving the selection so that my.update() works.
        avoidChangeCallBack = av;

        g.each(function(d, i) {
            // TODO TODO: put this outside so that this mega function isn't being created each time.
            var g = d3.select(this);

            // {{{ VARIABLES
            svg = svg ? svg : g.append("svg");
            svg
                .attr("width", width)
                .attr("height", height);
            // VARIABLES }}}

            // {{{ CLIPPING
            if(once) {
                defclip = defclip ? defclip : svg.insert("defs").append("clipPath").attr("id", "clip" + id).append("rect");
                defclip
                .attr("width", boxSize)
                .attr("transform", "translate(" + side_margin + ", " + 0 + ")")
                .attr("height", height);
            }
            // CLIPPING }}}

            // {{{ SLIDER
            if(once){
                slide_region = slide_region ? slide_region : svg.append("g")
                .attr("id", "slide_container" + id)
                .attr("clip-path", "url(#clip" + id + ")")
                .append("g") // another 'g' so that the clip doesn't move with the slide_region
                .attr("id", "slide_region" + id)
                .attr("class", "slide_region");

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
            }
            // SLIDER }}}

            // {{{ SURROUNDING LINES
            if (once){
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
            }
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

            handleClip = handleClip ? handleClip : handle_region.append("clipPath")
                .attr("id", "clip-handle" + id)
                .append("path")
                .attr("d", drawHandle(pointer_top, pointer_bottom, handle_distance));

            handle = handle ? handle : handle_region.append("path")
                .attr("d", drawHandle(pointer_top, pointer_bottom, handle_distance))
                .attr("id", "handle" + id)
                .attr("clip-path", "url(#clip-handle" + id + ")")
                .attr("class", "handle");

            handle_lines = handle_lines ? handle_lines : handle_region.append("g").attr("id", "dragLines" + id);
            handle_lines.selectAll("path").data([0, 1, 2])
                .enter().append("path")
                    .attr("d", drawDragLines)
                    .attr("class", "dragLines")
                    .attr("transform", "translate(" + (side_margin + boxSize + handle_distance) + "," + 0 + ")");
            // HANDLE }}}

            // {{{ DRAGGING
            if (once){
                slide_region.call(dragS);
                handle_region.call(dragH);
            }
            // DRAGGING }}}

            if (avoidChangeCallBack){
                // only necessary if the mouse zoomed us.
                highlightSliderElement();
            }

            once = false;
        });
        d3.timer.flush();
    }

    // {{{ GETTERS AND SETTERS
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

    my.boxSize = function (value) {
        if (!arguments.length) return boxSize;
        boxSize = value;
        return my;
    };

    my.numberOfLevels = function (value) {
        if (!arguments.length) return numberOfLevels;
        numberOfLevels = value;
        return my;
    };

    my.changeCallBack = function (value) {
        if (!arguments.length) return changeCallBack;
        changeCallBack = value;
        return my;
    };

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
    };

    my.scrollPosition = function (value) {
        if (!arguments.length) return scrollPosition;
        if (value === scrollPosition) { return my; }
        scrollPosition = Math.min(0, Math.max(height - boxSize*numberOfLevels, value));
        var dragTarget = d3.select("#slide_region" + id);
        var finalX = d3.transform(dragTarget.attr("transform")).translate[0];
        dragTarget.attr("transform", "translate(" + finalX + "," + scrollPosition + ")");
        return my;
    };

    my.handlePosition = function (value) {
        if (!arguments.length) return handlePosition;
        handlePosition = Math.max(0, Math.min(height - boxSize, value));//d3.min([0, d3.max([height - boxSize, value])]);
        return my;
    };

    my.highlightSliderElement = function () {
        highlightSliderElement();
    };

    my.update = function (avoidChangeCallBack) {
        if (avoidChangeCallBack) {
            my(slctn, true);
        }
        my(slctn);
    };

    // GETTERS AND SETTERS }}}

    return my;
};

})();

/* vim: set foldmethod=marker: */







// {{{ HELPER FUNCTIONS

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var justItself = function(d){
    return d;
};

var justValue = function(d){
    return d.value;
};

var justval = function (d) {
    return d.val;
};
var notNaNVal = function (d) {
    return !isNaN(d.val);
};
var notNaNValFirst = function (d) {
    return notNaNVal(d[0]);
};
var isNaNVal = function (d) {
    return isNaN(d.val);
};

function addBValuesToA(a,b) {
    var i, len = b.length;
    for (i = 0; i < len; i += 1) {
        a.push(b[i]);
    }
}

var msDifference = function (a, b) {
    return a.ms - b.ms;
};

var generateLoadingBoxArray = function (whichLevelToRender, renderRange, renderThis, binData) {
    var fil = binData.getDateRangeWithMissingValues(
        'average',
        whichLevelToRender,
        renderRange,
        false,
        renderThis);

        var toBeAddedMissing = [];
        var countMissing = 0;
        var lineMissingFilter = [];

        if (fil.length <= 1) {
            // No data. Fill everything. (Everything is missing.)
            lineMissingFilter.push({val: NaN, ms: renderRange[0]});
            lineMissingFilter.push({val: NaN, ms: renderRange[1]});
        } else {
            // TODO: move this function to a wider scope.
            lineMissingFilter = _.map(fil, function (d) {
                var tmp = {};
                tmp.val = d.val;
                tmp.ms = d.ms;
                if (isNaN(tmp.val)) {
                    var siz = binData.binSize(whichLevelToRender);
                    var range = binData.getChildBins(tmp.ms, whichLevelToRender);
                    toBeAddedMissing.push({val: tmp.val, ms: tmp.ms+siz-1});
                } else {
                    // tmp.val = NaN; // display it all
                }
                countMissing++;
                return tmp;
            });
        }

        lineMissingFilter.sort(msDifference);
        lineMissingFilter = binData.combineAndSortArraysOfDateValObjects(lineMissingFilter, toBeAddedMissing);
        return lineMissingFilter;
};

var generateMissingArray = function (whichLevelToRender, renderRange, renderThis, binData) {
    var fil = binData.getDateRangeWithMissingValues(
            'average',
            whichLevelToRender,
            renderRange,
            false,
            renderThis);

    var toBeAdded = [];
    var count = 0;

    // TODO: move this function o a wider scope.
    var lineFilter = _.map(fil, function (d) {
        tmp = {};
        tmp.val = d.val;
        tmp.ms = d.ms;
        if (isNaN(tmp.val)) {
            var siz = binData.binSize(whichLevelToRender);
            var range = binData.getChildBins(tmp.ms, whichLevelToRender);
            tmp.val = averageOfRange(binData.getDateRangeWithMissingValues(
                'average',
                whichLevelToRender - 1,
                range,
                false,
                renderThis));
            if (fil[count-1] && !isNaN(fil[count-1].val)) {
                toBeAdded.push({val: fil[count-1].val, ms: fil[count-1].ms});
            }
            if (fil[count+1] && !isNaN(fil[count+1].val)) {
                toBeAdded.push({val: fil[count+1].val, ms: fil[count+1].ms});
            } else {
                toBeAdded.push({val: tmp.val, ms: tmp.ms+siz-1});
            }
        } else {
            // tmp.val = NaN; // display it all
        }
        count++;
        return tmp;
    });


    lineFilter.sort(msDifference);
    lineFilter = binData.combineAndSortArraysOfDateValObjects(lineFilter, toBeAdded);

    // TODO: if fil is empty (or all are NaN; whatever happens when we zoom out until nothing is visible), then have one bin which fills the entire screen.

    var toBeAddedMissing = [];
    var countMissing = 0;
    var lineMissingFilter = [];

    if (fil.length <= 1) {
        // we have no data, therefore:
        // make a big grey box that fills the entire screen
        lineMissingFilter.push({val: NaN, ms: renderRange[0]});
        lineMissingFilter.push({val: NaN, ms: renderRange[1]});
    } else {
        // TODO: move this function o a wider scope.
        lineMissingFilter = _.map(fil, function (d) {
            tmp = {};
            tmp.val = d.val;
            tmp.ms = d.ms;
            if (isNaN(tmp.val)) {
                var siz = binData.binSize(whichLevelToRender);
                var range = binData.getChildBins(tmp.ms, whichLevelToRender);
                toBeAddedMissing.push({val: tmp.val, ms: tmp.ms+siz-1});
            } else {
                // tmp.val = NaN; // display it all
            }
            countMissing++;
            return tmp;
        });
    }

    lineMissingFilter.sort(msDifference);
    lineMissingFilter = binData.combineAndSortArraysOfDateValObjects(lineMissingFilter, toBeAddedMissing);

    return [lineFilter, lineMissingFilter];
};

var averageOfRange = function (data) {
    var result = 0;
    var count = 0;
    for (var i = 0; i < data.length; i++) {
        if (!isNaN(data[i].val)) {
            result += data[i].val;
            count++;
        }
    }
    if (count === 0) {
        return NaN;
    } else {
        return result / count;
    }
};

var isWithinRange = function (r1, r2) {
    // see if r1 is within r2
    return r1[0] >= r2[0] && r1[1] <= r2[1];
};

function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
}

// This is the transform which is done on the data after it has been rendered.
function transformScale(scal, oldScal, mar) {
    var pixelsPerSample = getScaleValue(scal);
    var xS = getScaleValue(scal);

    var tx = mar.left + (xS * (oldScal.domain()[0] - scal.domain()[0])); // translate x value
    var ty = mar.top; // translate y value

    // See renderFunction for the inverse:
    var sx = xS / getScaleValue(oldScal);
    var sy = 1; // scale y value

    return "translate(" + tx + "," + ty + ")scale(" + sx + "," + sy + ")";
}

function generateKey(d) {
    return d.key + d.which + d.interpolate;
}

// selection are the objects,
// fill and stroke are functions,
// scal is the scale
function drawElements(keyObject, container, id, fill, stroke, strokeDash, scal, toTransition, scalOld, ease, dur, d0s, bin, mar, renScale, strokeW, name, fullRender) {
    var sel = container.selectAll("."+name+id)
            .data(keyObject, generateKey);

    //update
    if (toTransition) {
        sel.attr("transform", transformScale(scalOld, renScale, mar))
           .attr("d", function (d, i) { return d0s[d.key]; })
           .transition().ease(ease).duration(dur)
           .attr("transform", transformScale(scal, renScale, mar));
    } else {
        sel.attr("opacity", function (d) { return bin.getOpacity(d.key); })
           .attr("d", function (d, i) { return d0s[d.key] ? d0s[d.key] : "M -1000 -1000 L -1000 -1000"; }) // if the d0 is empty, replace it with a very distant dot (to prevent errors)
           .attr("transform", transformScale(scal, renScale, mar));
    }


    //enter
    sel.enter()/*.append("g").attr("class", name)*/.append("path")
            .attr("class", function(d) { return name+id+" "+d.key; })
            .attr("d", function (d, i) { return d0s[d.key]; });

    if (toTransition) {
        sel.attr("transform", transformScale(scalOld, renScale, mar))
            .attr("opacity", 0)
            .transition().ease(ease).duration(dur)
            .attr("transform", transformScale(scal, renScale, mar))
            .attr("opacity", function (d) { return bin.getOpacity(d.key); });
    } else {
        sel.attr("transform", transformScale(scal, renScale, mar))
            .attr("opacity", function (d) { return bin.getOpacity(d.key); });
    }

    //exit
    sel = toTransition ?
        sel.exit().transition().ease(ease).duration(dur) :
        sel.exit();

    sel.attr("transform", transformScale(scal, scalOld, mar))
        .attr("opacity", 0)
        .remove();
}

// TODO: Phase 2 - make this external, as in, set from outside this chart object.
//       - could pass in a function or a static value.
function maxBinRenderSize () {
    return document.getElementById("renderdepth").value;
}

// The following function returns something which looks like this:
// [
//   {key: 'rawData',  which: 0, interpolate: blabla}, <-- this one is for the raw data
//   {key: 'average', which: 2, interpolate: blabla}, <-- the current level is 'which'
//   {key: 'maxes',    which: 2, interpolate: blabla}, <-- etc.
// ]
var makeDataObjectForKeyFanciness = function (bin, whichLines, whichLevel, interp) {
    var resultArray = [];

    var j = 0;
    var keys = bin.getKeys();
    for (var keyValue in whichLines){ // for each of 'average', 'max', 'min'
        var key = whichLines[keyValue];

        for (j = 0; j < shmotg.MAX_NUMBER_OF_BIN_LEVELS; j++) {
            if (whichLevel === j){
                resultArray.push({
                    key: key,
                    which: j,
                    interpolate: interp
                });
            }
        }
    }

    return resultArray;
};

// See makeDataObjectForKeyFanciness for explanation of output
var makeQuartileObjectForKeyFanciness = function (whichLines, whichLevel, interp) {
    var resultArray = [];
    var key = 'quartiles';

    var j = 0;
    if (whichLines.indexOf('quartiles') > -1) {
        for (j = 0; j < shmotg.MAX_NUMBER_OF_BIN_LEVELS; j++) {
            if (whichLevel === j){
                resultArray.push({
                        key: key,
                        which: j,
                        interpolate: interp
                });
            }
        }
    }

    if (whichLines.indexOf('missingBox') > -1) {
        resultArray.push({
                key: 'missingBox',
                which: 0,
                interpolate: interp});
    }

    return resultArray;
};

function goToLevel(scal, msPS) {
    // Return which level should be displayed based on
    // the current scale, and the sample rate
    // - msPS is milliSecondsPerSample

    // pixels/bin:
    var pixelsPerBin = maxBinRenderSize();
    var pixelsPerMilliSecond = getScaleValue(scal);
    var pixelsPerSample = pixelsPerMilliSecond * msPS;

    // sam   pix   sam
    // --- = --- * ---
    // bin   bin   pix
    var samplesPerBin = pixelsPerBin / pixelsPerSample;

    //now convert to level and floor
    var toLevel = Math.log(samplesPerBin) / Math.log(2);
    toLevel = Math.floor(toLevel);
    toLevel = d3.max([0, toLevel]);
    toLevel = d3.min([shmotg.MAX_NUMBER_OF_BIN_LEVELS - 1, toLevel]);

    // TODO: this may not be the correct place for this: update the span with id "current_level"
    d3.select("#current_level").text(toLevel);

    return toLevel;
}

var times = msToCentury.times;
var timeContextFormatSpecifier = [
    { fun: function (a,b) { return (b - a) < 2 * times.y;  }, formIf: "%Y",  formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.mo; }, formIf: " %b", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.d;  }, formIf: " %a %d", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.h;  }, formIf: " %H", formIfNot: ""},
    { fun: function (a,b) { return (b - a) < 2 * times.m;  }, formIf: ":%M", formIfNot: "h"},
    { fun: function (a,b) { return (b - a) < 2 * times.s;  }, formIf: ":%Ss", formIfNot: ""}
    // milliseconds would be unnecessary for our purposes
];

// Convert milliseconds to a Date object
function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
}

// return a string label to be put in the user time context area
// Depends on the times variable from msToCentury.js
var getTimeContextString = function (scal, show) {
    if (!show) return [];

    var result = "";

    var d0 = scal.domain()[0];
    var d1 = scal.domain()[1];
    var doneNow = false;

    // TODO: this makes too many objects and looks like it would be slow.
    var parseDate = d3.time.format(_.reduce(timeContextFormatSpecifier, function (str, dat) {
        if ( doneNow ) return str;
        if (dat.fun(d0, d1)) {
            return str + dat.formIf;
        } else {
            doneNow = true;
            return str + dat.formIfNot;
        }
    }, ""));

    result = parseDate(dt(d0));
    return result;
};

// HELPER FUNCTIONS }}}

var binnedLineChart = function (data, dataRequester, sensorT, sensorN, oneSample, level, cc, isMulti) {

    //{{{ VARIABLES

    var dataReq = dataRequester; // TODO: multiChart
    var multiChart_parentBinnedCharts = []; // contains other binnedLineChart objects. TODO: Combine their data with this one's and display the result.
    var multiChart_childrenCharts = []; // TODO: let these know whenever we get new data
    var displayThisChart = true; // TODO: get/set this, and do less work when not being displayed

    var strokeWidth = 1;
    var sensorType = sensorT;
    var sensorNumber = sensorN;

    // the frequency of the data samples
    var milliSecondsPerSample = 1;

    // TODO: sync this with the one in bridgecharts.js
    //       - can't do, because we're changing top depending
    //         on if we're showing time context
    //       - unless we make it a new offset variable instead of reusing margin
    var margin = {top: 10, right: 27, bottom: 25, left: 30 + 90};

    // the height of the chart by itself (not including axes or time context)
    var height = 150 - margin.top - margin.bottom;

    // the width of the chart, including margins
    var containerWidth = document.getElementById("chartContainer").offsetWidth;
    var width = containerWidth - margin.left - margin.right;

    var whichLevelToRender = level ? level : 0;
    var whichLinesToRender = ['average', 'maxes', 'mins'];
    var interpolationMethod = ['linear'];

    var showTimeContext = true;
    var isMultiChart = isMulti;

    var transitionDuration = 500;
    var easingMethod = 'cubic-in-out';

    var defclip;
    var xAxisContainer;
    var xAxisMinorContainer;
    var xAxis;
    var xAxisMinor;
    var yAxisContainer;
    var yAxis;
    var xScale;
    var xScaleRange;
    var yScale;
    var yScaleRange;
    var previousXScale = d3.scale.linear(); // used for rendering transitions
    var previousLevelToRender; // used for rendering transitions;
    var timeContextContainer;
    var yAxisLockContainer;
    var yAxisLock;

    var chart; // the svg element (?)
    var pathArea;
    var pathPath;

    var slctn; // Save the selection so that my.update() works.

    var once = true; // some things only need to happen once.

    // whether we used the buttons to zoom
    var transitionNextTime = false;
    var reRenderTheNextTime = true;
    var waitingForServer = false;

    // Where all data is stored, but NOT rendered d0's
    var binData = binnedData();
    if (oneSample) {
        binData.oneSample(oneSample);
    }

    var cloudcover = cc; // when true, only render average, and render it as boxes instead of lines.
    var renderThis = [];
    var renderRange = [];
    var showing_range = [];
    var ninetyPercentRange = [];
    var didWeRenderAnything = false;

    // Where all the rendered d0s are stored.
    var renderedD0s = {
        rawData         : "", // d0 for the current level
        rawDataRanges   : [], // the rendered range for the current level
        average         : "",
        averageRanges   : [],
        maxes           : "",
        maxesRanges     : [],
        mins            : "",
        minsRanges      : [],
        q1              : "",
        q1Ranges        : [],
        q2              : "",
        q2Ranges        : [],
        q3              : "",
        q3Ranges        : [],
        quartiles       : "",
        quartilesRanges : [],
        missing         : "",
        missingRanges   : [],
        missingBox      : "",
        missingBoxRanges: [],
        loadingBox      : "",
        loadingBoxRanges: []
    };

    // VARIABLES }}}

    //{{{ HELPER METHODS

    function getOpacity(d) {
        return binData.getOpacity(d.key);
    }

    function transformElements(keyObject, container, id, fill, stroke, strokeDash, scal, toTransition, scalOld, ease, dur, d0s, bin, mar, renScale, strokeW, name, fullRender) {
        var sel = container.selectAll("."+name+id)
                .data(keyObject, generateKey);

        if (toTransition) {
            sel.attr("transform", transformScale(scalOld, renScale, mar))
               .transition().ease(ease).duration(dur)
               .attr("transform", transformScale(scal, renScale, mar));
        } else {
            sel.attr("opacity", getOpacity)
               .attr("transform", transformScale(scal, renScale, mar));
        }
    }

    var doAllTheRendering = function () {
        //{{{ CONTAINER AND CLIPPING
        if (!yAxisLock) {
            if (!yAxis){
                yAxis = d3.svg.axis()
                .ticks(5)
                .tickSubdivide(true)
                .tickSize(width, 0, 0) // major, minor, end
                .orient("left");
            }
            yAxis.scale(yScale).tickSize(width, 0, 0);
        }

        chart = d3.select(this); //Since we're using a .call(), "this" is the svg element.

        if (reRenderTheNextTime){
            //Set it's container's dimensions
            slctn.attr("width", width);

            //Set the chart's dimensions
            chart.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        }

        if (!defclip) { defclip = chart.insert("defs").append("clipPath").attr("id", "clip" + sensorType + sensorNumber).append("rect"); }
        if (reRenderTheNextTime) {
            defclip.attr("width", width)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
            .attr("height", height);
        }
        // CONTAINER AND CLIPPING }}}

        //{{{ AREAS

        //Apply the clipPath
        pathArea = pathArea ? pathArea : chart.append("g").attr("id", "paths"+sensorType+sensorNumber+"posArea");
        if (reRenderTheNextTime){
            pathArea.attr("clip-path", "url(#clip" + sensorType+sensorNumber + ")")
            .attr("class", "posArea")
            .attr("height", height);
        }

        //make and render the area
        var quartileObjectForKeyFanciness = makeQuartileObjectForKeyFanciness(renderThis, whichLevelToRender, interpolationMethod, true);

        if (!(didWeRenderAnything || reRenderTheNextTime)){
            transformElements(quartileObjectForKeyFanciness,
                              pathArea,
                              sensorType+sensorNumber,
                              // TODO: eliminate these three function objects
                              function (d) { return binData.getColor(d.key); },
                              function (d) { return "rgba(0,0,0,0)"; },
                              function (d) { return binData.getDash(d.key); },
                              xScale,
                              transitionNextTime,
                              previousXScale,
                              easingMethod,
                              transitionDuration,
                              renderedD0s,
                              binData,
                              margin,
                              renderScale,
                              strokeWidth,
                              "posArea",
                              didWeRenderAnything || reRenderTheNextTime);
        } else {
            drawElements(quartileObjectForKeyFanciness,
                         pathArea,
                         sensorType+sensorNumber,
                         function (d) { return binData.getColor(d.key); },
                         function (d) { return "rgba(0,0,0,0)"; },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         transitionNextTime,
                         previousXScale,
                         easingMethod,
                         transitionDuration,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posArea",
                         didWeRenderAnything || reRenderTheNextTime);
        }

        // AREAS }}}

        //{{{ LINES

        //Apply the clipPath
        pathPath = pathPath ? pathPath : chart.append("g").attr("id", "paths"+sensorType+sensorNumber+"posPath");
        pathPath.attr("clip-path", "url(#clip" + sensorType+sensorNumber + ")")
        .attr("class", "posPath")
        .attr("height", height);

        var shownLines = whichLevelToRender === 0 ? ["average"] : whichLinesToRender;

        //Make and render the Positive lines.
        var dataObjectForKeyFanciness = makeDataObjectForKeyFanciness(binData, shownLines, whichLevelToRender, interpolationMethod);
        if (renderThis.indexOf('loadingBox') > -1) {
            dataObjectForKeyFanciness.push({
                key: 'loadingBox',
                which: 0,
                interpolate: interpolationMethod
            });
        }

        if (!(didWeRenderAnything || reRenderTheNextTime)) {
            transformElements(dataObjectForKeyFanciness,
                         pathPath,
                         sensorType+sensorNumber,
                         // TODO: eliminate these three function objects
                         function (d) { console.log(cloudcover); return cloudcover ? "#F0F" : "rgba(0,0,0,0)"; },
                         function (d) { if(cloudcover) { return "rgba(0,0,0,0)"; } else if (whichLevelToRender === 0) { return "#4D4D4D"; } else { return binData.getColor(d.key); } },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         transitionNextTime,
                         previousXScale,
                         easingMethod,
                         transitionDuration,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posPath",
                         didWeRenderAnything || reRenderTheNextTime);
        } else {
            drawElements(dataObjectForKeyFanciness,
                         pathPath,
                         sensorType+sensorNumber,
                         function (d) { console.log(cloudcover); return cloudcover ? "#F0F" : "rgba(0,0,0,0)"; },
                         function (d) { if(cloudcover) { return "rgba(0,0,0,0)"; } else if (whichLevelToRender === 0) { return "#4D4D4D"; } else { return binData.getColor(d.key); } },
                         function (d) { return binData.getDash(d.key); },
                         xScale,
                         transitionNextTime,
                         previousXScale,
                         easingMethod,
                         transitionDuration,
                         renderedD0s,
                         binData,
                         margin,
                         renderScale,
                         strokeWidth,
                         "posPath",
                         didWeRenderAnything || reRenderTheNextTime);
        }

        // LINES }}}

        //{{{ AXES
        // Draw Axes using msToCentury.js format and values
        if (!xAxis) {
            xAxis = d3.svg.axis()
            .tickFormat(msToCentury.TickFormat)
            .orient("bottom");
        }
        xAxis.scale(xScale)
            .tickValues(msToCentury.TickValues(xScale, width));

        if (!xAxisMinor) {
            xAxisMinor = d3.svg.axis()
            .tickFormat(null)
            .scale(xScale).orient("bottom");
        }
        xAxisMinor.scale(xScale).tickValues(msToCentury.SubTickValues(xScale, width));

        if (!xAxisContainer) {
            xAxisContainer = chart.append("g")
            .attr("class", "x axis");
        }
        if (reRenderTheNextTime) {
            xAxisContainer.attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        }

        if (!xAxisMinorContainer) {
            xAxisMinorContainer = chart.append("g")
            .attr("class", "x axis minor");
        }
        if (reRenderTheNextTime) {
            xAxisMinorContainer.attr("transform", "translate(" + margin.left + ", " + (margin.top + height) + ")");
        }

        if (transitionNextTime) {
            xAxisContainer.transition().duration(transitionDuration).ease(easingMethod).call(xAxis);
            xAxisMinorContainer.transition().duration(transitionDuration).ease(easingMethod).call(xAxisMinor);
        } else {
            xAxisContainer.call(xAxis);
            xAxisMinorContainer.call(xAxisMinor);
        }

        if (!yAxisContainer) {
            yAxisContainer = chart.append("g")
            .attr("class", "y axis");
        }
        if (reRenderTheNextTime) {
            yAxisContainer.attr("transform", "translate(" + (width + margin.left) + ", " + margin.top + ")");
        }
        yAxisContainer.call(yAxis);
        // AXES }}}

        //{{{ TIME CONTEXT
        if (!timeContextContainer) { timeContextContainer = chart.append("g"); }

        // Draw Time Context
        var timeContextSelection = timeContextContainer.selectAll(".sensor_time_context")
        .data([getTimeContextString(xScale, showTimeContext)]);
        var titleContainer = timeContextContainer.selectAll(".sensor_title")
        .data([sensorType.capitalize() + " " + sensorNumber]);

        // enter
        timeContextSelection.enter().append("text")
        .attr("class", "sensor_time_context");
        titleContainer.enter().append("text")
        .attr("class", "sensor_title");

        // update
        timeContextSelection.text(justItself);
        if(reRenderTheNextTime){
            timeContextSelection
                .attr("x", margin.left -5)
                .attr("y", shmotg.TIME_CONTEXT_VERTICAL_EACH);
        }

        titleContainer.text(justItself);
        if(reRenderTheNextTime){
            titleContainer
                .attr("x", margin.left + (width))
                .attr("y", shmotg.TIME_CONTEXT_VERTICAL_EACH);
        }

        // exit
        timeContextSelection.exit().remove();
        titleContainer.exit().remove();
        // TIME CONTEXT }}}

    };

    var valThroughYScale = function(d) {
        return yScale(d.val);
    };
    var valFirstThroughYScale = function(d) {
        return yScale(d[0].val);
    };
    var valSecondThroughYScale = function(d) {
        return yScale(d[1].val);
    };

    // This is the function used to render the data at a specific size.
    var renderFunction = function (d) {
        // See transformScale for the inverse.

        // Store this for later use.
        copyScaleWithoutGarbage(renderScale, xScale);

        return (d.ms - renderScale.domain()[0]) * getScaleValue(renderScale);
    };
    var renderFunctionFirst = function (d) {
        return renderFunction(d[0]);
    };

    var convert_ms_to_percent = function(ms, scal) {
        var start = scal.range()[0];
        var end = scal.range()[1];
        var x = xScale(ms);
        return ((x-start)/(end-start)) * 100 + "%";
    };

    var createColorGradient = function(container, id, data) {
        var grad = false;
        return function (container, id, data) {
            var svg = d3.select("#"+container);
            if (!svg) { return id; }
            grad = grad ? grad : svg.append("linearGradient");
            var stops = grad.attr("id", id)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", xScale.range()[0]).attr("y1", 0)
                .attr("x2", xScale.range()[1]).attr("y2", 0)
                .selectAll("stop")
                    .data(data); // form: [{ms: 123, val: 123}, {...}, ...]
            stops.enter().append("stop");
            stops.attr("offset", function(d, i) { return convert_ms_to_percent(d.ms, xScale); })
                 .attr("stop-opacity", function(d) { return 1-parseFloat(d.val); })
                 .attr("stop-color", "black");
            stops.exit().remove();
            return id;
        };
    }();

    var copyScaleWithoutGarbage = function (a,b){
        // copy the properties of b into a
        a.domain()[0] = b.domain()[0];
        a.domain()[1] = b.domain()[1];
        a.range()[0] = b.range()[0];
        a.range()[1] = b.range()[1];
    };

    var applyScaleDomainWithoutGarbage = function (a,b){
        a.domain()[0] = b[0];
        a.domain()[1] = b[1];
    };

    var applyScaleRangeWithoutGarbage = function (a,b){
        a.range()[0] = b[0];
        a.range()[1] = b[1];
    };

    // This stores the scale at which the d0s were
    // originally rendered. It's our base-point for
    // the transitions which scrolling does.
    // TODO: make this what the scale SHOULD be
    //       for the specific level and maxBinRenderSize
    //       then we won't need to store state like this
    var renderScale = d3.scale.linear();

    // HELPER FUNCTIONS }}}

    //// INITIALIZATION //// (runs once)

    // POPULATE THE BINNED DATAS (binData)
    binData.addRawData(data);

    //// MY //// (runs whenever something changes)

    var my = function (selection) {

        //{{{ SELECTION AND SCALES

        slctn = selection; // Saving the selection so that my.update() works.

        width = containerWidth - margin.left - margin.right;

        if (!xScale) { xScale = d3.scale.linear().domain([0, 100]); }
        if (!xScaleRange) { xScaleRange = [0, 0]; }
        xScaleRange[1] = width;
        xScale.range(xScaleRange); // So that the furthest-right point is at the right edge of the plot

        if (!yScale){ yScale = d3.scale.linear(); }
        if (!yScaleRange) { yScaleRange = [0, 0]; }
        yScaleRange[0] = height;
        yScale.range(yScaleRange);

        // SELECTION AND SCALES }}}

        //{{{ GENERATE d0s. (generate the lines paths)

        // Choose which d0s need to be generated based on which keys are active.
        renderThis.length = 0; //wipe it
        addBValuesToA(renderThis, whichLinesToRender);
        //renderThis = renderThis.concat(whichLinesToRender);
        if (whichLinesToRender.indexOf("quartiles") !== -1) {
            // If we're going to render the quartiles, we need to render q1 and q3.
            if (whichLinesToRender.indexOf("q3") === -1) {
                renderThis.push('q3');
            }
            if (whichLinesToRender.indexOf("q1") === -1) {
                renderThis.push('q1');
            }
        }
        if (whichLinesToRender.indexOf("missing") !== -1) {
            renderThis.unshift('missingBox');
        }
        if (whichLevelToRender === 0) {
            renderThis.length = 0;
            renderThis.push('average');
            // TODO: render it as black.
        }
        renderThis.push('loadingBox');

        var xdiff = xScale.domain()[1] - xScale.domain()[0];

        // figure out how much to render:
        renderRange[0] = xScale.domain()[0] - xdiff;
        renderRange[1] = xScale.domain()[1] + xdiff;

        didWeRenderAnything = false;
        showing_range.length = 0;

        // for each key
        // 1. find out whether we should render things
        for (var k in renderThis) {
            var key = renderThis[k];

            // These two variables are here to remove the slight amount
            // of un-rendered space which shows up on the sides just
            // before the new data is generated. It provides a buffer zone.
            var tenDiff = (renderedD0s[key + "Ranges"][1] -
                           renderedD0s[key + "Ranges"][0]) * 0.1;
            ninetyPercentRange[0] = renderedD0s[key + "Ranges"][0] + tenDiff;
            ninetyPercentRange[1] = renderedD0s[key + "Ranges"][1] - tenDiff;

            //if we are not within the range OR reRenderTheNextTime
            if (!isWithinRange(xScale.domain(), ninetyPercentRange) || reRenderTheNextTime) {
                //render the new stuff
                didWeRenderAnything = true;

                // calculate new y scale before we render any d0s
                // TODO: make this a function of binnedData.js, and abstract it in binnedChart.js so that it can be called from outside
                // - this will give the option of all charts having the same y axis
                if (showing_range.length === 0) {
                    var binSize = binData.binSize(whichLevelToRender);
                    showing_range = d3.extent(binData.getDateRange(renderThis, whichLevelToRender, [renderRange[0]-binSize, renderRange[1]+binSize], renderThis), justval);
                }

                if (!yAxisLock && !waitingForServer) {
                    if (isMultiChart) {
                        yScale.domain([0, 1]);
                    } else {
                        yScale.domain([ showing_range[0] ? showing_range[0] : yScale.domain()[0],
                                        showing_range[1] ? showing_range[1] : yScale.domain()[1] ]);
                    }
                }

                if (key === 'quartiles') {
                    // render AREA d0s//{{{
                    if (cloudcover) { continue; }

                    var q1Filter = binData.getDateRangeWithMissingValues(
                            'q1',
                            whichLevelToRender,
                            renderRange,
                            interpolationMethod === "step-after",
                            renderThis);
                    var q3Filter = binData.getDateRangeWithMissingValues(
                            'q3',
                            whichLevelToRender,
                            renderRange,
                            interpolationMethod === "step-after",
                            renderThis);

                    // TODO: make an object like [{q1: q1obj, q3: q3obj}, {q1: asdf, q3: asdf}, {...}, ...]
                    //       then feed that into .interpolate() instead of q1Filter

                    renderedD0s.quartiles = d3.svg.area()
                            .defined(notNaNValFirst)
                            .x(renderFunctionFirst)
                            .y0(valFirstThroughYScale)
                            .y1(valSecondThroughYScale)
                            .interpolate( interpolationMethod )(_.zip(q1Filter, q3Filter));

                    //}}}
                } else if (key === 'loadingBox') {
                    // render Missing averages//{{{
                    var lineMissingFilter = generateLoadingBoxArray(whichLevelToRender, renderRange, renderThis, binData);

                    renderedD0s.loadingBox = d3.svg.line()
                            .defined(isNaNVal)
                            .x(renderFunction)
                            .y(yScale.range()[0])
                            .interpolate( interpolationMethod )(lineMissingFilter);

                    //}}}
                } else if (key === 'missing' && !cloudcover) {
                    // render Missing averages//{{{

                    var lineAndMissingFilter = generateMissingArray(whichLevelToRender, renderRange, renderThis, binData);

                    renderedD0s.missingBox = d3.svg.area()
                            .defined(isNaNVal)
                            .x(renderFunction)
                            .y0(yScale.range()[0])
                            .y1(yScale.range()[1])
                            .interpolate( interpolationMethod )(lineAndMissingFilter[1]);

                    renderedD0s[key] = d3.svg.line()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineAndMissingFilter[0]);

                    //}}}
                } else {
                    // render LINES d0s//{{{
                    var lineFilter = [];
                    if (cloudcover && key !== "average") {
                        // do nothing
                    } else if (cloudcover && key === "average") {
                        // get ready the boxes for this

                        lineFilter = binData.getDateRange(
                            [ key ],
                            whichLevelToRender,
                            renderRange,
                            false,
                            renderThis);

                        renderedD0s.average = d3.svg.area()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y0(yScale(0))
                            .y1(yScale(1))
                            .interpolate( interpolationMethod )(lineFilter);

                        createColorGradient("cloudcover1", "cloudgradient", lineFilter);
                    } else {
                        lineFilter = binData.getDateRangeWithMissingValues(
                                key,
                                whichLevelToRender,
                                renderRange,
                                interpolationMethod === "step-after",
                                renderThis);

                        if (0) { // TODO: get rid of this old code
                            // TODO: render a big box, then make and send a linearGradient to be used to set the colors
                            renderedD0s[key] = d3.svg.area()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineFilter);
                        } else {
                            renderedD0s[key] = d3.svg.line()
                            .defined(notNaNVal)
                            .x(renderFunction)
                            .y(valThroughYScale)
                            .interpolate( interpolationMethod )(lineFilter);
                        }
                    }

                    // render LINES d0s}}}
                }

                // update the Ranges of rendered data
                renderedD0s[key + "Ranges"] = [renderRange[0], renderRange[1]];
            } // if we should render anything
        } // for

        // If we rendered anything, see if we need more data from the server
        // AKA see if we didn't have enough data to render the entire domain.
        if (didWeRenderAnything && !waitingForServer) {
            // If we don't have every piece of data in this range, ask for it all.
            if (!binData.haveDataInRange(renderRange, whichLevelToRender, renderThis)) {
                var req = {
                    sensorNumber: sensorNumber,
                    sensorType: sensorType,
                    ms_start: renderRange[0],
                    ms_end: renderRange[1],
                    bin_level: whichLevelToRender
                };

                waitingForServer = true;
                if (dataReq !== undefined && !dataReq(req)) {
                    // if it's too soon, or it failed
                    waitingForServer = false;
                }
            }
        }


        // GENERATE ALL d0s. (generate the lines paths) }}}

        //// SELECTION.EACH ////

        selection.each(doAllTheRendering);

        transitionNextTime = false; // So that this only happens once per button click
        reRenderTheNextTime = false;
        once = false;
    };

    //{{{ Getters and Setters

    my.milliSecondsPerSample = function (value) {
        if (!arguments.length) return milliSecondsPerSample;
        milliSecondsPerSample = value;
        return my;
    };

    my.containerWidth = function (value) {
        if (!arguments.length) return containerWidth;
        if (containerWidth !== value) my.reRenderTheNextTime(true);
        containerWidth = value;
        return my;
    };

    // set the size of the chart
    // or return the size that the chart + everything with it takes up
    my.height = function (value) {
        if (!arguments.length) return (height + margin.bottom + margin.top);
        if (height !== value) my.reRenderTheNextTime(true);
        height = value;
        return my;
    };

    my.whichLevelToRender = function (value) {
        if (!arguments.length) return whichLevelToRender;
        if (whichLevelToRender !== value) my.reRenderTheNextTime(true);
        whichLevelToRender = value - Math.floor(Math.log(oneSample/5) / Math.log(2)); // set the level proportionately to the sample size.
        whichLevelToRender = Math.max(whichLevelToRender, 0);
        return my;
    };

    my.whichLinesToRender  = function (value) {
        if (!arguments.length) return whichLinesToRender;
        if (_.difference(value, whichLinesToRender).length !== 0 ||
            _.difference(whichLinesToRender, value).length !== 0 ) { // contain the different things
                my.reRenderTheNextTime(true);
            }
            whichLinesToRender = value;
            return my;
    };

    my.strokeWidth = function (value) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = value;
        return my;
    };

    my.transitionNextTime = function (value) {
        if (!arguments.length) return transitionNextTime;
        transitionNextTime = value;
        return my;
    };

    my.reRenderTheNextTime = function (value) {
        if (!arguments.length) return reRenderTheNextTime;
        reRenderTheNextTime = value;
        return my;
    };

    my.xScale = function (value) {
        if (!arguments.length) return xScale;

        // if value is the same as xScale, don't modify previousXScale
        if (!xScale) {
            previousXScale = d3.scale.linear(); // now it's initialized.
            previousLevelToRender = whichLevelToRender;
        } else if (xScale.domain()[0] != value.domain()[0] || xScale.domain()[1] != value.domain()[1]) {
            copyScaleWithoutGarbage(previousXScale, xScale);
            previousLevelToRender = whichLevelToRender;
        } // else, don't change previousXScale

        xScale = value;
        //my.reRenderTheNextTime(true);
        return my;
    };

    my.yScale = function (value) {
        if (!arguments.length) return yScale;
        yScale = value;
        //my.reRenderTheNextTime(true);
        return my;
    };

    my.update = function (reRender) {
        my.setSelectedLines();
        //console.log(slctn);
        my(slctn);
    };

    my.showTimeContext = function (show) {
        if (!arguments.length) return showTimeContext;

        showTimeContext = show;
        margin.top = margin.top + (showTimeContext ? shmotg.TIME_CONTEXT_VERTICAL_EACH : 0);

        return my;
    };

    // TODO: make this independent of the actual HTML. Do it through bridgecharts.js instead
    my.setSelectedLines = function () {
        var a = [].map.call (document.querySelectorAll ("#render-lines input:checked"), justValue);
        my.whichLinesToRender(a);

        //my.whichLevelToRender(goToLevel(xScale, milliSecondsPerSample));

        var b = document.querySelector("#render-method input:checked").value;
        if (b !== interpolationMethod) {
            my.reRenderTheNextTime(true);
        }
        interpolationMethod = b;
        return my;
    };

    my.uniqueID = function (value) {
        if (!arguments.length) return sensorType+sensorNumber;
        return my;
    };

    my.sensorType = function (value) {
        if (!arguments.length) return sensorType;
        sensorType = value;
        return my;
    };

    my.sensorNumber = function (value) {
        if (!arguments.length) return sensorNumber;
        sensorNumber = value;
        return my;
    };

    my.yAxisLock = function (value) {
        if (!arguments.length) return yAxisLock;
        if (yAxisLock === true && value === false) {
            // redraw everything
            my.reRenderTheNextTime(true);
            yAxisLock = value;
            my.update();
        }
        yAxisLock = value;
        return my;
    };

    my.addMultiChartChild = function (child) {
        multiChart_childrenCharts.push(child);
    };

    my.makeIntoMultiChart = function (parents, multTrueMinusFalse) {
        binData = multiData(multTrueMinusFalse);
        for(var index = 0; index < parents.length; index++){
            my.addMultiChartParent(parents[index]);
        }
        my.reRenderTheNextTime(true).update();
    };

    my.addMultiChartParent = function (parent) {
        // MUST run my.makeIntoMultiChart ONCE IN TOTAL before this will work.
        multiChart_parentBinnedCharts.push(parent);
        binData.addParentData(parent.bd());
    };

    my.multiChart_parentBinnedCharts = function (value) {
        if (!arguments.length) return multiChart_parentBinnedCharts;
        multiChart_parentBinnedCharts = value;
        return my;
    };

    my.multiChart_childrenCharts = function (value) {
        if (!arguments.length) return multiChart_childrenCharts;
        multiChart_childrenCharts = value;
        return my;
    };

    my.displayThisChart = function (value) {
        if (!arguments.length) return displayThisChart;
        displayThisChart = value;
        return my;
    };

    my.binData = function () { // TODO: just for testing
        return binData;
    };

    my.incomingRequestedData = function (received) {
        var req = received.req; // TODO: multiChart
        if (my.uniqueID() === "" + received.sensorType + received.sensorNumber) {
            my.addDataToBinData(req, received.bin_level).reRenderTheNextTime(true).update();
        }

        // Notify children that there is updated data.
        //_.each(multiChart_childrenCharts, function (child) {
            //child.reRenderTheNextTime(true).update();
        //});
    };

    my.addDataToBinData = function (datas, level) {
        // add data to binData IN THE CORRECT ORDER
        waitingForServer = false;
        var filteredDatas = [];

        if (level === 0) {
            filteredDatas = _.filter(datas, notNaNVal);
        } else {
            filteredDatas = datas;
        }

        if (filteredDatas.length === 0) {
            //console.log("NO DATA");
        } else if (level === 0) {
            binData.addRawData(filteredDatas);
        } else {
            binData.addBinnedData(filteredDatas, level);
        }

        return my;
    };

    my.bd = function () {
        return binData;
    };

    // Getters and Setters }}}

    return my;
};

/* vim: set foldmethod=marker: */











// {{{ Loading Spinner Icon
var myLoader = loader().width(25).height(25);
d3.select("#loader_container").call(myLoader);
/// Loading Spinner Icon }}}

//{{{ ZOOMING AND CHANGING

var supportsOrientationChange = "onorientationchange" in window;
var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
var windowListener = function () {
    if (navigator.userAgent.match(/android/i)) {
        setTimeout(redraw, 500); //Only wait for Android
    } else {
        redraw();
    }
};
window.addEventListener(orientationEvent, windowListener, false);

document.getElementById("render-lines").addEventListener("change", changeLines, false);
document.getElementById("render-method").addEventListener("change", changeLines, false);

// ZOOMING AND CHANGING }}}

//{{{ VARIABLES

var plots = []; //an array of all plots
var msPS = 5; // frequency of data samples

// TODO: sync this with the one in bridgeChart.js
var margin = {top: 20, right: 10, bottom: 25, left: 30 + 90};
var plotHeightDefault = 150;

var zoomSVG = d3.select("#zoomSVG"); // holds zoomRect
var zoomRect = d3.select("#zoomRect"); // overlay which takes scroll/zoom input
var zoomRectGreyOut = d3.select("#zoomRectGreyOut"); // overlay which disables zooming when edit buttons are shown.

// these are the overall scales which are modified by zooming
// they should be set as the default for new plots
// and should show the offline demo data.
var xScale = d3.scale.linear().domain([1325567551000, 1325567552000]).range([0, document.getElementById("chartContainer").offsetWidth]);
var yScale = d3.scale.linear();

var duration = 500; //duration of UI transitions

// VARIABLES }}}

// {{{ SLIDER
var sliderContainerName = "#slider_container";
var curLevel = 0;
var curPos = 0;
var boxSize = 34;
var sliderCallBack = function (pos, i, cameFromZoom) {
    if (curLevel !== i) {
        for (var index = 0; index < plots.length; index++) {
            plots[index].whichLevelToRender(i).update();
        }
        curLevel = i;
    }
    if (curPos !== pos) {
        var scaleFactor = Math.pow(2, pos/boxSize);
        if (!cameFromZoom) {
            rescaleTo(scaleFactor);
        }
        curPos = pos;
    }
};
var mySlider = slider()
    .height(200)
    .width(boxSize*2.5)
    .boxSize(boxSize)
    .changeCallBack(sliderCallBack)
    .numberOfLevels(33);
d3.select(sliderContainerName).call(mySlider);
// SLIDER }}}

//{{{ HELPER FUNCTIONS

var copyScaleWithoutGarbage = function (a,b){
    // copy the properties of b into a
    a.domain()[0] = b.domain()[0];
    a.domain()[1] = b.domain()[1];
    a.range()[0] = b.range()[0];
    a.range()[1] = b.range()[1];
};

function swapItems(array, a, b) {
    array[a] = array.splice(b, 1, array[a])[0];
    return array;
}

function insertItem(array, a, index) {
    array.splice(index, 0, a);
    return array;
}

function insertItemBeforeItem(array, a, beforeThisItem) {
    array.splice(array.indexOf(beforeThisItem), 0, a);
    return array;
}

var getTotalChartHeight = function (plotsArray) {
    var total = 0;
    _.each(plotsArray, function (d, i) {
        total = total + d.height();
    });
    return total;
};

var setAllYAxisLocks = function (toLock) {
    for(var index = 0; index < plots.length; index++) {
        plots[index].yAxisLock(toLock);
    }
};

function insertBeforeDOMPlot(newElementIndex, referenceElementIndex) {
    var parent = document.getElementById("charts");
    var charts = parent.childNodes;
    parent.insertBefore(charts[newElementIndex], charts[referenceElementIndex]); // swap in DOM
}

function plots_filtered() {
    return _.filter(plots, function (d) {
        return d.displayThisChart();
    });
}

var redraw = function () {
    var plotSVGs = d3.select("#charts").selectAll("svg").data(plots_filtered(), function (d, i) { return d.uniqueID(); });

    // Weird hackery to reselect elements and call their specific plot
    // done this way because enter().selectAll().append().call(function(d)) doesn't give us anything useful.
    var plotsCaller = function(d) {
        var allPlots = d[0];

        for(var i = 0; i < allPlots.length; i++) {
            d3.select(allPlots[i]).call(plots_filtered()[i]);
        }
    };

    function swapWithPrevItem(i) {
        if (i-1 < 0 || i >= plots.length) {
            return;
        }

        swapItems(plots, i, i-1); // swap in plots

        insertBeforeDOMPlot(i, i-1); // swap in the DOM
    }

    function swapWithNextItem(i) {
        if (i < 0 || i+1 >= plots.length) {
            return;
        }

        swapItems(plots, i, i+1); // swap in plots

        insertBeforeDOMPlot(i+1, i); // swap in the DOM
    }

    // ENTER
    plotSVGs.enter().append("svg").attr("id", function(d, i) { return d.sensorType() + d.sensorNumber(); });

    // EXIT
    plotSVGs.exit().remove();

    // UPDATE
    plotSVGs.call(plotsCaller);

    // Get list of available-but-not-on-display sensors
    // TODO: put in temperature 1 and cloudcover 1 when they work. (Put them server-side?)
    var sensorsAvailable = ["girder_6",
                            "girder_18",
                            "girder_19",
                            "girder_20",
                            "girder_22",
                            "girder_40",
                            "girder_45"];
    var sensorsShown = _.map(plots, function (d) {
        return d.sensorType() + "_" + d.sensorNumber();
    });
    var toBeAdded = _.difference(sensorsAvailable, sensorsShown);
    var sensorsAvailableObjects = _.map(toBeAdded, function (id) {
        var tmp = id.split("_");
        var sensorType = tmp[0];
        var sensorNumber = parseInt(tmp[1]);
        var result = {};
        result.sensorNumber = function() { return sensorNumber; };
        result.sensorType = function() { return sensorType; };
        return result;
    });

    // Expand chart container when add buttons are present.
    var plotHeight = plots[0] ? plots[0].height() : plotHeightDefault + margin.top + margin.bottom;
    var showingEdits = document.getElementById("edit").checked;
    var offset = showingEdits ? toBeAdded.length*plotHeight : 0;

    // TODO: when add buttons show up and one scroll bar appears, both scroll bars appear.
    for (var index = 0, l = plots.length; index < l; index ++) {
        plots[index].containerWidth(document.getElementById("chartContainer").offsetWidth).update();
    }

    var offset_fix = 8;
    d3.select("#charts").attr("width", document.getElementById("chartContainer").offsetWidth);
    zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
            .transition().duration(duration)
           .attr("height", getTotalChartHeight(plots_filtered()) + offset);
    zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right - offset_fix*2)
            .attr("transform", "translate(" + margin.left + ", " + (margin.top + offset_fix) + ")")
            .attr("height", Math.max(0, getTotalChartHeight(plots_filtered())-offset_fix));
    zoomRectGreyOut.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right - offset_fix*2)
            .attr("transform", "translate(" + margin.left + ", " + (margin.top + offset_fix) + ")")
            .attr("height", Math.max(0, getTotalChartHeight(plots_filtered())-offset_fix))
            .style("opacity", 0.15)
            .style("fill", "#000");

    //{{{ DRAW EDIT ELEMENTS
    var xsize = 70;
    var xspace = 20;
    var xbuffer = 130;
    var width = document.getElementById("chartContainer").offsetWidth - margin.right;

    // Show add/remove buttons
    var add_dat = d3.select("#edit_remove").selectAll("g").data(plots_filtered().concat(sensorsAvailableObjects), function (d) { return "" + d.sensorNumber() + d.sensorType(); });
    var add_dat_enter = add_dat.enter().append("g")
        .style("position", "absolute");
    add_dat_enter.append("img")
        .style("position", "absolute")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .attr("src", "./img/remove.svg")
        .on("click", function(d){ removePlot(d); });
    add_dat_enter.append("img")
        .style("position", "absolute")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .attr("class", "edit_on_top")
        .attr("src", "./img/add.svg")
        .on("click", function(d, i){ addPlot(d.sensorType(), d.sensorNumber()); });

    add_dat.select(".edit_on_top").transition().duration(duration)
        .style("display", "block")
        .style("opacity", function (d) { if (_.contains(plots_filtered(), d)) { return 0; } else { return 1; }})
        .transition().duration(0).style("display", function (d) { if(_.contains(plots_filtered(), d)) { return "none"; } else { return "block"; }});
    add_dat.transition().duration(duration)
        .style("left", (width - xsize) + "px")
        .style("top", function(d,i) { return (i*(plotHeight) + ((plotHeight - xsize) / 2)) + "px"; });

    add_dat.exit().remove();

    // Show swap buttons
    add_dat = d3.select("#edit_swap").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/updown.svg")
        .attr("width", 90)
        .attr("height", 90)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { swapWithPrevItem(i+1); redraw(); });
    add_dat
        .style("left", xbuffer + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 20) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // Show add button text
    add_dat = d3.select("#edit_add").selectAll("text").data(sensorsAvailableObjects, function (d) { return "" + d.sensorNumber() + d.sensorType(); });
    add_dat.enter().append("text")
        .attr("class", "sensor_title_add")
        .attr("cursor", "default")
        .text(function (d) { return d.sensorType().capitalize() + " " + d.sensorNumber(); })
        .style("opacity", 1);
    add_dat.transition().duration(duration)
        .attr("x", width - 15)
        .attr("y", function(d,i) { return (getTotalChartHeight(plots_filtered()) + i*(plotHeight) + (plotHeight/4)); });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();

    // Show combine with multiplication buttons
    add_dat = d3.select("#edit_mult").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/mult.svg")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { addMultiChart(i, i+1, true); redraw(); });
    add_dat
        .style("left", (xbuffer + 90) + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 30) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // Show combine with division buttons
    add_dat = d3.select("#edit_minus").selectAll("img").data(plots_filtered().slice(0, plots_filtered().length-1));
    add_dat.enter().append("img")
        .style("position", "absolute")
        .attr("src", "./img/minus.svg")
        .attr("width", xsize)
        .attr("height", xsize)
        .attr("cursor", "pointer")
        .on("click", function(d, i) { addMultiChart(i, i+1, false); redraw(); });
    add_dat
        .style("left", (xbuffer + 180) + "px")
        .style("top", function(d,i) { return ((plotHeight/2 + 30) + i*(plotHeight) + ((plotHeight - 90) / 2)) + "px"; });
    add_dat.exit().transition().duration(duration/2).style("opacity", 0).transition().remove();
    add_dat.exit().remove();

    // DRAW EDIT ELEMENTS }}}

    //update the zoom for the new plot size
    updateZoom();
};

function removePlot(p) {
    printArrayOfPlots(plots_filtered());
    // Show each of this plot's parents
    var plt = _.find(plots, function (d) {
        return p.sensorNumber() === d.sensorNumber() && p.sensorType() === d.sensorType();
    });

    for (var i = 0, l = plt.multiChart_parentBinnedCharts().length; i < l; i++) {
        var d = plt.multiChart_parentBinnedCharts()[i];
        //d.displayThisChart(true); // TODO: instead of this, just delete it and recreate it.
        var ty = d.sensorType();
        var nu = d.sensorNumber();
        plots.splice(plots.indexOf(d), 1);
        addPlot(d.sensorType(), d.sensorNumber());
        //redraw();
        //console.log(plots_filtered().indexOf(plt), plots_filtered().length - 1);
        //insertBeforeDOMPlot(plots_filtered().indexOf(plt), plots_filtered().length - 1); // modify the DOM
    }

    // TODO: move the new plots in front of the old plot in the DOM
    //insertBeforeDOMPlot(plots_filtered().indexOf(plt), plots_filtered().length - 1); // modify the DOM

    // Find the chart in the plots array
    var match = _.find(plots, function (d) {
        return d.sensorNumber() === plt.sensorNumber() &&
            d.sensorType() === plt.sensorType();
    });
    var index = plots.indexOf(match);
    if(index === -1) { console.log("PLOT NOT IN PLOTS"); }

    // Remove the chart from the plots array
    plots.splice(index, 1);

    redraw();
}

function printArrayOfPlots(array) {
    console.log(_.map(array, function (d) {
        return d.sensorType() + "-" + d.sensorNumber();
    }));
}

function addMultiChart (parentAIndex, parentBIndex, multTrueMinusFalse) {
    var parentA = plots[parentAIndex];
    var parentB = plots[parentBIndex];
    var interval = 5;
    var divider = multTrueMinusFalse ? 'x' : '-';
    var plt = initPlot({}, function(){}, interval, parentA.sensorType(), parentA.sensorNumber() + divider + parentB.sensorNumber(), curLevel, false, true);
    plt.makeIntoMultiChart([parentA, parentB], multTrueMinusFalse);
    parentA.addMultiChartChild(plt);
    parentB.addMultiChartChild(plt);

    // Insert the new plot where it should be in plots and in the DOM
    insertBeforeDOMPlot(plots_filtered().indexOf(plt), parentAIndex); // modify the DOM
    putLastItemBeforeIndex(plots, parentAIndex); // modify plots TODO: is this even necessary ??

    // Set both parents as invisible.
    parentA.displayThisChart(false);
    parentB.displayThisChart(false);

    redraw();
}

function putLastItemBeforeIndex(array, a) {
    array.splice(a, 0, array.pop());
    return array;
}

function addPlot (sensorType, sensorNumber) {
    var data = sensorType === "girder" ? {} : {}; // TODO: put special case here for temperature data.
    var interval = 5; // TODO: put special case here for temperature data.
    initPlot(data, sendRequestToServer, interval, sensorType, sensorNumber, curLevel);
}

function setAllPlotLevels() {
    plots.forEach(function (plt) {
        plt.whichLevelToRender(curLevel).update();
    });
}

function transitionAllNextTime() {
    plots.forEach(function (plt) {
        plt.transitionNextTime(true);
    });
}

function setLoadingIcon(on) {
    d3.select("#loader_container").style("opacity", on ? 1 : 0);
    d3.selectAll(".loadingBox").style("opacity", on ? 1 : 0);
    myLoader.isShowing(on);
}

function initPlot(data, sendReq, oneSample, sensorType, sensorNumber, level, cloudcover, isMulti) {
    var plot;
    plot = binnedLineChart(data, sendReq, sensorType, sensorNumber, oneSample, level, cloudcover, isMulti);
    plot.xScale(xScale.copy());

    plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(plotHeightDefault).showTimeContext(true).milliSecondsPerSample(msPS);//.update();

    plots.push(plot);

    redraw();

    d3.select("#charts").attr("height", getTotalChartHeight(plots_filtered())).attr("width", document.getElementById("chartContainer").offsetWidth); //TODO: make this dynamic

    zoomRect.attr("fill", "rgba(0,0,0,0)")
            .call(zoom);

    // Redefine this function now that we have data for it to work from
    updateZoom = function () {
        zoomAll();
        xScale = plot.xScale();
        yScale = plot.yScale();
        zoom.x(xScale);
        xScale.range([0, document.getElementById("chartContainer").offsetWidth]);
        //zoom.y(yScale); // This breaks proper updating of the y axis when you scroll left and right.
    };

    updateZoom();
    return plot;
}

// this will be changed once 'news' is sent from the server
// for now it's just a dummy
var updateZoom = function () { return 0; };
var oldXScale = d3.scale.linear();

function zoomAll() {
    // adjust slider
    var scal = getScaleValue(xScale);
    var newPos = boxSize * (Math.log(scal) / Math.log(2));
    var index = 0;

    if (mySlider.pastExtents(newPos)) {
        var tmpScale = oldXScale.copy();

        for(index = 0; index < plots.length; index++){
            plots[index].xScale(tmpScale.copy()).update();
        }
        xScale = tmpScale.copy();

        zoom.x(xScale);
    } else {
        mySlider.scrollPosition(newPos).update(true);

        // set plot scales
        for(index = 0; index < plots.length; index++){
            plots[index].xScale(xScale).update();
        }
    }

    copyScaleWithoutGarbage(oldXScale, xScale);
}

var zoom = d3.behavior.zoom()
    .on("zoom", zoomAll);


function changeLines () {
    plots.forEach(function (plt) {
        plt.setSelectedLines()/*.reRenderTheNextTime(true)*/.update();
    });
}

function rescaleTo(val) {
    var xdist = xScale.domain()[1] - xScale.domain()[0];

    var oldScaleVal = getScaleValue(xScale);
    var oldZoomScale = zoom.scale();

    // We want the new scale value to be val
    var newDist = (xScale.range()[1] - xScale.range()[0]) / val;

    // Calculate where the domain needs to move, and move it
    var displacement = (newDist - xdist) / 2;
    var tmpScale = d3.scale.linear().range(xScale.range());
    tmpScale.domain([
        xScale.domain()[0] - displacement,
        xScale.domain()[1] + displacement
    ]);

    // update the scale if it's within the extents
    xScale = tmpScale;

    // reset the x scale so zooming still works
    zoom.x(xScale);

    zoomAll();
}

function getScaleValue(scal) {
    // gives a result which has units pixels / samples
    return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
}

function zoomin() {
    changeZoom(
        function (a, b) { return a + (b/4); },
        function (a, b) { return a - (b/4); }
    );
}

function zoomout() {
    changeZoom(
        function (a, b) { return a - (b/2); },
        function (a, b) { return a + (b/2); }
    );
}

function scrollleft() {
    changeZoom(
        function (a, b) { return a + (b/4); },
        function (a, b) { return a + (b/4); }
    );
}

function scrollright() {
    changeZoom(
        function (a, b) { return a - (b/4); },
        function (a, b) { return a - (b/4); }
    );
}

// HELPER FUNCTIONS }}}

//{{{ SERVER COMMUNICATIONS

var socket = io.connect('130.179.231.28:8080/');
var firstTime = true;

//socket.on('connect_failed', function () {
//  console.log("connect_failed :(");
//});
//
//socket.on('connecting', function () {
//  console.log("connecting :!");
//});
//
//socket.on('connect', function () {
//  console.log("connected !!");
//});
//
//socket.on('disconnect', function () {
//  console.log("disconnected !!");
//});

socket.on('news', function (data) {
    // only do this once, so that plots don't get overlapped whenever the server restarts.
    if (!firstTime) {
        return;
    }
    firstTime = false;

    socket.emit('ack', "Message received!");

    initPlot({}, sendRequestToServer, 5, "girder", 18, curLevel);
    //initPlot({}, sendRequestToServer, 5, "girder", 19, curLevel);
    //initPlot({}, sendRequestToServer, 5, "girder", 20, curLevel);
});

var sizeOfQueue = function() {
    var size = 0, key;
    for (key in serverQueue) {
        if (serverQueue.hasOwnProperty(key)) size++;
    }
    return size;
};

var removeFromQueue = function (key) {
    delete serverQueue[key];
};

// things which we are waiting for the server to send to us
var serverQueue = {};

function addToServerQueue(ob) {
    serverQueue[ob.id] = ob.req;
}

var uniqueRequestID = 0;
var listOfRequestsMade = [];

function sendRequestToServer(req) {
    if(_.findWhere(listOfRequestsMade, {sensorNumber: req.sensorNumber, sensorType: req.sensorType, ms_start: req.ms_start, ms_end: req.ms_end, bin_level: req.bin_level})) {
        // never request the same thing twice
        return false;
    }

    // turn on loading icon
    setLoadingIcon(true);

    listOfRequestsMade.push(req);

    // wrap the req with a unique id
    var sendReq = {
        id: uniqueRequestID,
        req: req
    };

    uniqueRequestID = uniqueRequestID + 1;

    // add the request to the queue
    addToServerQueue(sendReq);

    socket.emit('req', JSON.stringify(sendReq));
    return true;
}

socket.on('req_data', function (data) {
    var received = JSON.parse(data);
    // remove request from server queue
    removeFromQueue(received.id);

    // deactivate loading icon
    if (sizeOfQueue() === 0) {
        setTimeout(disableLoadingIfQueueIsEmpty, 100);
    }

    for (i=0;i<plots.length;i++) {
        plots[i].incomingRequestedData(received);
    }
});

var disableLoadingIfQueueIsEmpty = function () {
    if (sizeOfQueue() === 0) {
        setLoadingIcon(false);
    }
};

// SERVER COMMUNICATIONS }}}

//{{{ OFFLINE DATA

//offlinedata();
//setTimeout(function() { offlinedata(); }, 200);


function offlinedata() {
    var plt = initPlot([], function(){}, 1000*60*60, "temperature", 1, curLevel);
    var plt2 = initPlot([], function(){}, 1000*60*60, "cloudcover", 1, curLevel, true, true);

    var filenames = [ "weather/eng-hourly-01012012-01312012.csv",
                      "weather/eng-hourly-02012012-02292012.csv",
                      "weather/eng-hourly-03012012-03312012.csv",
                      "weather/eng-hourly-04012012-04302012.csv",
                      "weather/eng-hourly-08012011-08312011.csv",
                      "weather/eng-hourly-09012011-09302011.csv",
                      "weather/eng-hourly-10012011-10312011.csv",
                      "weather/eng-hourly-11012011-11302011.csv",
                      "weather/eng-hourly-12012011-12312011.csv" ];
    for(var x = 0; x < filenames.length; x++){
        addWeatherData(filenames[x], plt);
        addCloudCoverData(filenames[x], plt2);
    }

    function addWeatherData (filename, plt) {
        d3.csv(filename, function (d, i) {
            var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
            return {val: parseFloat(d.Temp), ms: dat.getTime()};
        }, function (error, rows) {
            if (error) {
                console.log("error");
                return;
            }

            plt.addDataToBinData(rows, 0);
        });
    }

    function addCloudCoverData (filename, plt) {
        d3.csv(filename, function (d, i) {
            var dat = new Date(d.Year, d.Month-1, d.Day, d.Time[0]+""+d.Time[1]);
            var val = (d.Weather === "Clear" || d.Weather === "Mainly Clear") ? 1 : 0;
            return {val: val, ms: dat.getTime()};
        }, function (error, rows) {
            if (error) {
                console.log("error");
                return;
            }

            plt.addDataToBinData(rows, 0);
        });
    }
}

// OFFLINE DATA }}}

// set up the slider.
rescaleTo(Math.pow(2, mySlider.handlePosition() / boxSize));

// {{{ EDITABLES
d3.select("#edit").on("click", toggleEditables);

function toggleEditables() {
    var active = document.getElementById("edit").checked;
    if (active) {
        d3.select("#edit_remove").style("display", "block");
        d3.select("#edit_add").style("display", "block");
        d3.select("#edit_swap").style("display", "block");
        d3.select("#edit_mult").style("display", "block");
        d3.select("#edit_minus").style("display", "block");
        d3.select("#zoomRectGreyOut").style("display", "block");
    } else {
        d3.select("#edit_remove").style("display", "none");
        d3.select("#edit_add").style("display", "none");
        d3.select("#edit_swap").style("display", "none");
        d3.select("#edit_mult").style("display", "none");
        d3.select("#edit_minus").style("display", "none");
        d3.select("#zoomRectGreyOut").style("display", "none");
    }
    redraw();
}
toggleEditables();
// EDITABLES }}}

/* vim: set foldmethod=marker: */


