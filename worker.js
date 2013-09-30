self.addEventListener('message',  function(event){
    var command = event.data.command;
    var argz = event.data.argz;
    switch (command) {
        case "oneSample":
            postMessage(argz);
            break;
        default:
            var currPrime = event.data
            var nextPrime;
            setInterval( function(){
                nextPrime = getNextPrime(currPrime);
                postMessage(nextPrime);
                currPrime = nextPrime;
            }, 500);
            break;
    }
});

function getNextPrime(i) {
    return i+1;
}
