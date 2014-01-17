// This goes through the couchdb database
// and rebins data as requested. (See USAGE);

var debug = false;

////////////////////////////////////////////////
// Rebin at level 13 to best results.         //
// Do this after scraper has run on all data. //
// Then restart the server (it caches)        //
////////////////////////////////////////////////

// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");
require("./database.js");
require("./couchAccess.js");


var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test2');

red = '\033[31m';
yellow = '\033[33m';
magenta = '\033[35m';
blue = '\033[36m';
reset = '\033[0m';

function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
}
// SETUP }}}

// {{{ GLOBAL VARIABLES
var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js
var SENSOR_TYPE = "girder";

var STEP_SIZE = 600000; // 10000 is 2400 samples each time
                      // 60000 is 1 minute each time
                      // 100000 is 1:40 each time
                      // 600000 is ten minutes each time (works best for binning 1.0)

var req = {
        bin_level: 0, // placeholder
        sensorNumber: 18, // placeholder
        sensorType: "girder",
}

var binData = binnedData();
// GLOBAL VARIABLES}}}

// {{{ COMMAND LINE INPUT
if (process.argv[9] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(1-12) start_day(1-31)");
    console.log("  end_year(YYYY) end_month(1-12) end_day(1-31)");
    console.log("  level(6-46) sensorNumber");
    return
}

var start_year  = parseInt(process.argv[2]);
var start_month = parseInt(process.argv[3])-1;
var start_day   = parseInt(process.argv[4]);

var end_year  = parseInt(process.argv[5]);
var end_month = parseInt(process.argv[6])-1;
var end_day   = parseInt(process.argv[7]);

var lowestLevel = parseInt(process.argv[8]);
var sensorNumber = parseInt(process.argv[9]);
req.bin_level = lowestLevel;
req.sensorNumber = sensorNumber;

console.log("rebinner: engaged ", process.argv);
// COMMAND LINE INPUT }}}

// {{{ WHERE TO WALK
var rangeToWalk = [(new Date(start_year, start_month, start_day, 0)).getTime(),
    (new Date(end_year, end_month, end_day, 24)).getTime()];

if (rangeToWalk[0] >= rangeToWalk[1]) {
    if(debug) console.log("rebinner - we already have that time span");
    return;
}

// WHERE TO WALK }}}
if(debug) console.log("** rebinner - GETTING FROM COUCH **");

var argsList = [];

// TODO: finalFunc() should send binData to the client
var sendOut = function () {
    // TODO: figure out which sections are missing

    // TODO: fill the gaps from the mysql server

    // rebin the entire thing:
    if(debug) console.log("rebinner - rebinning...")
    binData.rebinAll(rangeToWalk, 6);
    if(debug) console.log("rebinner - ...twice...");
    binData.rebinAll(rangeToWalk, 6);
    console.log("rebinner - rebinning is done!");

    // Save it all back out to couchdb
    saveIt();
}

//Heavy inspiration from: http://book.mixu.net/ch7.html
function seriesOfFiveParameters(item, func, finalFunc) {
    if(item) {
        func(item[0], item[1], item[2], item[3], item[4], function() {
            return seriesOfFiveParameters(argsList.shift(), func, finalFunc);
        });
    } else {
        return finalFunc();
    }
}

// get which bins we need
var binContainers = binData.getSurroundingBinContainers(rangeToWalk[0], rangeToWalk[1], req.bin_level);

// make a list which looks like this: [{sensorType, sensorNumber, "average", lvl, bin}, etc for q1, q3, ...]
var keyList = ["average", "q1", "q3", "mins", "maxes"];
for (var j = 0; j < keyList.length; j++) {
    for (var i = 0; i < binContainers.length; i++) {
        argsList.push([req.sensorType, req.sensorNumber, keyList[j], req.bin_level, binContainers[i]]);
    }
}

// TODO: func() should make sendo, and add it to binData.
var func = function (st, sn, k, l, d, callback) {
    var id = makeIDString(st, sn, k, l, d);
    if(debug) console.log("rebinner - Getting:", id);
    var clbk = function(dat) {
        var sendo     = {};

        sendo.average        = {levels: []};
        sendo.q1             = {levels: []};
        sendo.q3             = {levels: []};
        sendo.mins           = {levels: []};
        sendo.maxes          = {levels: []};

        sendo[k].levels[l] = dat;
        if(dat.length === 0) {
            if(debug) console.log("rebinner -   -- THERE was no DATA -- ");
        }
        binData.addBinnedData(sendo, l, true);
        callback();
    }

    getFromCouch(st, sn, k, l, d, clbk);
}

// {{{ SAVE
var listOfThingsToDo = [];

function saveIt(callback) { // TODO: implement callback (perhaps not worth it)
    var dummykey = "average";
    for (var l = lowestLevel; l < MAX_NUMBER_OF_BIN_LEVELS; l++) { // for each level
        for (var c in binData.bd()[dummykey].levels[l]) { // for each bin container
            for (var ke in binData.getKeys()) { // for each key
                var k = binData.getKeys()[ke];

                if (!binData.bd()[k]) { continue; }

                var dat = binData.bd()[k].levels[l][c];
                var strt = binData.getBinContainerForMSAtLevel(dat[0].ms, l);

                listOfThingsToDo.push([SENSOR_TYPE, sensorNumber, k, l, strt, dat]);
            }
        }
    }

    //console.log(listOfThingsToDo);

    function doIt(item, callback) {
        var id = makeIDString(item[0], item[1], item[2], item[3], item[4]);
        //console.log("saving:", id, "to couchDB");
        saveWithMergeToCouch(item[0], item[1], item[2], item[3], item[4], item[5], callback);
    }

    seriesSave(listOfThingsToDo.shift(), doIt);
}

function seriesSave(item, func) {
    if(item) {
        func(item, function() {
            //console.log(item);
            return seriesSave(listOfThingsToDo.shift(), func);
        });
    } else {
        console.log("rebinner - DONE!");
        process.exit(0);
    }
}
// SAVE }}}

// TODO: call seriesOfFiveParameters(item.shift(), func)
seriesOfFiveParameters(argsList.shift(), func, sendOut);

/* vim: set foldmethod=marker: */
