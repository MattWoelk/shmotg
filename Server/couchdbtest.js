var cradle = require('cradle')
var db = new(cradle.Connection)().database('starwars');

db.save('skywalker', { force: 'light', name: 'Luke Skywalker' }, function (err, res) {
    if (err) {
        //Handle error
    } else {
        // Handle success
        console.log(res);
    }
});

db.save('vader', { force: 'dark', name: 'Darth Vader' }, function (err, res) {
    if (err) {
        //Handle error
    } else {
        // Handle success
        console.log(res);
    }
});

db.get('skywalker', function (err, doc) {
    doc.name; // 'Darth Vader'
    console.log(doc.force, '== dark');
});

// THIS WORKS!
db.temporaryView({
    map: function (doc) {
        if (doc.force) emit(doc._id, doc);
    }
}, function (err, res) {
    if (err) console.log(err);
    console.log(res);
})

// THIS doesn't work... :C
//db.save('_design/characters', {
//    all: {
//        map: function (doc) {
//            if (doc.name) emit(doc.name, doc);
//        }
//    },
//    darkside: {
//        map: function (doc) {
//            if (doc.name && doc.force == 'dark') {
//                emit(null, doc);
//            }
//        }
//    }
//});
//
//db.view('_design/characters/all', {group: true, reduce: true }, function (err, res) {
//    if (err) {
//        console.log("_design/characters/all", err);
//        return;
//    }
//    res.forEach(function(row) {
//        console.log("%s is on the %s side of the force.", row.name, row.force);
//    });
//});
