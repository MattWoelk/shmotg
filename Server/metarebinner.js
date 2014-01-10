// metarebinner.js rebins each month together.
// USAGE: (see USAGE below) example: node metarebinner.js 2011 08 2012 04 15 22

// {{{ SETUP
require("../binnedData.js");
require("./database.js");
require("./couchAccess.js");
var spawn = require('child_process').spawn;
// SETUP }}}

// {{{ COMMAND LINE INPUT
if (process.argv[7] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(1-12)");
    console.log("  end_year(YYYY) end_month(1-12)");
    console.log("  level(6-46) sensorNumber");
    return
}

var start_year  = parseInt(process.argv[2]);
var start_month = parseInt(process.argv[3]);

var end_year  = parseInt(process.argv[4]);
var end_month = parseInt(process.argv[5]);

var which_level = parseInt(process.argv[6]);
var sensorNumber = parseInt(process.argv[7]);
// COMMAND LINE INPUT }}}


// {{{ WHERE TO WALK

var walkings = []; // [['year', 'month(0-11)', 'day', 'hour'], [ etc. ]]

//Heavy inspiration from: http://book.mixu.net/ch7.html
function series(item, func) {
    if(item) {
        func(item, function() {
            return series(walkings.shift(), func);
        });
    } else {
        console.log("metarebinner - DONE!");
        process.exit(0);
    }
}

for (var y = start_year; y <= end_year; y++) {
    var m_start = y === start_year ? start_month : 0;
    var m_end   = y === end_year ? end_month : 11;
    for (var m = m_start; m <= m_end; m++) {
        walkings.push([y, m, 1, y, m+1, 1, which_level, sensorNumber]);
    }
}

function callScraper (dat, callback) {
    var scr = spawn('node',  ['rebinner', dat[0], dat[1], dat[2], dat[3], dat[4], dat[5], dat[6], dat[7]]);

    scr.stdout.setEncoding('utf8');
    scr.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join("").replace(/\n/g, ''));
    });

    scr.on('close', function (code) {
        console.log('metarebinner - process exit code ' + code);
        callback();
    });
}

series(walkings.shift(), callScraper);
