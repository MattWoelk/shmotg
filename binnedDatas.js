// This is binnedDatas. A convenient way of storing binnedData objects for
// speed. This is an alternative to storing all of the data in one giant
// binnedData object.

// TODO: remove these requires! They are just for testing!

binnedDatas = function (maxbins) {

    //{{{ INITIALIZATION (runs once)
    //assert(getKeyForTimeAtLevel (11, 0), 10, "get key 11, 0");
    //assert(getKeyForTimeAtLevel (11, 1), 10, "get key 11, 1");
    //assert(getKeyForTimeAtLevel (11, 2), 0,  "get key 11, 2");

    //assertDirect(
    //    splitIntoBinsAtLevel([{ms: 3},{ms: 5},{ms: 7},{ms: 9},], 0),
    //        {'0': [{ms: 3}],
    //         '5': [{ms: 5}, {ms: 7}, {ms: 9}]},
    //    "splitIntoBinsAtLevel, 0");

    //assert(getSurroundingBins(0, 16, 0), [0, 5, 10, 15], "all between 1");
    //assert(getSurroundingBins(2, 20, 0), [0, 5, 10, 15, 20], "all between 2");

    // INITIALIZATION }}}

    //{{{ VARIABLES

    var maxNumberOfBins = maxbins ? maxbins : 3;

    var bds = []; // array of objects of binData'
                  // [
                  //  { '0': binData(), '5':   binData()}, // level 0
                  //  { '0': binData(), '20':  binData()}, // level 2
                  //  { '0': binData(), '80':  binData()}, // level 4
                  //  { '0': binData(), '320': binData()}  // level 8
                  // ]
                  // This diagram ^^^ shows the result when
                  // maxNumberOfBins is 2

    var colors = {
        rawData : '#000',
        average : '#F00',
        maxes : '#000FB5',
        mins : '#00B515',
        q1 : '#800',
        q3 : '#800',
        quartiles : '#800',
    };

    var opacities = {
        rawData : 0.5,
        average : 1,
        maxes : 1,
        mins : 1,
        q1 : 1,
        q3 : 1,
        quartiles : 0.3,
    };

    /// VARIABLES }}}

    //{{{ HELPER METHODS

    function sizeOf (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    function inAButNotInB(arr1, arr2) {
      return _.filter(arr1, function (d) {
        return !_.contains(arr2, d);
      });
    }

    function assertDirect(a, b, test) {
      if(a.toString().localeCompare(b.toString()) === 0) {
        console.log("+ Passed:", test);
      } else {
        console.log("- "+red+"Failed"+reset+":", test);
        console.log("  Result is", a);
        console.log("  Should be", b);
      }
    }

    function assert(a, b, test) {
      if(inAButNotInB(a, b).length === 0 && inAButNotInB(b, a).length === 0) {
        console.log("+ Passed:", test);
      } else {
        console.log("- "+red+"Failed"+reset+":", test);
        console.log("  Result is", a);
        console.log("  Should be", b);
      }
    }

    function getKeyForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin [at this
        //       level] in which this ms would fit.

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, lvl) * oneSample;

        return Math.floor(ms / ( Math.pow(2, lvl) * sampleSize )) * sampleSize;
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

    function getSurroundingBins (start, end, lvl) {
        // return all bin starts at this level between start and end
        // INCLUDING the highest point if it is equal to end

        var oneSample = 1000 / 200; // milliseconds per sample
        var binSize = Math.pow(2, lvl) * oneSample;

        var startRounded = getKeyForTimeAtLevel(start, lvl);

        return _.range(startRounded, end+1, binSize);
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

    // HELPER METHODS }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    }

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addRawData = function (data, dontBin) {
        splitAndApplyToEachWithOverflowAtLevel(
            data,
            binnedData().addRawData,
            0);

        return my;
    }

    my.replaceRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // clear all raw data
        for (var i in bds[0]) {
            bds[0][i].replaceRawData([]);
        };

        // replace it with new data
        splitAndApplyToEachWithOverflowAtLevel(
            data,
            binnedData().replaceRawData,
            0);

        return my;
    }

    my.addBinnedData = function (bData, lvl, dontBin) {
        // TODO TODO
        // TODO: take into account different keys ('average', 'q1'...)

        // TODO: make a binnedData object, then call getDateRange
        //       on it for each bin

        var tmpBinnedData = binnedData();
        tmpBinnedData.addBinnedData(bData, lvl, dontBin);

        return my;
    }

    my.replaceBinnedData = function(bData, lvl, dontBin) {
        // TODO TODO
        return my;
    }

    my.haveDataInRange = function(ms_range, level) {
        // TODO TODO
        return my;
    }

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // TODO TODO
        return my;
    }

    my.missingRawBinsUnderThisRangeAndLevel = function (ms_range, level) {
        // TODO TODO
        return my;
    }

    my.getMinRaw = function () {
        // pick the minimum bin (highest key) in bds level 0
        // and ask for the lowest raw value

        var lowestValue = 999999;

        for (key in bds[0]) {
            lowestValue = Math.min(bds[0][key].getMinRaw(), lowestValue);
        }

        return lowestValue;
    }

    my.getMaxRaw = function () {
        // pick the maximum bin (highest key) in bds level 0
        // and ask for the highest raw value

        var highestValue = -999999;

        for (key in bds[0]) {
            highestValue = Math.max(bds[0][key].getMaxRaw(), highestValue);
        }

        return highestValue;
    }

    my.getMinRawMS = function () {
        // pick the minimum bin (highest key) in bds level 0
        // and ask for the lowest raw value

        var getMinOfArray = function (numArray) {
            return Math.min.apply(null, numArray);
        }

        var keys = Object.keys(bds[0]);
        return bds[0][getMinOfArray(keys)].getMinRawMS();
    }

    my.getMaxRawMS = function () {
        // pick the maximum bin (highest key) in bds level 0
        // and ask for the highest raw value

        var getMaxOfArray = function (numArray) {
            return Math.max.apply(null, numArray);
        }

        var keys = Object.keys(bds[0]);
        return bds[0][getMaxOfArray(keys)].getMaxRawMS();
    }

    my.getColor = function (key) {
        return colors[key];
    }

    my.getOpacity = function (key) {
        return opacities[key];
    }

    my.getAllInRange = function(lvl, range) {
        if (lvl === 0) {
            var y = callForAllAtLevelAndCombineResults(function (d) {
                var x = d.getAllInRangeRaw(range);
                //console.log("intermediate:", x);
                return x;
            }, 0);
            //console.log("y:",y);
            return y.bd().rawData.levels[0];
        } else {
            return callForAllAtLevelAndCombineResults(function (d) {
                return d.getAllInRange(lvl, range);
            }, lvl);
        }
    }

    my.getDateRange = function (key, lvl, range) {
        return callForAllAtLevelAndCombineResults(function (d) {
            return d.getDateRange(key, lvl, range);
        }, 0);
    }

    my.removeAllLevelsBelow = function(LowestLevel) {
        // TODO
        return my;
    }

    my.getKeys = function () {
        return binnedData().getKeys();
    }

    my.getAllRawData = function () {
        return callForAllAtLevelAndCombineResults(function (d) {
            return d.getRawData();
        }, 0);
    }

    my.bd = function () { // TODO: JUST FOR TESTING
        // TODO TODO
        return bds;
    }


    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
