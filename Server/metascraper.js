// {{{ SETUP
require("../binnedData.js");
require("./database.js");
require("./couchAccess.js");
var spawn = require('child_process').spawn;

function daysInMonth(yr, mo) {
    var dtr = new Date(yr, mo, 0);
    return dtr.getDate();
}
// SETUP }}}

// {{{ GLOBAL VARIABLES
var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js

var STEP_SIZE = 600000; // 10000 is 2400 samples each time
                      // 60000 is 1 minute each time
                      // 100000 is 1:40 each time
                      // 600000 is ten minutes each time (works best for binning 1.0)

var binData = binnedData();
// GLOBAL VARIABLES}}}

// {{{ COMMAND LINE INPUT
if (process.argv[8] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(1-12) start_day(1-31)");
    console.log("  end_year(YYYY) end_month(1-12) end_day(1-31)");
    console.log("  sensorNumber");
    return
}

var start_year  = parseInt(process.argv[2]);
var start_month = parseInt(process.argv[3]);
var start_day   = parseInt(process.argv[4]);

var end_year  = parseInt(process.argv[5]);
var end_month = parseInt(process.argv[6]);
var end_day   = parseInt(process.argv[7]);

var sensorNumber = parseInt(process.argv[8]);
// COMMAND LINE INPUT }}}

// {{{ WHERE TO WALK
var lowestLevelToKeep = 6;



var walkings = []; // [['year', 'month(0-11)', 'day', 'hour'], [ etc. ]]

//Heavy inspiration from: http://book.mixu.net/ch7.html
function series(item, func) {
    if(item) {
        func(item, function() {
            return series(walkings.shift(), func);
        });
    } else {
        console.log("Rebinning now!");

        // Rebin this with the two months around it:
        callMetaRebinner(
                [start_year, start_month, end_year, end_month, 15, sensorNumber],
                // Then rebin everything at lvl 20 and up:
                function () { callRebinner(
                               [2010, 1, 1, 2013, 1, 1, 20, sensorNumber],
                               function () {
                                   console.log("DONE!");
                                   process.exit(0);
                               }) });
    }
}

for (var y = start_year; y <= end_year; y++) {
    var m_start = y === start_year ? start_month : 1;
    var m_end   = y === end_year ? end_month : 12;
    for (var m = m_start; m <= m_end; m++) {
        var num_days = daysInMonth(y, m);
        var d_start = m === m_start ? start_day : 1;
        var d_end   = m === m_end ? end_day : num_days;
        for (var d = d_start; d <= d_end; d++) {
            walkings.push([y, m, d, 0, y, m, d, 6, sensorNumber]);
            walkings.push([y, m, d, 6, y, m, d, 12, sensorNumber]);
            walkings.push([y, m, d, 12, y, m, d, 18, sensorNumber]);
            walkings.push([y, m, d, 18, y, m, d, 24, sensorNumber]);
        }
    }
}

function callScraper (dat, callback) {
    var scr = spawn('node',  ['scraper', dat[0], dat[1], dat[2], dat[3], dat[4], dat[5], dat[6], dat[7], dat[8]]);

    scr.stdout.setEncoding('utf8');
    scr.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join("").replace(/\n/g, ''));
    });

    scr.on('close', function (code) {
        console.log('process exit code ' + code);
        callback();
    });
}

function callMetaRebinner (dat, callback) {
    var scr = spawn('node',  ['metarebinner', dat[0], dat[1], dat[2], dat[3], dat[4], dat[5]]);

    scr.stdout.setEncoding('utf8');
    scr.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join("").replace(/\n/g, ''));
    });

    scr.on('close', function (code) {
        console.log('process exit code ' + code);
        callback();
    });
}

function callRebinner (dat, callback) {
    var scr = spawn('node',  ['rebinner', dat[0], dat[1], dat[2], dat[3], dat[4], dat[5], dat[6], dat[7]]);

    scr.stdout.setEncoding('utf8');
    scr.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join("").replace(/\n/g, ''));
    });

    scr.on('close', function (code) {
        console.log('process exit code ' + code);
        callback();
    });
}


series(walkings.shift(), callScraper);
