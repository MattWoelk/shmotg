self.addEventListener('message',  function(event){
    switch (event.data) {
        case "oneSample":
            postMessage("one");
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
