import {isPromise} from './util';
interface Task {
    setupJobs: WXAHook.IFunction[];
    preJobs: WXAHook.IFunction[];
    renderJobs: WXAHook._$updateData[];
    postJobs: WXAHook.IFunction[];
}

const tasks: Task[] = [];

// 优先级任务，attached 中的 setup 放入其中
// 永远是放入一个setup任务就立刻执行
// priorityTask 中的自身实例 setData 必不会生成新的 setup
const priorityTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobs: [],
};

// 新任务，总是执行末尾
let newTaskIndex = 0;
let newTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobs: [],
};

// 渲染任务，每渲染一个后自动+1
let renderingTaskIndex = 0;
let renderingTask: Task = {
    setupJobs: [],
    preJobs: [],
    renderJobs: [],
    postJobs: [],
};

// 当前操纵的task，可能是 renderingTask, newTask, priorityTask
let currentTask:Task = null;

let renderNums = 0;
const maxRenderNums = 15;

let willSetup = false;
let isRendering = false;
let isRenderTick = false;
let isFlushingNormalRenderJobs = false;
let isFlushPriorityRenderJobs = false;

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
            postJobs: [],
        };
        tasks[newTaskIndex] = newTask;
    }
}

function initTask() {
    // 重置task
    tasks.length = 0;
    renderingTaskIndex = 0;
    newTaskIndex = 0;
    newTask = {
        setupJobs: [],
        preJobs: [],
        renderJobs: [],
        postJobs: [],
    };
}

export function reomveInvalidTask(id: string): void {
    console.log('detached', renderingTaskIndex, tasks);

    for (let i = renderingTaskIndex; i < tasks.length; i++) {
        const task = tasks[i];
        Object.keys(task).forEach((key) => {
            if (key==='setupJobs') {
                console.log(task[key].length);
            }
            task[key].forEach((fn, index) => {
                if (fn && fn.id === id) {
                    task[key][index] = undefined;
                }
            });
        });
    }
}

