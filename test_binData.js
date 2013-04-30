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

assert(_.flatten(bird.missingBins([1000, 1050], 0)), [1020, 1025, 1025, 1030], 'missing in the middle');

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

assert(_.flatten(burd.missingBins([1000, 1055], 0)), [], 'no missing data')
assert(_.pluck(burd.bd().average.levels[1], 'ms'), [1000, 1010, 1020, 1030, 1040, 1050], 'average bin locations; no missing data');

// Missing at start
assert(_.flatten(burd.missingBins([990, 1055], 0)), [990, 995, 995, 1000], 'missing at start');

// Missing at end
assert(_.flatten(burd.missingBins([1000, 1065], 0)), [1060, 1065, 1065, 1070], 'missing at end');

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

assert(_.pluck(burd.bd().average.levels[1], 'ms'), [1010, 1020, 1030, 1040, 1050], 'average bin locations; beginning starts at non modular location');

assert(_.flatten(bord.missingBins([1000, 1050], 0)), [1000, 1005, 1025, 1030, 1030, 1035, 1035, 1040], 'raw  : missing beginning');
assert(_.flatten(bord.missingBins([1000, 1050], 1)), [1000, 1010], 'lvl 1: missing beginning');

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

assert(_.pluck(bard.bd().average.levels[1], 'ms'), [1010, 1040, 1050], 'average bin locations; missing at beginning and middle');

assert(_.flatten(bard.missingBins([1000, 1050], 1)), [1000, 1005, 1025, 1030, 1030, 1035, 1035, 1040], 'level 1 missing bins; missing at beginning and middle');

