// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");

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
var binData = binnedData();
// GLOBAL VARIABLES}}}

// {{{ COMMAND LINE INPUT
if (process.argv[9] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(0-11) start_day(0-30) start_hour(1-24)");
    console.log("  end_year(YYYY) end_month(0-11) end_day(0-30) end_hour(1-24)");
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
// COMMAND LINE INPUT }}}

//{{{ PROTOTYPE
// Override Date.prototype.toJSON
// because JSON.stringify() uses it to change
// the format of our dates when they're converted
// back to strings
// NOTE: this is not actually required anymore
// because we're sending milliseconds instead of
// date strings, but it's nice to have around. :)
Date.prototype.toJSON = function (key) {
  //console.log("key: ");
  //console.log(key, this);
  return this + "";
};
// PROTOTYPE }}}

// {{{ CONNECTION
var mysqlconnection = mysql.createConnection({
  host     : 'shm1.ee.umanitoba.ca',
  user     : 'mattwoelk',
  password : fs.readFileSync(__dirname + '/ps').toString().trim(),
  database : 'SPB_SHM_2012MM01',
});

mysqlconnection.connect(); // perhaps not necessary; seems to be working without it

// DISCONNECTS FROM THE MYSQL DATABASE
function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('Re-connecting lost connection: ' + err.stack);

    connection = mysql.createConnection(connection.config);
    handleDisconnect(connection);
    connection.connect();
  });
}

handleDisconnect(mysqlconnection);
// CONNECTION }}}

// {{{ WHERE TO WALK
var lowestLevelToKeep = 6;

var rangeToWalk = [(new Date(start_year, start_month, start_day, start_hour)).getTime(),
                   (new Date(end_year, end_month, end_day, end_hour)).getTime()];

// console.log(dt( rangeToWalk[0] ).getHours()+":"+dt( rangeToWalk[0] ).getMinutes());
// console.log(dt( rangeToWalk[1] ).getHours()+":"+dt( rangeToWalk[1] ).getMinutes());
// console.log(rangeToWalk[1]-rangeToWalk[0]);

if (rangeToWalk[0] >= rangeToWalk[1]) {
    console.log("we already have that time span");
    return;
}

var stepSize = 60000; // 10000 is 2400 samples each time
                      // 60000 is 1 minute each time
                      // 100000 is 1:40 each time
                      // 600000 is ten minutes each time (works best for binning 1.0)
// WHERE TO WALK }}}


var current_starts = [(dt(rangeToWalk[0]).getFullYear()),
                   dt(rangeToWalk[0]).getMonth(),
                   dt(rangeToWalk[0]).getDate(),
                   dt(rangeToWalk[0]).getHours()]
var current_ends   = [(dt(rangeToWalk[1]).getFullYear()),
                   dt(rangeToWalk[1]).getMonth(),
                   dt(rangeToWalk[1]).getDate(),
                   dt(rangeToWalk[1]).getHours()]

// TODO: walk through each section of the database
for (var i = rangeToWalk[0]; i < rangeToWalk[1]; i = i + stepSize) {
  var reset_it = false;

  if (i % 21600000 === 0) {
    // TODO: reset binData, and TODO TODO TODO: start a new file (ASYNCHRONOUSLY!)
    //                                          or start using a new bindata, which isn't as efficient
    current_starts = [(dt(i).getFullYear()),
                       dt(i).getMonth(),
                       dt(i).getDate(),
                       dt(i).getHours()]
    current_ends   = [(dt(i+21600000).getFullYear()),
                       dt(i+21600000).getMonth(),
                       dt(i+21600000).getDate(),
                       dt(i+21600000).getHours()]
    reset_it = true;
    //console.log(dt(i).getHours() + ":" + dt(i).getMinutes(), dt(i+21600000).getHours() + ":" + dt(i+21600000).getMinutes());
  }

  var dtr = dt(i); // date to request
  var dtr2 = dt(i+stepSize); // second date to request

  // query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';
  var queryHead = 'SELECT ESGgirder18, SampleIndex, Time FROM SPBRTData_0A WHERE Time BETWEEN';
  var query1 = ' "' + dtr.getFullYear() +
               '-' + pad(dtr.getMonth() + 1) +
               '-' + pad(dtr.getDate()) +
               ' ' + pad(dtr.getHours()) +
               ':' + pad(dtr.getMinutes()) +
               ':' + pad(dtr.getSeconds()) + '"';
  var queryMid = ' AND ';
  var query2 = '"' + dtr2.getFullYear() +
               '-' + pad(dtr2.getMonth() + 1) +
               '-' + pad(dtr2.getDate()) +
               ' ' + pad(dtr2.getHours()) +
               ':' + pad(dtr2.getMinutes()) +
               ':' + pad(dtr2.getSeconds() + 1) + '"';
  var queryTail = '';

  var query = queryHead + query1 + queryMid + query2 + queryTail;

  sendDatabaseQuery(query, function (queryResult, st, en, res) {
    // Bin the new data
    console.log("- data received. binning data...");
    try {
      // For each one, add its rawData to binData, and bin it all
      if (res) {
          // reset it, because we're starting a new file now
          binData = binnedData();
      }
      binData.addRawData(queryResult);

      // Delete the bottom few levels
      binData.removeAllLevelsBelow(lowestLevelToKeep);

      // Save the data-structure
      saveItOut(st, en);
    } catch (e) {
      console.log(magenta+"=*= ERROR =*="+reset, e.message);
      throw e;
    }
    console.log("...done binning");
  }, current_starts, current_ends, reset_it);
}





function saveItOut (st, en) {
  // Save binData to a file
  var x = binData.toString();

  var saveName = "/Users/woelk/scraped_2.1_6/scraped_piece_"+lowestLevelToKeep
                 +"_"+st[0]+"-"+st[1]+"-"+st[2]+"-"+st[3]
                 +"_"+en[0]+"-"+en[1]+"-"+en[2]+"-"+en[3]

  fs.writeFile(saveName, x, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file was saved to"+saveName);
    }
  });
}

//var query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';














function dateStringToMilliseconds (dateStr) {
  return d3.time.format("%a %b %d %Y %H:%M:%S")
    .parse(dateStr.substring(0, 24))
    .getTime();
}

function samplesToMilliseconds (sampleIndex) {
  var samplesPerSecond = 200;
  var msPerSample = 1000/samplesPerSecond;
  var mils = sampleIndex * msPerSample;
  return mils;
}

function dateAndSampleIndexStringToMilliseconds (dateStr, sampleIndex) {
  return dateStringToMilliseconds(dateStr) + samplesToMilliseconds(sampleIndex);
}

function sendDatabaseQuery(query, doWithResult, st, en, res) {
  mysqlconnection.query(query, function (err, rows, fields) {
    if (err) {console.log("err: ", err); return err;}
    console.log(red+query, blue+rows.length+reset);
    //console.log("ROWS: ", rows);
    var send_object = rows.map(function (d) {
      return { val: d.ESGgirder18 ,
               ms: dateAndSampleIndexStringToMilliseconds(
                 d.Time + "",
                 d.SampleIndex)
             };
    });

    doWithResult(send_object, st, en, res); // send_object is always raw data
  });
}

function pad(integ) {
  var i = "" + integ;
  if (i.length === 1) { i = "0" + i; } // pad with a zero if necessary
  return i;
}

/* vim: set foldmethod=marker: */
