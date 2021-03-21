global.wx = {
    nextTick(fn) {
        setTimeout(() => {
            fn();
        }, 0);
    },
};
