import {isPromise} from './util';
interface Task {
    setupJobs: WXAHook.IFunction[]
    preJobs: WXAHook.IFunction[]
    renderJobs: WXAHook._$updateData[]
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
let currentTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobS: [],
};
let willSetup = false;
let isRendering = false;
let isRenderTick = true;
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
// setup任务会产生render任务和post任务
export function queueSetupJobs(job: WXAHook.IFunction, immediateRender = false): void {
    // 立即执行setup，然后立即执行setData
    // 用于组件在attached实例中第一次执行setup时（主要是要兼容hook组件使用原生组件的情况，需要立刻执行）
    if (immediateRender) {
        isRenderTick = true;
        isImmediateRender = true;
        queueSetupAndRun(job);
        render();
    } else if (isRenderTick) {
        // 只是放入setup任务
        // 当第一个setup执行时，后续无论是setup产生的setup
        // 或是setData产生的setup
        // 都只是单纯放入队列
        queueSetup(job);
    } else {
        // 下一个tick执行同步代码中放入的所有setup
        // 用于setState时，放入的setup
        queueSetupAndDeferRun(job);
    }
}

function queueSetupAndDeferRun(job) {
    queueSetup(job);
    if (willSetup) {
        return;
    }

    willSetup = true;

    // 合并一个tick中的setup任务
    nextTick(() => {
        isRenderTick = true;
        flushJobs(newTask.setupJobs);
        willSetup = false;
        tryRender();
    });
}

function queueSetupAndRun(job) {
    queueSetup(job);
    flushJobs(newTask.setupJobs);
}

function queueSetup(job) {
    setNewTask();
    newTask.setupJobs.push(job);
}

function checkCanRender() {
    return !isRendering || isImmediateRender;
}

function tryRender() {
    if (checkCanRender()) {
        render();
        return;
    }

    isRenderTick = false;
}

function autoNextRender() {
    currentTask = tasks[currentTaskIndex];

    if (!currentTask) {
        initTask();
        return;
    }

    isRenderTick = true;
    render();
}

// 如果实例本应被销毁，这里还存有实例的渲染，那实例不会被销毁
async function render() {
    console.log('currentTask', currentTaskIndex, tasks[currentTaskIndex], tasks);

    currentTask = tasks[currentTaskIndex];

    const {renderJobs} = currentTask;

    // console.log('currentTask', 'renderJobs', renderJobs, 'postJobs', postJobS);
    flushRenderJobs(renderJobs);
    afterRender();
}

async function afterRender() {
    if (willPostRender) {
        return;
    }

    willPostRender = true;

    nextTick(async () => {
        console.log('-----------tick---------------');

        isRenderTick = false;
        willPostRender = false;
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
        autoNextRender();
    });
}

const tickRenderPromises = [];
let willPostRender = false;

// 执行job，可能会setData
// 如果setData，可能会同步触发子组件的setup，添加子组件的渲染任务
// 所以需要继续setData子组件
// 渲染任务返回一个promise，这里将同步代码产生的promise存储到一个数组
// 在微任务队列中，等到所有promise resolved完毕，执行effect任务
function flushRenderJobs(jobs: WXAHook._$updateData[]) {
    if (jobs.length === 0) {
        return;
    }

    const currentJobs = [...new Set(jobs)];
    jobs.length = 0;

    const instance = currentJobs[0].instance;

    instance.groupSetData(()=>{
        currentJobs.forEach((job) => {
            const res = job && job();

            if (isPromise(res)) {
                tickRenderPromises.push(res);
            }
        });
    });

    // 执行setData，会产生子组件的setup，执行子组件的setup
    flushJobs(newTask.setupJobs);
    // 执行由setup产生的setData
    flushRenderJobs(jobs);
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

export function queueRenderJobs(job: WXAHook._$updateData): void {
    newTask.renderJobs.push(job);
}

export function queuePreJobs(job: WXAHook.IFunction): void {
    newTask.preJobs.push(job);
}

export function queuePostJobs(job: WXAHook.IFunction): void {
    newTask.postJobS.push(job);
}
