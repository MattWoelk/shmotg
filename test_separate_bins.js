//path = require("path")
//var filename = path.resolve('./binnedData.js');
//delete require.cache[filename];
require("./binnedData.js");
require("./binnedDatas.js");
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

////////////////////////////////

var brds = binnedDatas();
assert(brds(), [], 'initialization');

var brds = binnedDatas().addRawData([
  {ms: 1000, val: 10},
  {ms: 1005, val: 11},
]);

assert(
    _.pluck(brds.getAllRawData(), 'ms'),
    [1000, 1005],
    'adding raw and reading raw');

assert(
    [brds.getMinRaw()],
    [10],
    'getMaxRaw');

assert(
    [brds.getMaxRaw()],
    [11],
    'getMinRaw');

assert(
    _.pluck(brds.getDateRange('rawData', 0, [0, 5000]), 'ms'),
    [1000, 1005],
    'getDateRange for rawData');

assert(
    _.pluck(brds.getDateRange('rawData', 1, [0, 5000]), 'ms'),
    [1000],
    'getDateRange for level 1');

assert(
    _.pluck(brds.getAllInRange(0, [0, 5000]), 'ms'),
    [1000, 1005],
    'getAllInRange lvl 0');

assert(
    _.pluck(brds.getAllInRange(1, [0, 5000]), 'ms'),
    [1000, 1005],
    'getAllInRange lvl 1');

assert(
    [brds.getColor('rawData')],
    ["#000"],
    'getColor');
