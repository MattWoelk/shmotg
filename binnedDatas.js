// This is binnedDatas. A convenient way of storing binnedData objects for
// speed. This is an alternative to storing all of the data in one giant
// binnedData object.

// TODO: remove these requires! They are just for testing!
require("./binnedData.js");
_ = require('underscore');
d3 = require("d3");

binnedDatas = function (maxbins) {

    //{{{ VARIABLES

    var maxNumberOfBins = maxbins ? maxbins : 3;

    var bds = []; // array of objects. Each object contains a first
                  // property which stores the first data point which
                  // it can store. Each level corresponds to a
                  // binning level.

    /// VARIABLES }}}

    //{{{ HELPER METHODS

    function getKeyForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin [at this
        //       level] in which this ms would fit.

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, curLevel) * oneSample;

        return Math.floor(ms / ( Math.pow(2, curLevel+1) * sampleSize )) * sampleSize;
    }

    function doWeHaveBinsForThisRangeAndLevel (rng, lvl) {
        // TODO: calculate the key we're looking for
        if (key in bds[lvl]) {
        }
        return false;
    }
    // HELPER METHODS }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    }

    // MY }}}

    //{{{ PUBLIC METHODS

    my.addRawData = function (rData, dontBin) {
        // TODO
        return my;
    }

    my.replaceRawData = function (rData, dontBin) {
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

    my.bds = function () { // TODO: JUST FOR TESTING
        // TODO
        return bds;
    }


    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
