var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test');
require("./couchAccess.js");

// THIS worked.
//db.save('ESGgirder18-average-4-204840', {
//    data: [
//        {ms: 204840, val: 93.50},
//        {ms: 204860, val: 94.75},
//        {ms: 204880, val: 92.25}
//    ]
//}, function (err, res) {
//    if (err) {
//        //Handle error
//    } else {
//        // Handle success
//        //console.log(res);
//    }
//});
//
//// THIS WORKS! (Will try to do things this way)
//db.get('ESGgirder18-average-4-204840', function (err, doc) {
//    console.log(doc.data);
//    console.log(doc.data[0].ms);
//});

//// THIS WORKS:
//db.save('G18-a-5-40', { // using a custom id (instead of a randomishly generated one)
//                        // because it's smaller, still unique, and will save disc space
//    sensor: "ESGgirder18",
//    type: "average",
//    level: 5,
//    ms_start: 40,
//    data: [
//        {ms: 40, val: 3},
//        {ms: 45, val: 2},
//        {ms: 50, val: 4},
//        {ms: 55, val: 5}
//    ]
//});

//// THIS WORKS:
//db.save('_design/levels', {
//    level5: {
//        map: function (doc) {
//            if (doc.level === 5) {
//                emit(doc.type, doc.average)
//            }
//        }
//    },
//    level4: {
//        map: function (doc) {
//            if (doc.level === 4) {
//                emit(doc.type, doc.average)
//            }
//        }
//    }
//});

// THIS WORKS:
//db.view('levels/level5', function (err, d) {
//    console.log("level5");
//    console.log(d);
//});

// THIS WORKS:
//db.view('levels/level5', { key: "average" }, function (err, d) {
//    console.log("level5 average key");
//    console.log(d);
//});

// THIS WORKS:
//db.save('_design/levels', {
//    byLevel: {
//        map: function (doc) {
//            emit(doc.level, doc);
//        }
//    }
//});
//
//// THIS WORKS:
//db.view('levels/byLevel', { key: 5 }, function (err, d) {
//    console.log("level5 key 5");
//    console.log(d);
//});

//db.view('_design/levels', {
//    level5average: {
//        map: function (doc) {
//            emit(doc.ms_start, doc.data);
//        }
//    }
//});
//
//db.view('levels/level5average', function (err, d) {
//    console.log(d);
//});

// THIS WORKS!
//db.get('G18-a-5-40', function (err, doc) {
//    console.log(doc.data);
//    //console.log(doc.data[0].ms);
//});

// THIS WORKS!
getFromCouch('girder', '18', 'average', 5, 40, console.log);

// THIS WORKS!
//db.temporaryView({
//    map: function (doc) {
//        if (doc.force) emit(doc._id, doc);
//    }
//}, function (err, res) {
//    if (err) console.log(err);
//    console.log(res);
//})

//// THIS WORKS!
//db.save('_design/force', {
//    views: {
//        forcely: {
//            map: 'function (doc) { if (doc.force) emit(doc.force, doc); }'
//        }
//    }
//});
//
//// THIS WORKS!
//db.view('force/forcely', function (err, res) {
//    if (err) console.log("err", err);
//    res.forEach(function (row) {
//        console.log(row.force);
//    })
//});

// THIS WORKS!
//db.view('characters/all', function (err, res) {
//    if (err) {
//        console.log("characters/all", err);
//        return;
//    }
//    res.forEach(function(row) {
//        console.log("%s is on the %s side of the force.", row.name, row.force);
//    });
//});

//db.save('_design/user', {
//    views: {
//        byUsername: {
//            map: 'function (doc) { if (doc.resource === "User") { emit(doc.username, doc) } }'
//        }
//    }
//});
//
//db.view('user/byUsername', { key: 'luke' }, function (err, doc) {
//    console.log("_design/user", err, doc, "_design/user");
//});
