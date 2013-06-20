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
var READ_NEW_DATA = true;
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

// {{{ LISTEN FOR CLIENTS
var io = require('socket.io').listen(8080); //(app) for html
io.configure(function () { io.set('log level', 2); });
// LISTEN FOR CLIENTS }}}

// {{{ HELPER FUNCTIONS
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
// HELPER FUNCTIONS }}}

var send_to_user = JSON.stringify({});

io.sockets.on('connection', function (socket) {
    // {{{ CONNECT WITH CLIENT
    socket.emit('news', send_to_user);

    socket.on('ack', function (data) {
        console.log("client: " + data);
    });
    // CONNECT WITH CLIENT }}}

    socket.on('req', function (sendReq) {
        //{{{ PARSE REQUEST
        var received = JSON.parse(sendReq);
        var req = received.req;
        var id = received.id;

        // See if we have the requested data at the requested bin level
        var range = [parseInt(req.ms_start), parseInt(req.ms_end)];
        //}}} PARSE REQUEST

        // {{{ SEND TO CLIENT
        var sendToClient = function (dat, lvl) {
            // get result ready to send
            var send_req = {};
            console.log("== PREPARING DATA FOR CLIENT == lvl:", lvl);

            if (req.bin_level === 0) {
                // send raw data
                // TODO: to further speed things up, make a getDateRange replacement
                //       which sends each bin container as it comes.
                //       doToEachContainerInRange
                //       When the (same!) client has another request, stop doing
                //       these sendings.
                //       The last sending should have the same id as the original
                //       one so the client knows to hide its loading icon.
                //       The others should have a sub name "10-1", "10-2" or similar
                send_req = dat.getDateRange("rawData", lvl, range);
                console.log("# range for client: #");
                console.log(dt(range[0]));
                console.log(dt(range[1]));
                //console.log(send_req);
            } else {
                // send binned data
                send_req = dat.getAllInRange(lvl, range);
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
                bin_level: lvl,
                req: send_req
            };

            socket.emit('req_data', JSON.stringify(toBeSent));
            console.log("- sent to client");
        };
        // SEND TO CLIENT }}}

        // See if we need to get data from the database (because the level is lower than we have pre-binned)
        if (READ_NEW_DATA && req.bin_level < 6) { // TODO: magic
            // {{{ CREATE REQUEST
            console.log("** LOW LEVEL: GET FROM DATABASE **", req.bin_level);

            // Request more data from the server
            var dtr = dt(range[0]); // date to request
            var dtr2 = dt(range[1]); // second date to request

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
            // CREATE REQUEST }}}

            // {{{ GET AND SEND REQUEST
            var tmpData = binnedData();

            sendDatabaseQuery(query, function (queryResult) {
                // Bin the new data
                console.log("- data received. binning data...");
                try {
                    tmpData.addRawData(queryResult, req.bin_level == 0);
                } catch (e) {
                    console.log(magenta+"=*= ERROR =*="+reset, e.message);
                    throw e;
                }
                console.log("- done binning data. sending to client.");

                sendToClient(tmpData, 0); // Send raw data to the client (testing)
            });
            // GET AND SEND REQUEST }}}
        } else {
            // we do not need to retrieve data from the database
            // {{{ SEND TO CLIENT
            console.log("** ALREADY HAD THAT DATA **");
            sendToClient(binData, req.bin_level);
            // SEND TO CLIENT }}}
        } // if we need data from the database

    });
});


console.log('Server is running on port 8080');

/* vim: set foldmethod=marker: */
