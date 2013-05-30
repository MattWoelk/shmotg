// This is binnedData. A convenient way of storing binned data

//{{{ CONSTANTS
var MAX_NUMBER_OF_BIN_LEVELS = 34; // keep sync'd with ../binnedChart.js
var MAX_NUMBER_OF_ITEMS_PER_ARRAY = 5;
// TODO: phase this out (preferable) OR set it as a really high number

/// CONSTANTS }}}

binnedData = function () {

    //{{{ VARIABLES
    var bd = { // where all of the data is stored
        keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
        rawData : {
            color: '#000',
            opacity: 0.5,
            levels: [], // stores all of the values for each level in an array of objects (MAX_NUMBER_OF_ITEMS_PER_ARRAY).
                        // with one key for each range of object, up to a maximum size
                        // example: [{ ms_since_epoch: [{val: 1.7, ms: ms_since_epoch}, {val: 2.3, ms: ms_since_epoch}] }, [etc.]]
        },
        average : {
            color : '#F00',
            opacity: 1,
            func   : function (a, b) { return (a+b)/2; },
            levels: [],
        },
        maxes : {
            color : '#000FB5',
            opacity: 1,
            func   : function (a, b) { return d3.max([a,b]); },
            levels: [],
        },
        mins : {
            color : '#00B515',
            opacity: 1,
            func   : function (a, b) { return d3.min([a,b]); },
            levels: [],
        },
        q1 : {
            color : '#800',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
            levels: [],
        },
        q3 : {
            color : '#800',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: [],
        },
        quartiles : {
            color : '#800',
            opacity: 0.3,
            //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: [],
        },
    }; // where everything is stored

    // VARIABLES }}}

    //{{{ HELPER METHODS

    // TODO: use this instead of manually doing it everywhere
    function binSize (lvl) {
        var oneSample = 1000 / 200; // milliseconds per sample
        return Math.pow(2, lvl) * oneSample;
    }

    function getKeyForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin [at this
        //       level] in which this ms would fit.

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, lvl) * oneSample;

        return Math.floor(ms / ( Math.pow(2, lvl) * sampleSize )) * sampleSize;
    }

    function splitAndApplyToEachWithOverflowAtLevel (data, func, lvl) {
        // - data is split into sections
        // - func will be applied to each binnedData at level lvl
        //   using the split data

        // TODO TODO TODO: test this function!

        var splitData = splitIntoBinsAtLevel(data, lvl);

        for (prop in splitData) {

            // Create if we don't have:
            if( !bds[lvl] ) { bds[lvl] = {}; }
            if( !bds[lvl][prop] ) { bds[lvl][prop] = binnedData(maxNumberOfBins); }

            var overflow = func.call(bds[lvl][prop], splitData[prop]);
            //console.log("overflow:", overflow);
            // TODO: May have to use apply instead
            //       so as to transfer arguments

            //while (overflow){
                // TODO TODO: handle overflows!
            //}
        }

    }

    function callForAllAtLevelAndCombineResults (func, lvl) {
        // func must return an array

        var result = [];

        for (key in bds[lvl]) {
            var res = func(bds[lvl][key]);

            if(isArray(res)) {
                result = result.concat(res);
            } else if (res.hasOwnProperty("rawData") || res.hasOwnProperty("average")) {
                if (isArray(result)) { result = binnedData(); }

                if (lvl === 0) {
                    result.addRawData(res.rawData.levels[0]);
                }else {
                    result.addBinnedData(res);
                }

            } else {
                result = binnedData().combineAndSortArraysOfDateValObjects(result, res);
            }
        }

        return result;
    }

    function doWeHaveBinsForThisRangeAndLevel (rng, lvl) {
        // TODO: calculate the key we're looking for
        if (key in bds[lvl]) {
        }
        return false;
    }

    function isArray(a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    function getSurroundingBins (start, end, lvl) {
        // return all bin starts at this level between start and end
        // INCLUDING the highest point if it is equal to end

        var oneSample = 1000 / 200; // milliseconds per sample
        var binSize = Math.pow(2, lvl) * oneSample;

        var startRounded = getKeyForTimeAtLevel(start, lvl);

        return _.range(startRounded, end+1, binSize);
    }

    function splitIntoBinsAtLevel (data, lvl) {
        // TODO: round level down to nearest maxNumberOfBins
        //       then separate the data out into a structure:
        //       { '0': [{ms: 3}, {ms: 4}]
        //         '5': [{ms: 5}, {ms: 9}]}
        //       This function is to be used when adding raw data
        // Assumption: data is ordered and continuous

        return _.groupBy(data, function (d) {
            return getKeyForTimeAtLevel(d.ms, lvl);
        });
    }

    function rebin (range_to_rebin, level_to_rebin) {
        var tic = new Date();
        for (var keyValue in bd.keys) {
            var key = bd.keys[keyValue];
            bd[key].levels[0] = bd.rawData.levels[0]; // update raw data from the source
        }


        // for each level other than raw data level, for each key, bin the data from the lower level
        for (var j = level_to_rebin + 1; j < MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
            for (var keyValue in bd.keys) { // for each of 'average', 'max', 'min', etc.
                var key = bd.keys[keyValue];

                // bin and store data from lower bin
                var newData = binTheDataWithFunction(bd, j-1, key, bd[key].func, range_to_rebin);
                if (newData.length === 0) {
                    continue;
                }

                // get range of newly binned data
                var range = d3.extent(newData, function (d) { return d.ms; });

                // What was already in this bin level
                var oldUnfiltered = _.filter(bd[key].levels[j], function (d) { return true; });

                // Combine what was already there and what was just calculated
                // - What was already in this bin level gets precedence
                //   over what is being binned from the lower level
                bd[key].levels[j] = combineAndSortArraysOfDateValObjects(oldUnfiltered, newData);
            } // for each key
        } // for each bin level
        //console.log("rebin time:", new Date() - tic);
    }


    // Bin the data in a level into abstracted bins
    // TODO: This is where the problem is
    //       The bins must all have 0ms as a point-of-reference
    //       so that they don't get rendered differently on the
    //       server and the client.
    //       To fix this, choose whether or not to skip certain
    //       values which are being binned.
    //       If they are being skipped, the next one will be the
    //       first of the two samples to be binned.
    function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin) { // TODO: use range_to_rebin to speed up this function
        var bDat = new Array();
        if (!bin[key].levels[curLevel]) {
            return bDat;
        }

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, curLevel) * oneSample;

        // TODO TODO TODO: for efficiency, do this in reverse:
        // ??? see which bins need to be created
        // (perhaps store which these are when data is being added)
        // then only calculate the new bins.
        // this will save MUCH time

        for(var i = 0; i < bin[key].levels[curLevel].length; i = i + 2){
            // If we are at a bad spot to begin a bin, decrement i by 1 and continue;
            var sampleIsAtModularLocation = bin.q1.levels[curLevel][i].ms % (Math.pow(2, curLevel+1) * 5) === 0;
            var nextSampleExists = bin.q1.levels[curLevel].length > i + 1;
            //console.log("nextSampleExists", nextSampleExists, bin.q1.levels[curLevel].length, i + 1);
            var nextSampleIsRightDistanceAway = nextSampleExists ?
                bin.q1.levels[curLevel][i+1].ms - bin.q1.levels[curLevel][i].ms === sampleSize :
                true;

            //if (nextSampleExists) {
            //  console.log(bin.q1.levels[curLevel][i+1].ms - bin.q1.levels[curLevel][i].ms);
            //}

            //console.log(i, sampleIsAtModularLocation, nextSampleExists, nextSampleIsRightDistanceAway);

            if (!sampleIsAtModularLocation || !nextSampleExists || !nextSampleIsRightDistanceAway) {
                // TODO: Magic: 5 is the number of ms per sample
                // This is here so that both the server and client's bins start and end at the same place
                // no matter what range of data they have to work with.
                i = i - 1;
                continue;
            }

            if (bin[key].levels[curLevel][i+1]){
                var newdate = bin.q1.levels[curLevel][i/*+1*/].ms;

                if (key === 'q1' || key === 'q3') {
                    bDat.push({ val:  func(
                        bin.q1.levels[curLevel][i].val,
                        bin.q1.levels[curLevel][i+1].val,
                        bin.q3.levels[curLevel][i].val,
                        bin.q3.levels[curLevel][i+1].val)
              , ms: newdate }); // This is messy and depends on a lot of things
                }else{
                    bDat.push( { val: func(
                        bin[key].levels[curLevel][i].val,
                        bin[key].levels[curLevel][i+1].val)
              , ms: newdate });
                }
            }
        }
        return bDat;
    };

    function getTwoLargest (array) {
        var arr = array.slice();
        first = d3.max(arr);
        arr.splice(arr.indexOf(first),1);
        second = d3.max(arr);
        return [first, second];
    };

    function average (array) {
        return d3.sum(array)/array.length;
    };

    function getTwoSmallest (array) {
        var arr = array.slice();
        first = d3.min(arr);
        arr.splice(arr.indexOf(first),1);
        second = d3.min(arr);
        return [first, second];
    };

    function combineAndSortArraysOfDateValObjects (arr1, arr2) {
        // Add the objects from arr2 (array) to arr1 (array)
        //   only if the object from arr2 has a ms value
        //   which no object in arr1 has.
        // AKA: arr1 gets precedence
        //var result = arr1.concat(_.filter(arr2, function(d) {
        //  var b = !_.some(arr1, function(g) {
        //    return d.ms === g.ms;
        //  });
        //  return b;
        //}));

        var arr1_range = d3.extent(arr1, function (d) { return d.ms; });

        if (!arr1_range[0]) { arr1_range = [999999999999999999, -99999999999999]; }
        var filteredArr2Low = _.filter(arr2, function (d) { return d.ms < arr1_range[0]; });
        var filteredArr2High = _.filter(arr2, function (d) { return d.ms > arr1_range[0]; })

        var result = filteredArr2Low.concat(arr1,filteredArr2High);

        // sort the result
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
    }

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addRawData = function (rData, dontBin) {
        var q = new Date();
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // make this level if it does not yet exist
        if (!bd.rawData.levels[0]) { bd.rawData.levels[0] = []; }

        bd.rawData.levels[0] = combineAndSortArraysOfDateValObjects(bd.rawData.levels[0], rData);

        var range = d3.extent(bd.rawData.levels[0], function(d) { return d.ms; });

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    }

    my.replaceRawData = function (rData, dontBin) {
        var q = new Date();
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // make this level if it does not yet exist
        if (!bd.rawData.levels[0]) { bd.rawData.levels[0] = []; }

        bd.rawData.levels[0] = rData;

        var range = d3.extent(bd.rawData.levels[0], function(d) { return d.ms; });

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    }

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

        for (var k in bd.keys) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];
            //if we don't have a lvl for this already, initialize one
            if (!bd[key]) {
                bd[key] = {};
            }

            if (!bd[key].levels) {
                bd[key].levels = [];
            }

            if (!bd[key].levels[lvl]) {
                bd[key].levels[lvl] = [];
            }

            if(bData[key].levels) {
                bd[key].levels[lvl] = combineAndSortArraysOfDateValObjects(bd[key].levels[lvl], bData[key].levels[lvl]);
            }
        }; // for each of max_val, min_val, etc.

        var range = [];
        if ( bd.rawData.levels[lvl] ) {
            range = d3.extent(bd.rawData.levels[lvl], function(d) { return d.ms; });
        }

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    }

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

        for (var k in bd.keys) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];
            //if we don't have a lvl for this already, initialize one
            if (!bd[key].levels[lvl]) {
                bd[key].levels[lvl] = [];
            }

            if(bData[key].levels) {
                bd[key].levels[lvl] = bData[key].levels[lvl];
            }
        }; // for each of max_val, min_val, etc.

        var range = [];
        if ( bd.rawData.levels[lvl] ) {
            range = d3.extent(bd.rawData.levels[lvl], function(d) { return d.ms; });
        }

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    }


    my.haveDataInRange = function(ms_range, level) {
        // Determine the number of samples which we should have in the given range.

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var datedRange = my.getDateRange(key, level, ms_range);

        if (datedRange.length === 0) {
            return false;
        }

        var firstSample = datedRange[0].ms;
        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, level) * oneSample;

        if (firstSample > ms_range[0] + sampleSize) {
            return false;
        }

        var actualRange = ms_range[1] - firstSample;
        var numberWeShouldHave = Math.floor(actualRange / sampleSize);

        var numberWeHave = datedRange.length;

        return numberWeHave >= numberWeShouldHave;
    }

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // Return which bins which we are missing in the given range and level.
        // returns [[start, end],[start,end],...] ranges of required data

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var oneSample = 1000 / 200; // milliseconds per sample TODO: magic ?
        var fir = Math.floor(ms_range[0] / (Math.pow(2, level) * oneSample));
        var las = Math.floor(ms_range[1] / (Math.pow(2, level) * oneSample));

        var normalizedRange = [ fir * Math.pow(2, level) * oneSample,
            (las + 1) * Math.pow(2, level) * oneSample ];
            var datedRange = my.getDateRange(key, level, normalizedRange);

            if (datedRange.length === 0) {
                console.log(",.-' jumping ship. had nothing in range");
                // TODO TODO TODO this should not be happening when
                // we already have the data!
                if (samplesInsteadOfRanges) { return ms_range[0]; }
                return [ms_range];
            }


            var sampleSize = Math.pow(2, level) * oneSample;

            var neededBins = _.range(normalizedRange[0], normalizedRange[1], sampleSize);
            neededBins.forEach(function (d) {
                d = d * Math.pow(2, level) * oneSample;
            });

            //console.log("    neededBins:", neededBins);
            //console.log("    binsWeHave:", _.pluck(datedRange, 'ms'));

            var missingSamples = inAButNotInB(neededBins, _.pluck(datedRange, 'ms'));

            if(samplesInsteadOfRanges) { return missingSamples; }

            //console.log("    missingSamples[0]:", missingSamples[0]);
            //console.log("    actually missing?", !_.findWhere(bd.rawData.levels[0], {ms: missingSamples[0]}));
            var missingRanges = [];

            _.each(missingSamples, function (d,i) {
                missingRanges.push([d, d + sampleSize]);
                // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
            });

            return missingRanges; // form: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    }

    my.missingRawBinsUnderThisRangeAndLevel = function (ms_range, level) {
        var currentMissingBinStarts = my.missingBins(ms_range, level);
        var nextMissingBinStarts = [];

        console.log("levels:");
        //console.log(bd.average.levels);

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, level) * oneSample;

        //console.log("currentMissingBinStarts", currentMissingBinStarts);

        // for each level, going DOWN to zero:
        for(var lvl = level; lvl >= 0; lvl--) {
            sampleSize = Math.pow(2, lvl);
            //console.log("level", lvl);

            // for each range
            // - find which bins are missing in the previous level's ranges
            for(var rng = 0; rng < currentMissingBinStarts.length; rng++) {
                //console.log("  checking range", currentMissingBinStarts[rng]);
                // add the start of each missing range found within
                // the above missing range
                nextMissingBinStarts.push(my.missingBins(currentMissingBinStarts[rng], lvl, true));
            }

            // swap the variables
            var flattened = _.uniq(_.flatten(nextMissingBinStarts).sort());


            var missingRanges = [];
            _.each(flattened, function (d,i) {
                missingRanges.push([d, d + sampleSize]);
                // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
            });
            //console.log("  level", lvl, "was missing", missingRanges);
            currentMissingBinStarts = missingRanges;
            nextMissingBinStarts = [];
        }

        return currentMissingBinStarts;
    }

    my.getMinRaw = function () {
        return d3.min(bd.rawData.levels[0], function(d) { return d.val; });
    }

    my.getMaxRaw = function () {
        return d3.max(bd.rawData.levels[0], function(d) { return d.val; });
    }

    my.getMinRawMS = function () {
        if (!bd.rawData.levels[0])
            return -1;
        return d3.min(bd.rawData.levels[0], function(d) { return d.ms; });
    }

    my.getMaxRawMS = function () {
        if (!bd.rawData.levels[0])
            return -1;
        return d3.max(bd.rawData.levels[0], function(d) { return d.ms; });
    }

    my.getColor = function (key) {
        return bd[key].color;
    }

    my.getOpacity = function (key) {
        return bd[key].opacity;
    }

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
            send_req[theKeys[i]].levels[lvl] = my.getDateRange(theKeys[i], lvl, range);
        }

        return send_req;
    }

    my.getDateRange = function (key, lvl, range) {
        // filter an array so that we don't render much more
        // than the required amount of line and area

        var result = [];

        _.each(bd[key].levels[lvl], function (dat, k) {
            // d is the array, k is the key for this object

            if (range[0] <= parseInt(k) && range[1] >= parseInt(k) + binSize(lvl)) {
                // requested range surrounds this bin container
                // add all of it
                result.concat(dat);
            } else if (range[1] < parseInt(k) || range[0] >= parseInt(k) + binSize(lvl)) {
                // requested range is below or above this bin container
                // do nothing
            } else {
                // requested range intersects this bin container
                result.concat(_.filter(dat, function (d, i) {
                    return d.ms <= range[1] && d.ms >= range[0];
                }));
            }

            if (range[0] < parseInt(k) + binSize(lvl) || range[1] >= parseInt(k)) {
                // TODO: add the corresponding data to result
                result.concat();
            }
        });
    }

    my.removeAllLevelsBelow = function(LowestLevel) {
        //TODO
        for(var i = 0; i < LowestLevel; i++) {
            for(k in bd.keys) {
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
    }

    my.getKeys = function () {
        return bd.keys.slice(0); // give a copy of the array
    }

    my.bd = function () { // TODO: JUST FOR TESTING
        return bd;
    }


    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
