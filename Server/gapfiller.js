// This finds gaps in the database and fills it from mysql
// run this, and then run rebinner.js

// TODO: go through all of level 6 in couchdb, find missing ones, and retrieve them from the mysql database
// TODO: save them back out to couchdb
// TODO: pull all of level 7 into memory and bin it, then save it back out to couchdb

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
var db = new(cradle.Connection)().database('bridge_test');

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
var GIRDER_NUMBER = 18;

var STEP_SIZE = 600000; // 10000 is 2400 samples each time
                      // 60000 is 1 minute each time
                      // 100000 is 1:40 each time
                      // 600000 is ten minutes each time (works best for binning 1.0)

var req = {
        bin_level: 0, // placeholder
        sensorNumber: 18,
        sensorType: "girder",
}

var binData = binnedData();
// GLOBAL VARIABLES}}}

// {{{ COMMAND LINE INPUT
if (process.argv[9] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(0-11) start_day(1-31) start_hour(0-23)");
    console.log("  end_year(YYYY) end_month(0-11) end_day(1-31) end_hour(0-23)");
    console.log("  level(6-46)");
    return
}

var start_year  = process.argv[2];
var start_month = process.argv[3];
var start_day   = process.argv[4];
var start_hour  = process.argv[5];

var end_year  = process.argv[6];
var end_month = process.argv[7];
var end_day   = process.argv[8];
var end_hour  = process.argv[9];

var lowestLevel = process.argv[10];
req.bin_level = lowestLevel;
// COMMAND LINE INPUT }}}

// {{{ WHERE TO WALK
var lowestLevelToKeep = 6;

var rangeToWalk = [(new Date(start_year, start_month, start_day, start_hour)).getTime(),
    (new Date(end_year, end_month, end_day, end_hour)).getTime()];

if (rangeToWalk[0] >= rangeToWalk[1]) {
    console.log("we already have that time span");
    return;
}

// WHERE TO WALK }}}
console.log("** GETTING FROM COUCH **");

var argsList = [];

// TODO: finalFunc() should send binData to the client
var sendOut = function () {
    //TODO: rebin the entire thing:
    console.log("rebinning...")
    binData.rebinAll(rangeToWalk, 6);
    console.log("...is done!");

    //TODO: save it all back out to couchdb
    saveIt();
    //sendToClient(binData, req.bin_level);
}

//Heavy inspiration from: http://book.mixu.net/ch7.html
function seriesOfFiveParameters(item, func, finalFunc) {
    if(item) {
        func(item[0], item[1], item[2], item[3], item[4], function() {
            return seriesOfFiveParameters(argsList.shift(), func, finalFunc);
        });
    } else {
        console.log(finalFunc);
        return finalFunc();
    }
}

// get which bins we need
var binContainers = binData.getSurroundingBinContainers(rangeToWalk[0], rangeToWalk[1], req.bin_level);

// make a list which looks like this: [{sensorType, sensorNumber, "average", lvl, bin}, etc for q1, q3, ...]
for (var i = 0; i < binContainers.length; i++) {
    var keyList = ["average", "q1", "q3", "mins", "maxes"];
    for (var j = 0; j < keyList.length; j++) {
        argsList.push([req.sensorType, req.sensorNumber, keyList[j], req.bin_level, binContainers[i]]);
    }
}

// TODO: func() should make sendo, and add it to binData.
var func = function (st, sn, k, l, d, callback) {
    var id = makeIDString(st, sn, k, l, d);
    console.log("Getting:", id);
    var clbk = function(dat) {
        var sendo     = {};

        sendo.average        = {levels: []};
        sendo.q1             = {levels: []};
        sendo.q3             = {levels: []};
        sendo.mins           = {levels: []};
        sendo.maxes          = {levels: []};

        sendo[k].levels[l] = dat;
        if(dat.length === 0) {
            console.log("  -- THERE was no DATA -- ");
        }
        binData.addBinnedData(sendo, l, true);
        console.log(binData.bd().average.levels[7]);
        callback();
    }

    getFromCouch(st, sn, k, l, d, clbk);
}

function saveIt(callback) { // TODO: implement callback (perhaps not worth it)
    var dummykey = "average";
    for (var l = lowestLevelToKeep; l < MAX_NUMBER_OF_BIN_LEVELS; l++) { // for each level
        console.log("saaving level:", l);
        for (var ke in binData.getKeys()) { // for each key
            var k = binData.getKeys()[ke];
            for (var c in binData.bd()[k].levels[l]) { // for each bin container
                var id = makeIDString(SENSOR_TYPE, GIRDER_NUMBER, k, l, c);
                //console.log("saving:", id, "to couchDB");

                if (!binData.bd()[k]) { continue; }

                var dat = binData.bd()[k].levels[l][c];

                saveWithMergeToCouch(SENSOR_TYPE, GIRDER_NUMBER, k, l, dat[0].ms, dat); // TODO: replace dat[0].ms with the actual surrounding container ms_start
            }
        }
    }
}

// TODO: call seriesOfFiveParameters(item.shift(), func)
seriesOfFiveParameters(argsList.shift(), func, sendOut);

/* vim: set foldmethod=marker: */
