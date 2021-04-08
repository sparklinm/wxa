import {isPromise} from './util';
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
let willSet = false;
let isSetting = false;
let isRendering = false;
let isTasking = false;
let isOneTick = true;
let isImmediateRender = false;

// 同步代码中的setup被合并
// 微任务队列中执行setup
// 然后尝试渲染

function nextTick(fn: WXAHook.IFunction) {
    Promise.resolve().then(() => {
        fn && fn();
    });
}

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

function initTask() {
    // 重置task
    tasks.length = 0;
    currentTaskIndex = 0;
    newTaskIndex = 0;
    newTask = {
        setupJobs: [],
        preJobs: [],
        renderJobs: [],
        postJobS: [],
    };
}

export function reomveInvalidTask(id: string): void {
    for (let i = currentTaskIndex; i < tasks.length; i++) {
        const task = tasks[i];
        Object.keys(task).forEach((key) => {
            tasks[key].forEach((fn, index) => {
                if (fn.id === id) {
                    tasks[key][index] = undefined;
                }
            });
        });
    }
}

// 放入setup任务
// 根据策略执行setup任务
export function queueSetupJobsAsync(
    job: WXAHook.IFunction,
    immediateRender = false,
): void {
    console.log(newTaskIndex, tasks.length);
    console.log(isOneTick);

    if (immediateRender) {
        isOneTick = true;
        isImmediateRender = true;
    }

    if (isOneTick) {
        setNewTask();
        newTask.setupJobs.push(job);

        if (isSetting) {
            return;
        }

        isSetting = true;
        flushJobs(newTask.setupJobs);
        isSetting = false;

        waitRender();
    } else {
        setNewTask();

        newTask.setupJobs.push(job);

        if (willSet) {
            return;
        }

        willSet = true;

        // 合并一个tick中的setup任务
        nextTick(() => {
            isOneTick = true;
            isSetting = true;
            flushJobs(newTask.setupJobs);
            isSetting = false;
            willSet = false;
            waitRender();
        });
    }
}

// 如果实例本应被销毁，这里还存有实例的渲染，那实例不会被销毁
async function waitRender() {
    console.log(
        'currentTask',
        currentTaskIndex,
        tasks[currentTaskIndex],
        tasks,
    );

    currentTask = tasks[currentTaskIndex];

    if (!currentTask) {
        initTask();
        return;
    }

    const {renderJobs} = currentTask;

    if (isRendering && !isImmediateRender) {
        return;
    }

    // console.log('currentTask', 'renderJobs', renderJobs, 'postJobs', postJobS);

    mergeRenderJobs(renderJobs);
    afterRender();
}

async function afterRender() {
    if (isMerging) {
        return;
    }

    isMerging = true;

    nextTick(async () => {
        console.log('-----------tick---------------');

        isOneTick = false;
        isMerging = false;
        isImmediateRender = false;

        newTaskIndex++;

        isRendering = true;
        const promises = [...tickRenderPromises];
        tickRenderPromises.length = 0;
        await Promise.all(promises);

        isRendering = false;

        const {postJobS} = currentTask;
        flushJobs(postJobS);

        currentTaskIndex++;
        waitRender();
    });
}

const tickRenderPromises = [];
let isMerging = false;

// 执行job，可能会setData
// 如果setData，可能会同步触发子组件的setup，添加子组件的渲染任务
// 所以需要继续setData子组件
// 渲染任务返回一个promise，这里将同步代码产生的promise存储到一个数组
// 在微任务队列中，等到所有promise resolved完毕，执行effect任务
function mergeRenderJobs(jobs) {
    function doFlush(jobs: WXAHook.IFunction[]) {
        if (jobs.length === 0) {
            return;
        }

        const currentJobs = new Set(jobs);
        jobs.length = 0;

        currentJobs.forEach((job) => {
            const res = job && job();

            if (isPromise(res)) {
                tickRenderPromises.push(res);
            }
        });
    }

    doFlush(jobs);
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

export function queueRenderJobs(job: WXAHook.IFunction): void {
    newTask.renderJobs.push(job);
}

export function queuePreJobs(job: WXAHook.IFunction): void {
    newTask.preJobs.push(job);
}

export function queuePostJobs(job: WXAHook.IFunction): void {
    newTask.postJobS.push(job);
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
        waitRender();
        newTaskIndex++;
    }, 20);
}
