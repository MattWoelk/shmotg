// {{{ SETUP
var fs = require('fs');
require("../binnedData.js");
require("./database.js");
require("./couchAccess.js");
_ = require("underscore");

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
var READ_FROM_COUCHDB = true;
var READ_FROM_MYSQL = true;
// GLOBAL VARIABLES}}}

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

        var range = [parseInt(req.ms_start), parseInt(req.ms_end)];
        //}}} PARSE REQUEST

        // {{{ SEND TO CLIENT
        var sendToClient = function (dat, lvl) {
            // get result ready to send
            var send_req = {};
            console.log("== PREPARING DATA FOR CLIENT == lvl:", lvl);

            if (lvl == 0) {
                // send raw data
                // TODO: to further speed things up, make a getDateRange replacement
                //       which sends each bin container as it comes.
                //       doToEachContainerInRange
                //       When the (same!) client has another request, stop doing
                //       these sendings.
                //       The last sending should have the same id as the original
                //       one so the client knows to hide its loading icon.
                //       The others should have a sub name "10-1", "10-2" or similar
                send_req = dat; // dat in this case is not a binnedData object; just an array.
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
                sensorType: req.sensorType,
                sensorNumber: req.sensorNumber,
                bin_level: lvl,
                req: send_req
            };

            socket.emit('req_data', JSON.stringify(toBeSent));
            console.log("- sent to client");
        };
        // SEND TO CLIENT }}}

        // See if we need to get data from the database (because the level is lower than we have pre-binned)
        if (READ_FROM_MYSQL && req.bin_level < 6) { // TODO: magic
            // {{{ GET AND SEND REQUEST
            console.log("** LOW LEVEL: GET FROM DATABASE ** lvl:", req.bin_level);
                                        //            just make it readable and throw it on through
            var tmpData = binnedData(); // TODO TODO: this doesn't need to be a full-blown object...

            getDataFromDataBaseInRange(range[0], range[1], function (queryResult) {
                // Bin the new data
                console.log("- data received...");
                try {
                    tmpData.addRawData(queryResult, true); // don't waste time binning because we're going to send the raw data anyway.
                } catch (e) {
                    console.log(magenta+"=*= ERROR =*="+reset, e.message);
                    throw e;
                }
                console.log("- sending data to client.");

                sendToClient(queryResult, 0); // Send raw data to the client (testing)
            });
            // GET AND SEND REQUEST }}}
        } else if (req.bin_level >= 6 && READ_FROM_COUCHDB) {
            // {{{ GET FROM COUCHDB
            // we do not need to retrieve data from the database
            // but we do from the couchdb
            console.log("** GET FROM COUCH **");

            var argsList = [];
            var bdtemp = binnedData();

            var sendOut = function () {
                sendToClient(bdtemp, req.bin_level);
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
            var binContainers = bdtemp.getSurroundingBinContainers(range[0], range[1], req.bin_level);

            // make a list which looks like this: [{sensorType, sensorNumber, "average", lvl, bin}, etc for q1, q3, ...]
            for (var i = 0; i < binContainers.length; i++) {
                var keyList = ["average", "q1", "q3", "mins", "maxes"];
                for (var j = 0; j < keyList.length; j++) {
                    argsList.push([req.sensorType, req.sensorNumber, keyList[j], req.bin_level, binContainers[i]]);
                }
            }

            // TODO: func() should make sendo, and add it to bdtemp.
            var func = function (st, sn, k, l, d, callback) {
                var clbk = function(d) {
                    var sendo     = {};

                    sendo.average        = {levels: []};
                    sendo.q1             = {levels: []};
                    sendo.q3             = {levels: []};
                    sendo.mins           = {levels: []};
                    sendo.maxes          = {levels: []};

                    sendo[k].levels[l] = d;
                    bdtemp.addBinnedData(sendo, l, true);
                    callback();
                }

                getFromCouch(st, sn, k, l, d, clbk);
            }

            // TODO: call seriesOfFiveParameters(item.shift(), func)
            seriesOfFiveParameters(argsList.shift(), func, sendOut);
            // GET FROM COUCHDB }}}
        } else {
            // send a dummy back because we have nothing to send
            sendToClient([], 0); // Send raw data to the client (testing)
        }
    });
});

console.log('Server is running on port 8080');
/* vim: set foldmethod=marker: */
