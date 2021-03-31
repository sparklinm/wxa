interface Task {
    setupJobs: WXAHook.IFunction[]
    preJobs: WXAHook.IFunction[]
    renderJobs: WXAHook.IFunction[]
    postJobS: WXAHook.IFunction[]
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
let currentTsk:Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobS: [],
};
let isSetting = false;
let isRendering = false;
let isTasking = false;

export function queueSetupJobsAsync(job: WXAHook.IFunction): undefined {
    newTask={
        setupJobs: [],
        preJobs: [],
        renderJobs: [],
        postJobS: [],
    };
    tasks[newTaskIndex] = newTask;
    newTask.setupJobs.push(job);

    if (isSetting) {
        return;
    }

    isSetting = true;

    // 合并一个tick中的setup任务
    wx.nextTick(() => {
        flushJobs(newTask.setupJobs);
        isSetting = false;
        newTaskIndex++;
        render();
    });
}

export function queueSetupJobsSync(job: WXAHook.IFunction): void {
    newTask={
        setupJobs: [],
        preJobs: [],
        renderJobs: [],
        postJobS: [],
    };
    tasks[newTaskIndex] = newTask;
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
        render();
    }, 20);
}

export function queueSetupJobsFirst(job: WXAHook.IFunction): void {
    newTask={
        setupJobs: [],
        preJobs: [],
        renderJobs: [],
        postJobS: [],
    };
    tasks[newTaskIndex] = newTask;
    newTask.setupJobs.push(job);

    flushJobs(newTask.setupJobs);
    newTaskIndex++;
    render();
}

export function queueRenderJobs(job: WXAHook.IFunction): void {
    newTask.renderJobs.push(job);
}

export function queuePreJobs(job: WXAHook.IFunction): void {
    newTask.preJobs.push(job);
}

export function queuePostJobS(job: WXAHook.IFunction): void {
    newTask.postJobS.push(job);
}

async function render() {
    currentTsk = tasks[currentTaskIndex];


    if (!currentTsk) {
        return;
    }

    const {renderJobs, postJobS} = currentTsk;


    if (isRendering || renderJobs.length === 0) {
        return;
    }

    console.log('currentTask', 'renderJobs', renderJobs, 'postJobs', postJobS);

    isRendering = true;
    await flushAsyncJobs(renderJobs);
    isRendering = false;

    flushJobs(postJobS);

    currentTaskIndex ++;
    render();
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
