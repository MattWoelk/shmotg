var cradle = require('cradle')
var db = new(cradle.Connection)().database('starwars');

// THIS worked.
db.save('skywalker', { force: 'light', name: 'Luke Skywalker' }, function (err, res) {
    if (err) {
        //Handle error
    } else {
        // Handle success
        //console.log(res);
    }
});

db.save('vader', { force: 'dark', name: 'Darth Vader' }, function (err, res) {
    if (err) {
        //Handle error
    } else {
        // Handle success
        //console.log(res);
    }
});

// THIS WORKS! (Will try to do things this way)
db.get('skywalker', function (err, doc) {
    doc.name; // 'Darth Vader'
    console.log(doc.force, '== dark');
});

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
