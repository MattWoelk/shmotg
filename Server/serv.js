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
try {
  var oldBinData = fs.readFileSync('/Users/woelk/test_backup').toString(); // block while getting the girder contents.
  console.log("reading");
  //binData.bd() = JSON.parse(oldBinData);
  //console.log(JSON.parse(oldBinData).rawData.levels[0]);
  var datDat = JSON.parse(oldBinData);
  console.log(datDat.rawData.levels[0].length);
  console.log(datDat.average.levels[1].length);
  console.log(datDat.q1.levels[1].length);
  console.log(datDat.q3.levels[1].length);
  console.log(datDat.mins.levels[1].length);
  console.log(datDat.maxes.levels[1].length);

  binData.replaceRawData(datDat.rawData.levels[0], true);

  for (var i = 0; i < datDat.average.levels.length; i++) {
    console.log("reading in level", i);
    binData.replaceBinnedData(datDat, i, true);
  }
  console.log("all has been read");
} catch (err) {
  console.log(err);
  throw err;
}

//var app = http.createServer(); //(handler); //if we want to serve html, too. // for html
var io = require('socket.io').listen(8080); //(app) for html
io.configure(function () { io.set('log level', 2); });
//app.listen(8080); // for html


var jsonData = [ { "ESGgirder1" : -47.8500 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -44.9100 }, { "ESGgirder1" : -44.9100 } ];

var jsonData = fs.readFileSync(__dirname + '/esg_time.js').toString(); // block while getting the girder contents.

var listOfGirders = ['ESGgirder18'];
var sensorBins = []; // an array of binData in the following form:
                     // sensorBins = [ { sensor: 'ESGgirder18', binData: [just like in binnedChart.js] },
                     //                { sensor: 'another', binData: [etc.]},
                     //                { etc ... }]

// initialize sensorBins
var i = 0;
for (var li in listOfGirders) {
  var l = listOfGirders[li];
  sensorBins[l] = { keys : ['average', 'maxes', 'mins', 'q1', 'q3'] };
  i = i + 1;
}


var handler = function (req, res) {
  // for html:
  //fs.readFile(__dirname + '/index.html',
  //function (err, data) {
  //  if (err) {
  //    res.writeHead(500);
  //    return res.end('Error loading index.html');
  //  }

    res.writeHead(200);
    res.end(data);
  //});
};

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


//var server = http.createServer(function(req, res) {
//  res.writeHead(200);
//  console.log("connection!");
//  res.end(); // if this isn't there, the client will just hang and wait for a long time
//}).listen(8080);

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


//query = 'Show databases'; // did not use 'database' in mysqlconnection options
//query = 'Show tables FROM SPB_SHM_2012MM01'; // did not use 'database' in mysqlconnection options
//query = 'SELECT * FROM SPBRTData_Truck'; // this is a giant dump of data which takes forever to happen
//query = 'Describe SPBRTData_Truck';
var girder = 1;
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck';
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
//query = 'SELECT NumStartTime_DD, NumEndTime_DD, NumStartTime_CC, NumStartTime_CC, ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 15';
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
//query = 'SELECT * FROM SPBRTData_0A LIMIT 10'; // grab 10 entries (LIMIT 10)
query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';

// TODO: make a query which selects a time range (more difficult than it should be)
//query = "SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A WHERE Time between 'Mon Jan 02 2010 23:12:29 GMT-0600 (CST)' AND 'Mon Jan 02 2010 23:12:30 GMT-0600 (CST)' LIMIT 10";

//-- TODO: new data section --//
//var dat = Date.parse("Thu, 01 Jan 1970 00:00:00 GMT-0400");
//var dat = Date.parse("Mon Jan 02 2012 23:12:33 GMT-0600 (CST)");
//var dat = Date.parse("Thu Jan 01 1970 00:00:00 GMT-0500 (CST)");
//var dates = Date(dat);
//console.log(dat);
//console.log(dates);
//----------------------------//

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

