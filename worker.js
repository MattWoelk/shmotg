self.addEventListener('message',  function(event){
    var currPrime = event.data
    var nextPrime;
    setInterval( function(){
        nextPrime = getNextPrime(currPrime);
        postMessage(nextPrime);
        currPrime = nextPrime;
    }, 500);
});

function getNextPrime(i) {
    return i+1;
}