// 放入setup任务
// 根据策略执行setup任务
// setup任务会产生render任务和post任务
export function queueSetupJobs(
    job: WXAHook.IFunction,
    immediateRender = false,
): void {
    // 立即执行setup，然后立即执行setData
    // 用于组件在attached实例中第一次执行setup时（主要是要兼容hook组件使用原生组件的情况，需要立刻执行）
    if (immediateRender) {
        queuePrioritySetup(job);
        priorityRender();
    } else if (isRenderTick) {
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
    setNewTask();
    currentTask = newTask;
    queueSetup(job);

    if (willSetup) {
        return;
    }

    willSetup = true;

    // 合并一个tick中的setup任务
    nextTick(() => {
        isRenderTick = true;
        willSetup = false;
        newTaskIndex++;

        console.log('[one-task-start]');
        console.time('[one-task-duration]');


        flushSetupJobs(currentTask.setupJobs);

        tryRender();
        console.timeEnd('[one-task-duration]');
    });
}

function queuePrioritySetup(job) {
    currentTask = priorityTask;
    queueSetup(job);

    isRenderTick = true;

    flushSetupJobs(currentTask.setupJobs);
}

function queueSetup(job) {
    currentTask.setupJobs.push(job);
}

function tryRender() {
    // if (!isRendering) {
    //     render();
    // } else {
    //     isRenderTick = false;
    // }
    render();
}

function autoNextRender() {
    renderingTask = tasks[renderingTaskIndex];

    // 恢复上一次中断的setup
    if (renderingTask.setupJobs.length) {
        continueRender();
        return;
    }

    renderingTaskIndex++;
    renderingTask = tasks[renderingTaskIndex];

    if (!renderingTask) {
        initTask();
        return;
    }

    isRenderTick = true;
    render();
}

function continueRender() {
    isRenderTick = true;

    renderingTask = tasks[renderingTaskIndex];
    currentTask = renderingTask;

    flushSetupJobs(currentTask.setupJobs);

    render();
}

// 如果实例本应被销毁，这里还存有实例的渲染，那实例不会被销毁
async function render() {
    console.log(
        'renderingTask',
        renderingTaskIndex,
        tasks[renderingTaskIndex],
        tasks,
    );

    renderingTaskIndex ++;
    renderingTask = tasks[renderingTaskIndex];
    currentTask = renderingTask;

    const {renderJobs} = renderingTask;

    // setData 会导致子组件显示
    // 而子组件useLoad中的setup需要在上一个afterRender后执行
    // 所以这里放在前面
    afterRender();

    isFlushingNormalRenderJobs = true;
    flushRenderJobs(renderJobs);
    isFlushingNormalRenderJobs = false;

    isRenderTick = false;
    renderNums = 0;
}

async function afterRender() {
    if (willPostJobs) {
        return;
    }

    willPostJobs = true;

    nextTick(async () => {
        willPostJobs = false;

        console.log('[normal-render-start]');
        isRendering = true;
        const promises = [...tickRenderPromises];
        tickRenderPromises.length = 0;
        if (promises.length) {
            await Promise.all(promises);
        }
        isRendering = false;

        const {postJobs: normalPostJobS} = renderingTask;
        const {postJobs: priorityPostJobs} = priorityTask;
        const postJobs=[...priorityPostJobs, ...normalPostJobS];
        normalPostJobS.length = 0;
        priorityPostJobs.length = 0;
        flushJobs(postJobs);

        console.log('[normal-render-completed]');

        // autoNextRender();
    });
}


async function priorityRender() {
    const {renderJobs} = currentTask;

    isFlushPriorityRenderJobs = true;
    flushRenderJobs(renderJobs);
    isFlushPriorityRenderJobs = false;

    // 是wx:if产生的组件初始化
    // 必定由父组件的setData导致
    if (isFlushingNormalRenderJobs) {
        currentTask = renderingTask;
    } else {
        // 只会在新页面进入时触发
        isRenderTick = false;
        afterPriorityRender();
    }
}

async function afterPriorityRender() {
    if (willPostJobs) {
        return;
    }

    willPostJobs = true;

    nextTick(async () => {
        willPostJobs = false;

        isRendering = true;
        const promises = [...tickRenderPromises];
        tickRenderPromises.length = 0;
        if (promises.length) {
            await Promise.all(promises);
        }
        isRendering = false;

        const {postJobs} = priorityTask;
        flushJobs(postJobs);

        console.log('[page-first-render-completed]');

        // 渲染正常队列中的任务
        // renderingTask = tasks[renderingTaskIndex];

        // if (renderingTask && renderingTask.renderJobs.length) {
        //     isRenderTick = true;
        //     render();
        // }
    });
}


const tickRenderPromises = [];
let willPostJobs = false;

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
    const oLength = tickRenderPromises.length;

    instance.groupSetData(() => {
        currentJobs.forEach((job) => {
            const res = job && job();

            if (isPromise(res)) {
                tickRenderPromises.push(res);
            }
        });
    });

    const nLength = tickRenderPromises.length;

    if (!isFlushPriorityRenderJobs) {
        if (nLength > oLength) {
            renderNums++;
        }

        // 一次性setData超过限制，中断
        if (renderNums >= maxRenderNums) {
            renderNums = 0;
            return;
        }
    }

    // 执行setData，会产生子组件的setup，执行子组件的setup
    flushSetupJobs(currentTask.setupJobs);
    // 执行由setup产生的setData
    flushRenderJobs(jobs);
}

function flushSetupJobs(jobs: WXAHook.IFunction[]) {
    flushJobs(jobs);
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
    currentTask.renderJobs.push(job);
}

export function queuePreJobs(job: WXAHook.IFunction): void {
    currentTask.preJobs.push(job);
}

export function queuePostJobs(job: WXAHook.IFunction): void {
    currentTask.postJobs.push(job);
}
