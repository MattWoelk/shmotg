require("./binnedData.js");
_ = require('underscore');
d3 = require("d3");

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

function inAButNotInB(arr1, arr2) {
    return _.filter(arr1, function (d) {
        return !_.contains(arr2, d);
    });
}

function assert(a, b, test) {
    if(inAButNotInB(a, b).length === 0 && inAButNotInB(b, a).length === 0) {
        console.log("+ Passed:", test);
    } else {
        console.log("- "+red+"Failed"+reset+":", test);
        console.log("    Result is", a);
        console.log("    Should be", b);
    }
}

function assertDirect(a, b, test) {
    if(typeof a  !== 'undefined' && a.toString().localeCompare(b.toString()) === 0) {
        console.log("+ Passed:", test);
    } else {
        console.log("- "+red+"Failed"+reset+":", test);
        console.log("  Result is", a);
        console.log("  Should be", b);
    }
}

var brd = binnedData().addRawData([
                                  {ms: 1000, val: 10},
                                  {ms: 1005, val: 12},
]);

assert(_.pluck(brd.bd().rawData.levels[0], 'ms'), [1000, 1005], 'adding raw and reading raw');
assertDirect(brd.getMaxRaw(), 12, 'getMaxRaw');
assertDirect(brd.getMinRaw(), 10, 'getMinRaw');
assertDirect(brd.getMaxRawMS(), 1005, 'getMaxRawMS');
assertDirect(brd.getMinRawMS(), 1000, 'getMinRawMS');

// Missing in the middle.
var bird = binnedData().addRawData([
                                   {ms: 1000, val: 10},
                                   {ms: 1005, val: 10},
                                   {ms: 1010, val: 20},
                                   {ms: 1015, val: 20},
                                   {ms: 1030, val: 30},
                                   {ms: 1035, val: 30},
                                   {ms: 1040, val: 10},
                                   {ms: 1045, val: 10},
                                   {ms: 1050, val: 20},
                                   {ms: 1055, val: 20},
]);

assert(_.flatten(bird.missingBins([1000, 1050], 0)), [1020, 1025, 1025, 1030], 'Missing Data In Middle: lvl 0 raw data');

// No missing data.
var burd = binnedData().addRawData([
                                   {ms: 1000, val: 10},
                                   {ms: 1005, val: 10},
                                   {ms: 1010, val: 20},
                                   {ms: 1015, val: 20},
                                   {ms: 1020, val: 20},
                                   {ms: 1025, val: 20},
                                   {ms: 1030, val: 30},
                                   {ms: 1035, val: 30},
                                   {ms: 1040, val: 10},
                                   {ms: 1045, val: 10},
                                   {ms: 1050, val: 20},
                                   {ms: 1055, val: 20},
]);

assert(_.flatten(burd.missingBins([1000, 1055], 0)), [], 'No Missing Data: lvl 0 raw data')
assert(_.pluck(burd.bd().average.levels[1], 'ms'), [1000, 1010, 1020, 1030, 1040, 1050], 'No Missing Data: lvl 1 bins');
assert([burd.bd().average.levels[0].length], [12], 'No Missing Data: lvl 0 length');
assert([burd.bd().average.levels[1].length], [6], 'No Missing Data: lvl 1 length');
assert([burd.bd().average.levels[2].length], [3], 'No Missing Data: lvl 2 length');

// Missing at end
assert(_.flatten(burd.missingBins([1000, 1065], 0)), [1060, 1065, 1065, 1070], 'missing at end');

// Missing at start
assert(_.flatten(burd.missingBins([990, 1055], 0)), [990, 995, 995, 1000], 'Missing Start: raw data');

var bord = binnedData().addRawData([
                                   {ms: 1005, val: 10},
                                   {ms: 1010, val: 20},
                                   {ms: 1015, val: 20},
                                   {ms: 1020, val: 20},
                                   {ms: 1040, val: 10},
                                   {ms: 1045, val: 10},
                                   {ms: 1050, val: 20},
                                   {ms: 1055, val: 20},
]);

// No missing data.
var burd = binnedData().addRawData([
                                   {ms: 1005, val: 10},
                                   {ms: 1010, val: 20},
                                   {ms: 1015, val: 20},
                                   {ms: 1020, val: 20},
                                   {ms: 1025, val: 20},
                                   {ms: 1030, val: 30},
                                   {ms: 1035, val: 30},
                                   {ms: 1040, val: 10},
                                   {ms: 1045, val: 10},
                                   {ms: 1050, val: 20},
                                   {ms: 1055, val: 20},
]);

assert(_.flatten(burd.missingBins([1000, 1050], 0)), [1000, 1005], 'Missing Start: lvl 0 raw data');
assert(_.pluck(burd.bd().average.levels[1], 'ms'), [1010, 1020, 1030, 1040, 1050], 'Missing Start: lvl 1 bins');
assert(_.flatten(burd.missingBins([1000, 1050], 1)), [1000, 1010], 'Missing Start: lvl 1 missing bins');

assert(_.flatten(burd.missingBins([1010, 1060], 0)), [1060, 1065], 'Missing End: lvl 0 raw data');
assert(_.flatten(burd.missingBins([1010, 1060], 1)), [1060, 1070], 'Missing End: lvl 1 missing bins');


var bard = binnedData().addRawData([
                                   {ms: 1005, val: 10},
                                   {ms: 1010, val: 20},
                                   {ms: 1015, val: 20},
                                   {ms: 1020, val: 20},
                                   {ms: 1040, val: 10},
                                   {ms: 1045, val: 10},
                                   {ms: 1050, val: 20},
                                   {ms: 1055, val: 20},
]);

assert(_.pluck(bard.bd().average.levels[1], 'ms'), [1010, 1040, 1050], 'Missing At Start And Middle: lvl 1 bins');
assert(_.flatten(bard.missingBins([1000, 1050], 1)), [1000, 1010, 1020, 1030, 1030, 1040], 'Missing At Start And Middle: lvl 1 missing bins');
assert(_.flatten(bard.missingBins([1001, 1046], 1)), [1000, 1010, 1020, 1030, 1030, 1040], 'Missing At Start And Middle: lvl 1 missing bins with a non5mod range');


var bard = binnedData().addRawData([
                                   {ms: 5,  val: 1},
                                   {ms: 10, val: 2},
                                   {ms: 15, val: 2},
                                   {ms: 20, val: 2},
                                   {ms: 40, val: 1},
                                   {ms: 45, val: 1},
                                   {ms: 50, val: 2},
                                   {ms: 55, val: 2},
]);

assert(_.flatten(bard.missingRawBinsUnderThisRangeAndLevel([20, 40], 2)), [0, 10, 20, 30, 30, 40], 'raw bins required under level');




