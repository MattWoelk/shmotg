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
