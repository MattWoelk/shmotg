// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");
require("./database.js");

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
var READ_OLD_DATA = false;
// GLOBAL VARIABLES}}}

if (READ_OLD_DATA) {
    // {{{ OLD FILES
    var dir = "/Users/woelk/scraped_2.1_6/";
    var listOfFilesToImport = fs.readdirSync(dir);
    listOfFilesToImport = _.map(listOfFilesToImport, function (d) { return dir + d; })

    try {
        console.log("reading file", listOfFilesToImport[0]);
        var oldBinData = fs.readFileSync(listOfFilesToImport[0]).toString(); // block while getting the girder contents.
        var datDat = JSON.parse(oldBinData);

        binData.replaceAllData(datDat);

        for (var i = 1; i < listOfFilesToImport.length; i++) {
            console.log("reading file", listOfFilesToImport[i]);
            var oldBinData = fs.readFileSync(listOfFilesToImport[i]).toString(); // block while getting the girder contents.
            var datDat = JSON.parse(oldBinData);

            binData.importDataFromAnotherBinnedDataObject(datDat);
        }

        //for (var i = 0; i < datDat.average.levels.length; i++) {
        //  console.log("reading in level", i);
        //  binData.replaceBinnedData(datDat, i, true);
        //}
        console.log("All have been read.");
        //binData.missingRawBinsUnderThisRangeAndLevel([0, 100], 1);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // OLD FILES }}}

    // {{{ CLEANUPS
    // Add in the functions which we need to rebin:
    var defaultBinnedData = binnedData();
    binData.bd().average.func = defaultBinnedData.bd().average.func;
    binData.bd().mins.func = defaultBinnedData.bd().mins.func;
    binData.bd().maxes.func = defaultBinnedData.bd().maxes.func;
    binData.bd().q1.func = defaultBinnedData.bd().q1.func;
    binData.bd().q3.func = defaultBinnedData.bd().q3.func;

    // Do the very selective rebinning here to get rid of missing
    // bins at the intersections of files
    console.log("rebinning missing regions...");
    var range_of_all_data = [binData.getMinMS(6), binData.getMaxMS(6)]; // TODO: magic
    // Date(2012, 0-11, 1-31, 0-23, 0-59, 0-59, 0-999)
    // Date(YYYY, MM  , DD  , HR  , MIN , SEC , MSEC )


    // TODO TODO TODO: instead of doing this manually, or by calculation,
    //                 just keep track of the ranges of the data which is
    //                 being read in! Store those values, then iterate
    //                 over them! :)
    for (var year = 2012; year < 2013; year++) {
        for (var month = 0; month < 1; month++) {
            for (var day = 1; day < 31; day++) {
                console.log("  ", year, month, day);
                binData.rebinAll([(new Date(year, month, day  ,  5, 59)).getTime(),
                                  (new Date(year, month, day  ,  6, 1)).getTime()], 6);
                binData.rebinAll([(new Date(year, month, day  , 11, 59)).getTime(),
                                 (new Date(year, month, day  , 12, 1)).getTime()], 6);
                binData.rebinAll([(new Date(year, month, day  , 17, 59)).getTime(),
                                 (new Date(year, month, day  , 18, 1)).getTime()], 6);
                binData.rebinAll([(new Date(year, month, day  , 23, 59)).getTime(),
                                 (new Date(year, month, day+1,  0, 1)).getTime()], 6);
            }
        }
    }

    console.log("missing regions rebinned!");
    // CLEANUPS }}}
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

            // {{{ SEND TO CLIENT
            var sendToClient = function (dat) {
                // get result ready to send
                var send_req = {};
                console.log("== PREPARING DATA FOR CLIENT ==");
                // TODO: why is this taking so long ???

                if (req.bin_level === 0) {
                    // send raw data
                    send_req = dat.getDateRange("rawData", req.bin_level, range);
                    console.log("# range for client: #");
                    console.log(dt(range[0]));
                    console.log(dt(range[1]));
                    //console.log(send_req);
                } else {
                    // send binned data
                    send_req = dat.getAllInRange(req.bin_level, range);
                    console.log("# range for client: #");
                    console.log(dt(range[0]));
                    console.log(dt(range[1]));
                    //console.log(send_req);
                }

                console.log("== SENDING TO CLIENT ==")

                // Send requested data to client
                var toBeSent = {
                    id: id,
                    sensor: req.sensor,
                    bin_level: req.bin_level,
                    req: send_req };

                    socket.emit('req_data', JSON.stringify(toBeSent));
                    console.log("- sent to client");
            };
            // SEND TO CLIENT }}}

            // See if we need to get data from the database (because the level is lower than we have pre-binned)
            if (req.bin_level < 6) { // TODO: magic
                console.log("** LOW LEVEL: GET FROM DATABASE **");
                // Request more data from the server
                var dtr = dt(range[0]); // date to request
                var dtr2 = dt(range[1]); // second date to request

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

                var tmpData = binnedData();

                sendDatabaseQuery(query, function (queryResult) {
                    // Bin the new data
                    console.log("- data received. binning data...");
                    try {
                        tmpData.addRawData(queryResult);
                    } catch (e) {
                        console.log(magenta+"=*= ERROR =*="+reset, e.message);
                        throw e;
                    }
                    console.log("- done binning data. sending to client.");

                    sendToClient(tmpData);
                    // TODO MAYBE: remove lower bins to save space.
                });
                // for each missing range
            } else {
                // we do not need to retrieve data from the database
                console.log("** ALREADY HAD THAT DATA **");
                // TODO TODO TODO this never happens. :/
                sendToClient(binData);
            } // if we need data from the database

        });
    });
});

console.log('Server is running on port 8080');

/* vim: set foldmethod=marker: */
