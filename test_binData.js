require("./binnedData.js");
_ = require('underscore');
d3 = require("d3");

function inAButNotInB(arr1, arr2) {
  return _.filter(arr1, function (d) {
    return !_.contains(arr2, d);
  });
}

function assert(a, b, test) {
  if(inAButNotInB(a, b).length === 0 && inAButNotInB(b, a).length === 0) {
    console.log("+ Passed:", test);
  } else {
    console.log("- Failed:", test);
    console.log("  Result is", a);
    console.log("  Should be", b);
  }
}

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

// Missing at end
assert(_.flatten(burd.missingBins([1000, 1065], 0)), [1060, 1065, 1065, 1070], 'missing at end');

// Missing at start
assert(_.flatten(burd.missingBins([990, 1055], 0)), [990, 995, 995, 1000], 'Missing Beginning: raw data');

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

assert(_.flatten(burd.missingBins([1000, 1050], 0)), [1000, 1005], 'Missing Beginning: lvl 0 raw data');
assert(_.pluck(burd.bd().average.levels[1], 'ms'), [1010, 1020, 1030, 1040, 1050], 'Missing Beginning: lvl 1 bins');
assert(_.flatten(burd.missingBins([1000, 1050], 1)), [1000, 1010], 'Missing Beginning: lvl 1 missing bins');

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

assert(_.pluck(bard.bd().average.levels[1], 'ms'), [1010, 1040, 1050], 'Missing At Beginning And Middle: lvl 1 bins');
assert(_.flatten(bard.missingBins([1000, 1050], 1)), [1000, 1010, 1020, 1030, 1030, 1040], 'Missing At Beginning And Middle: lvl 1 missing bins');

