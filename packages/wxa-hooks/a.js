let start = Date.now();
let count = 10;
let num = 0;
let id = 0;
function task(e) {
    if (num >= count) {
        cancelAnimationFrame(id);
        return 
    }
    let cTime = Date.now();
    console.log(`frame duration ${num}`, cTime - start);
    start = cTime;
    num++;
    let a = []
    for (let index = 0; index < 100000; index++) {
        a.push(index)
    }
    requestIdleCallback(idle)
    id = requestAnimationFrame(task);
}

function idle (e){
    console.log(`idle ${num}`, e.timeRemaining());
}

requestIdleCallback(idle);

id = requestAnimationFrame(task);
