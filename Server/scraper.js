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


// GLOBAL VARIABLES
var binData = binnedData();

console.log("== reading in old data ==");

// Grab the already-stored data
var oldBinData = fs.readFileSync('/Users/woelk/scraped2.0_6_base').toString(); // block while getting the girder contents.
var datDat = JSON.parse(oldBinData);

console.log("reading", datDat);
binData.replaceAllData(datDat);

var defaultBinnedData = binnedData();

// Add in the functions which we need: KEEP SYNCD WITH binnedData.js
binData.bd().average.func = defaultBinnedData.bd().average.func;
binData.bd().mins.func = defaultBinnedData.bd().mins.func;
binData.bd().maxes.func = defaultBinnedData.bd().maxes.func;
binData.bd().q1.func = defaultBinnedData.bd().q1.func;
binData.bd().q3.func = defaultBinnedData.bd().q3.func;

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

var send_to_user = "";

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


//////////////////////////////////////////////////
//////////////////////////////////////////////////

var lowestLevelToKeep = 6;

// TODO TODO TODO: Do not request data which we already have
var theMin = binData.getMinMS(lowestLevelToKeep);
var theMax = binData.getMaxMS(lowestLevelToKeep);

console.log("start:", dt(theMax).toUTCString());

var rangeToWalk = [theMax, (new Date(2012, 0, 5, 1)).getTime()];
                           //        YYYY,MM-1,DD,HH,...

if (rangeToWalk[0] >= rangeToWalk[1]) {
    console.log("we already have that time span");
    return;
}

var stepSize = 100000; // 10000 is 2400 samples each time
                       // 100000 is 1:40 each time
                       // 600000 is ten minutes each time (works best for binning 1.0)

// TODO: walk through each section of the database
for (var i = rangeToWalk[0]; i < rangeToWalk[1]; i = i + stepSize) {
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

  console.log("querying for range:",
      pad(dtr.getFullYear() + "-" + dtr.getMonth() + "-" + dtr.getDate()),
      pad(dtr.getHours()) + ":" + pad(dtr.getMinutes()) + ":" + pad(dtr.getSeconds()) );
  console.log("                  :",
      pad(dtr2.getFullYear() + "-" + dtr2.getMonth() + "-" + dtr2.getDate()),
      pad(dtr2.getHours()) + ":" + pad(dtr2.getMinutes()) + ":" + pad(dtr2.getSeconds() + 1) );

  var query = queryHead + query1 + queryMid + query2 + queryTail;

  sendDatabaseQuery(query, function (queryResult) {
    // Bin the new data
    console.log("- data received. binning data...");
    try {
      // For each one, add its rawData to binData, and bin it all
      binData.addRawData(queryResult);

      // Delete the bottom few levels
      binData.removeAllLevelsBelow(lowestLevelToKeep);

      // Save the data-structure
      saveItOut();
    } catch (e) {
      console.log(magenta+"=*= ERROR =*="+reset, e.message);
      throw e;
    }
    console.log("...done binning");
  });
}





function saveItOut () {
  // Save binData to a file
  var x = binData.toString();

  console.log("SAVING");

  // TODO TODO TODO: store the date along with it
  //                 no need for version number anymore
  fs.writeFile("/Users/woelk/scraped2.0_"+lowestLevelToKeep, x, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file was saved to /Users/woelk/scraped2.0_"+lowestLevelToKeep);
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

function sendDatabaseQuery(query, doWithResult) {
  console.log("- receiving data from server...");
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

    doWithResult(send_object); // send_object is always raw data
  });
}

function pad(integ) {
  var i = "" + integ;
  if (i.length === 1) { i = "0" + i; } // pad with a zero if necessary
  return i;
}

