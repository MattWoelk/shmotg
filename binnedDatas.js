// This is binnedDatas. A convenient way of storing binnedData objects for
// speed. This is an alternative to storing all of the data in one giant
// binnedData object.

// TODO: remove these requires! They are just for testing!

binnedDatas = function (maxbins) {

    //{{{ INITIALIZATION (runs once)
    assert(getKeyForTimeAtLevel (11, 0), 10, "get key 11, 0");
    assert(getKeyForTimeAtLevel (11, 1), 10, "get key 11, 1");
    assert(getKeyForTimeAtLevel (11, 2), 0,  "get key 11, 2");

    assertDirect(
        splitIntoBinsAtLevel([{ms: 3},{ms: 5},{ms: 7},{ms: 9},], 0),
            {'0': [{ms: 3}],
             '5': [{ms: 5}, {ms: 7}, {ms: 9}]},
        "splitIntoBinsAtLevel, 0");

    assert(getSurroundingBins(0, 16, 0), [0, 5, 10, 15], "all between 1");
    assert(getSurroundingBins(2, 20, 0), [0, 5, 10, 15, 20], "all between 2");

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

    function callForAllAtLevelAndCombineResults (func, lvl) {
        // func must return an array
        result = [];

        for (i in bds[lvl]) {
            result = result.concat(func(bds[lvl][i]));
        }

        return result;
    }

    // HELPER METHODS }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    }

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addRawData = function (data, dontBin) {
        // TODO: take into account different keys ('average', 'q1'...)
        var lvl = 0;
        var splitData = splitIntoBinsAtLevel(data, lvl);

        for (var prop in splitData) {
            var overflow = splitData[prop];

            while (overflow){
                // Check to see if we have a binData
                // for this level and key
                if( !bds[lvl] ) {
                    bds[lvl] = {};
                }
                if( !bds[lvl][prop] ) {
                    bds[lvl][prop] = binnedData(maxNumberOfBins);
                }

                // TODO: combine this data with that data
                overflow = bds[lvl][prop].addRawData(splitData[prop], false);
                //console.log(overflow);
            }
        }

        return my;
    }

    my.replaceRawData = function (data, dontBin) {
        // TODO
        return my;
    }

    my.addBinnedData = function (bData, lvl, dontBin) {
        // TODO
        return my;
    }

    my.replaceBinnedData = function(bData, lvl, dontBin) {
        // TODO
        return my;
    }

    my.haveDataInRange = function(ms_range, level) {
        // TODO
        return my;
    }

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // TODO
        return my;
    }

    my.missingRawBinsUnderThisRangeAndLevel = function (ms_range, level) {
        // TODO
        return my;
    }

    my.getMinRaw = function () {
        // TODO
        return my;
    }

    my.getMaxRaw = function () {
        // TODO
        return my;
    }

    my.getMinRawMS = function () {
        // TODO
        return my;
    }

    my.getMaxRawMS = function () {
        // TODO
        return my;
    }

    my.getColor = function (key) {
        // TODO
        return my;
    }

    my.getOpacity = function (key) {
        // TODO
        return my;
    }

    my.getAllInRange = function(lvl, range) {
        // TODO
        return my;
    }

    my.getDateRange = function (key, lvl, range) {
        // TODO
        return my;
    }

    my.removeAllLevelsBelow = function(LowestLevel) {
        // TODO
        return my;
    }

    my.getKeys = function () {
        // TODO
        return my;
    }

    my.getAllRawData = function () {
        return callForAllAtLevelAndCombineResults(function (d) {
            return d.getRawData();
        }, 0);
    }

    my.bds = function () { // TODO: JUST FOR TESTING
        // TODO
        return bds;
    }


    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
