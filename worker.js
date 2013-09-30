if(typeof importScripts == "function"){
    importScripts('binnedData.js'); // TODO: why does this need to be in here?
}

var binData = binnedData();

self.addEventListener('message',  function(event){
    var command = event.data.command;
    var argz = event.data.argz;
    postMessage([command, binData[command].apply(binData, argz)]);
});
