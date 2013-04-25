require("./binnedData.js");
_ = require('underscore');
d3 = require("d3");

var bird = binnedData();
bird.addRawData([
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

var res = _.flatten(bird.missingBins([1000, 1050], 0));
res.sort(function (a, b) { return a - b; });
console.log("Result is", res);
console.log("Should be", [1020, 1025, 1025, 1030]);

var burd = binnedData();
burd.addRawData([
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

console.log("Result is", _.flatten(burd.missingBins([1000, 1050], 0)));
console.log("Should be", []);

var bord = binnedData();
bord.addRawData([
  {ms: 1005, val: 10},
  {ms: 1010, val: 20},
  {ms: 1015, val: 20},
  {ms: 1020, val: 20},
  {ms: 1040, val: 10},
  {ms: 1045, val: 10},
  {ms: 1050, val: 20},
  {ms: 1055, val: 20},
]);

console.log("Result is", _.flatten(bord.missingBins([1000, 1050], 0)));
console.log("Should be", [1000, 1005, 1025, 1030, 1030, 1035, 1035, 1040]);

var bard = binnedData();
bard.addRawData([
  {ms: 1005, val: 10},
  {ms: 1010, val: 20},
  {ms: 1015, val: 20},
  {ms: 1020, val: 20},
  {ms: 1040, val: 10},
  {ms: 1045, val: 10},
  {ms: 1050, val: 20},
  {ms: 1055, val: 20},
]);

console.log("averages at level 1: ", _.pluck(bard.bd().average.levels[1], 'ms'))
console.log("should be like this: ", [1010, 1040, 1050])
console.log("Result is", _.flatten(bard.missingBins([1000, 1050], 1)));
console.log("Should be", [1000, 1005, 1025, 1030, 1030, 1035, 1035, 1040]);