mysqlconnection.query(query, function (err, rows, fields) {
  if (err) return err;
  //console.log(query, "\n\n", "rows:\n", rows, "\n\nfields:\n", fields, "\n\n");
  //console.log(query, rows.length);

  var send_object = rows.map(function (d) {
    return { val: d.ESGgirder18 ,
             ms: dateAndSampleIndexStringToMilliseconds(
               d.Time + "",
               d.SampleIndex)
           };
  });

  var send_to_user = JSON.stringify(send_object);

  //console.log(send_to_user); // to print out test file

  // TODO: binnedData is included: console.log(binnedData());

  io.sockets.on('connection', function (socket) {
    socket.emit('news', send_to_user);

    socket.on('ack', function (data) {
      console.log("client: " + data); //ack
    });

    socket.on('req', function (sendReq) {
      var received = JSON.parse(sendReq);
      var req = received.req;
      var id = received.id;
      //console.log("client req: " + JSON.stringify(received));
      //sendDatabaseQuery('SELECT Time FROM SPBRTData_0A WHERE Time BETWEEN "2012-01-02 10:00:01" AND "2012-01-02 10:00:02" LIMIT 10');

      // See if we have the requested data at the requested bin level
      var range = [parseInt(req.ms_start), parseInt(req.ms_end)];

      var sendToClient = function () {
        // get result ready to send
        var send_req = {};
        console.log("== BINNED. sending now");

        if (req.bin_level === 0) {
          // send raw data
          send_req = binData.getDateRange("rawData", req.bin_level, range);
          console.log("# range for client: #");
          console.log(dt(range[0]));
          console.log(dt(range[1]));
          //console.log(send_req);
        } else {
          // send binned data
          send_req = binData.getAllInRange(req.bin_level, range);
          console.log("# range for client: #");
          console.log(dt(range[0]));
          console.log(dt(range[1]));
          //console.log(send_req);
        }

        // Send requested data to client
        var toBeSent = {
          id: id,
          sensor: req.sensor,
          bin_level: req.bin_level,
          req: send_req };

        socket.emit('req_data', JSON.stringify(toBeSent));
        console.log("- sent to client");
      };

      // See if our binned data has the requested range
      var missingRanges = binData.missingBins(range, received.bin_level);
      // TODO TODO TODO CURRENT TASK: get this working.
      console.log('missing ranges', missingRanges);

      // Filter the ranges for only those which we don't have raw data
      // TODO: this is a temporary fix!
      //       once missingRanges is working properly, we won't need this
      var minval = binData.getMinRawMS();
      var maxval = binData.getMaxRawMS();
      var newMissingValues = [];
      for (var i = 0; i < missingRanges.length; i++) {
        // if the range is not within what we have, use it
        var low;
        var high;

        low = Math.min(missingRanges[i][1]);
        if (missingRanges[i][0] < minval) {
          if (missingRanges[i][1] > minval) {
            newMissingValues.push([missingRanges[i][0], minval]);
          } else {
            newMissingValues.push([missingRanges[i][0], missingRanges[i][1]]);
          }
        }

        if (missingRanges[i][1] > maxval) {
          if (missingRanges[i][0] > maxval) {
            newMissingValues.push([missingRanges[i][0], missingRanges[i][1]]);
          } else {
            newMissingValues.push([maxval, missingRanges[i][1]]);
          }
        }
      } // for each missing range

      //var query = 'SELECT Time FROM SPBRTData_0A WHERE Time BETWEEN "2012-01-02 10:00:01" AND "2012-01-02 10:00:02" LIMIT 10';
      if (newMissingValues.length !== 0) {
        for (var i = 0; i < newMissingValues.length; i++) {
          // Request more data from the server
          var dtr = dt(parseInt(newMissingValues[i][0])); // date to request
          var dtr2 = dt(parseInt(newMissingValues[i][1])); // second date to request

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
              pad(dtr.getDate()),
              pad(dtr.getHours()) + ":" + pad(dtr.getMinutes()) + ":" + pad(dtr.getSeconds()) );
          console.log("                  :",
              pad(dtr2.getDate()),
              pad(dtr2.getHours()) + ":" + pad(dtr2.getMinutes()) + ":" + pad(dtr2.getSeconds() + 1) );

          var query = queryHead + query1 + queryMid + query2 + queryTail;

          sendDatabaseQuery(query, function (queryResult) {
            // Bin the new data
            console.log("- data received. binning data...");
            try {
              binData.addRawData(queryResult);
            } catch (e) {
              console.log(magenta+"=*= ERROR =*="+reset, e.message);
              throw e;
            }
            console.log("- done binning data. sending to client.");

            sendToClient();

            // Save binData to a file
            var x = JSON.stringify(binData.bd());
            fs.writeFile("/Users/woelk/test", x, function(err) {
              if(err) {
                console.log(err);
              } else {
                console.log("The file was saved to /Users/woelk/test");
              }
            });

            // TODO MAYBE: remove lower bins to save space.
          });
        } // for each missing range
      } else {
        // we do not need to retrieve data from the database
        console.log("** ALREADY HAD THAT DATA **");
        // TODO TODO TODO this never happens. :/
        sendToClient();
      } // if we need data from the database

    });
  });
});



/*
http.createServer(function(req, res) {
  res.writeHead(200);
  //res.writeHead(200, {'Content-Type': 'text/plain'});
  //res.writeHead(200, {'charset': 'UTF-8'});
  //res.writeHead(200);

  fs.readFile('index.html', function (err, contents) {
    res.write(contents);
    res.write(send_to_user);
    res.end();
  });
}).listen(8080);
*/

console.log('Server is running on port 8080');

