interface Task {
    setupJobs: WXAHook.IFunction[];
    preJobs: WXAHook.IFunction[];
    renderJobs: WXAHook.IFunction[];
    postJobS: WXAHook.IFunction[];
}

const tasks: Task[] = [];
let newTaskIndex = 0;
let newTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobS: [],
};
let currentTaskIndex = 0;
let currentTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobS: [],
};
let isSetting = false;
let isRendering = false;
let isTasking = false;

// 同步代码中的setup被合并
// 微任务队列中执行setup
// 然后尝试渲染

function setNewTask() {
    newTask = tasks[newTaskIndex];
    if (!newTask) {
        newTask = {
            setupJobs: [],
            preJobs: [],
            renderJobs: [],
            postJobS: [],
        };
        tasks[newTaskIndex] = newTask;
    }
}

export function queueSetupJobsAsync(job: WXAHook.IFunction): undefined {
    setNewTask();
    newTask.setupJobs.push(job);

    if (isSetting) {
        return;
    }

    isSetting = true;

    // 合并一个tick中的setup任务
    Promise.resolve().then(() => {
        flushJobs(newTask.setupJobs);
        isSetting = false;
        newTaskIndex++;
        waitRender();
    });
}

export function queueSetupJobsSync(job: WXAHook.IFunction): void {
    setNewTask();
    newTask.setupJobs.push(job);

    flushJobs(newTask.setupJobs);

    if (isTasking) {
        return;
    }

    isTasking = true;

    // 合并20ms内的渲染任务
    setTimeout(() => {
        isTasking = false;
        newTaskIndex++;
        waitRender();
    }, 20);
}

// attached时第一次setup
// 父子组件的attached是同步依次触发的
// 此时父子组件同时setData
// 如果父组件setData完毕再子组件setData，比正常同时setData慢
// 因为同时多次setData，渲染层在渲染时可能会合并
export function queueSetupJobsFirst(job: WXAHook.IFunction): void {
    setNewTask();
    newTask.setupJobs.push(job);

    flushJobs(newTask.setupJobs);
    newTaskIndex++;
    directRender();
}

export function queueRenderJobs(job: WXAHook.IFunction): void {
    newTask.renderJobs.push(job);
}

export function queuePreJobs(job: WXAHook.IFunction): void {
    newTask.preJobs.push(job);
}

export function queuePostJobs(job: WXAHook.IFunction): void {
    newTask.postJobS.push(job);
}

async function directRender() {
    console.log('currentTask', currentTaskIndex, tasks);
    currentTask = tasks[currentTaskIndex];

    if (!currentTask) {
        return;
    }

    const {renderJobs, postJobS} = currentTask;

    console.log('currentTask', 'renderJobs', renderJobs, 'postJobs', postJobS);
    console.time('----render----');
    await flushAsyncJobs(renderJobs);
    console.timeEnd('----render----');

    flushJobs(postJobS);

    currentTaskIndex++;
}


// 永远都只会是推入一个任务渲染一个任务
// 渲染后的行为会被放入一个微任务队列，而新增的渲染任务也是经过微任务（或者宏任务队列合并的）
// 这表明，新的渲染任务一定会在上次渲染后，再被推入队列
// 如果实例本应被销毁，这里还存有实例的渲染，那实例不会被销毁
async function waitRender() {
    console.log('currentTask', currentTaskIndex, tasks);

    currentTask = tasks[currentTaskIndex];

    if (!currentTask) {
        return;
    }

    const {renderJobs, postJobS} = currentTask;

    if (isRendering || renderJobs.length === 0) {
        return;
    }

    console.log('currentTask', 'renderJobs', renderJobs, 'postJobs', postJobS);
    console.time('----render----');
    isRendering = true;
    await flushAsyncJobs(renderJobs);
    isRendering = false;
    console.timeEnd('----render----');

    flushJobs(postJobS);

    currentTaskIndex++;
    waitRender();
}

function flushJobs(jobs: WXAHook.IFunction[]) {
    if (jobs.length === 0) {
        return;
    }

    const currentJobs = new Set(jobs);
    jobs.length = 0;
    currentJobs.forEach((job) => {
        job && job();
    });
    flushJobs(jobs);
}

async function flushAsyncJobs(jobs: WXAHook.IFunction[]) {
    if (jobs.length === 0) {
        return;
    }

    const currentJobs = new Set(jobs);
    jobs.length = 0;

    const promises = [];
    currentJobs.forEach((job) => {
        promises.push(job());
    });

    await Promise.all(promises);
}
