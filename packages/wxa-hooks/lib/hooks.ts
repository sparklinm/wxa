// tslint:disable: no-unused-expression no-console
import {wxa, diff} from '@wxa/core';
import {
    clearStoredOptions,
    clearStoragedRelations,
    storedPageOptions,
    storedComponentOptions,
    storedBothOptions,
    storedOptions,
    storagedRelations,
} from './nativeOptions';
import {isObj, depsChanged} from './util';
import {
    queueSetupJobs, queuePostJobs, queueRenderJobs, reomveInvalidTask,
} from './scheduler';

let currentComInstance: WXAHook.componentInstance = null;
let callIndex = 0;

const checkInstance = (): void => {
    // tslint:disable-next-line: curly
    if (!currentComInstance) throw new Error('Component instance not found');
};

const MapPageLifetimes = {
    show: 'onShow',
    hide: 'onHide',
    resize: 'onResize',
};

// Component的选项只能在创建前添加
function setOptionBefore(config: WXAHook.componentConfig, preDeclareField: WXAHook.PreDeclareField) {
    config.lifetimes = config.lifetimes || {};
    for (const key of Object.keys(storedComponentOptions)) {
        const originFn = config.lifetimes[key] || config[key];
        config.lifetimes[key] = function(params) {
            originFn && originFn.call(this, params);
            this._$storedOptions[key].forEach((cb: () => WXAHook.IType) => {
                if (cb) cb();
            });
        };
    }

    config.pageLifetimes = config.pageLifetimes || {};
    for (const key of Object.keys(storedBothOptions)) {
        const originFn = config.pageLifetimes[key] || config[MapPageLifetimes[key]];
        config.pageLifetimes[key] = function(params) {
            originFn && originFn.call(this, params);
            this._$storedOptions[key].forEach((cb: () => WXAHook.IType) => {
                if (cb) cb();
            });
        };
    }

    if (preDeclareField && preDeclareField.relations) {
        const names = ['linked', 'linkChanged', 'unlinked'];
        if (Array.isArray(preDeclareField.relations)) {
            for (const [key, kind] of preDeclareField.relations) {
                const relation: Relation = {
                    type: kind,
                };

                names.forEach((name) => {
                    relation[name] = function(target) {
                        this._$storagedRelations[key][name].forEach((cb) => {
                            cb && cb(target);
                        });
                    };
                });

                config.relations = config.relations || {};
                config.relations[key] = relation;
            }
        } else {
            // TODOS 需要支持原生的relation写法
            console.error('[WXA HOOK] 暂不支持原生的relation写法， 请使用useRelation');
        }
    }
}

// Page 的选项可以在创建后动态添加
function setOptionAfter(vm: WXAHook.componentInstance) {
    for (const [key, cbs] of Object.entries(storedPageOptions)) {
        if (cbs.length) {
            const originFn = vm[key];
            vm[key] = function(this: WXAHook.componentInstance, params) {
                let res;

                typeof originFn === 'function' && originFn.call(this, params);
                this._$storedOptions[key].forEach((cb) => {
                    res = cb && cb(params);
                });

                if (key === 'onShareAppMessage' || key === 'onShareTimeline') {
                    return res;
                }
            };
        }
    }
}

const log = (...args) => {
    console.log('[WXA hooks]', ...args);
};

function withHooks(
    setup: (props?: WXAHook.IObject) => WXAHook.ComponentStateAndMethod,
    options: WXAHook.componentOptions,
): WXAHook.IObject {
    // tslint:disable-next-line: no-empty
    setup = typeof setup === 'function' ? setup : () => ({});

    const config: WXAHook.componentConfig = {
        ...options,
        created() {
            this._$state = {};
            this._$effect = {};
            this._$useMemo = {};
            this._$refs = {};
            this._$dom = new Map();
            this._$properties = Object.keys(config.properties);
            // 初始渲染，即第一次执行_$setup
            this._$firstRender = true;
            this._$isSetting = false;
            this._$destroyed = false;
            this._$id = this.is + '-' + Date.now().toString(32);

            const _$updateData = () => {
                if (this._$destroyed) {
                    return;
                }

                const sourceData = this._$sourceData;
                if (isObj(sourceData)) {
                    const diffedData = diff.bind(this)(sourceData);

                    if (Object.keys(diffedData || {}).length === 0) {
                        return;
                    }

                    // console.log('diffedData', diffedData);

                    return new Promise<void>((resolve) => {
                        console.time('[setData]');

                        this.setData(diffedData, () => {
                            // console.log('update');
                            resolve();
                        });
                        console.timeEnd('[setData]');
                    });
                }
            };
            _$updateData.id = this._$id;
            _$updateData.instance = this;
            this._$updateData = _$updateData;

            let cansetOptionAfter = true;

            const _$setup = () => {
                if (this._$destroyed) {
                    return;
                }

                callIndex = 0;
                // console.time('setup');
                currentComInstance = this;
                const {data = {}, methods = {}} = setup.call(null, this._$getPropsValue()) || {};

                currentComInstance = null;

                if (cansetOptionAfter) {
                    setOptionAfter(this);
                    cansetOptionAfter = false;
                }
                this._$storedOptions = Object.assign({}, storedOptions);
                clearStoredOptions();
                this._$storagedRelations = Object.assign({}, storagedRelations);
                clearStoragedRelations();

                Object.keys(methods).forEach((key) => {
                    this[key] = methods[key];
                });

                // console.timeEnd('setup');
                this._$sourceData = JSON.parse(JSON.stringify(data));

                // console.log('_$sourceData', this._$sourceData);
                // console.log('---path---', this._$id);

                queueRenderJobs(this._$updateData);

                this._$firstRender = false;

                // console.timeEnd('setup');
            };

            _$setup.id = this._$id;
            this._$setup = _$setup;

            this._$getPropsValue = () => {
                const props = {};
                this._$properties.forEach((element) => {
                    props[element] = this.data[element];
                });
                return props;
            };
        },
        attached() {
            queueSetupJobs(this._$setup, true);
            // const parent = this.selectOwnerComponent() as WXAHook.componentInstance;
            // if (!parent) {
            //     return;
            // }

            // let children: Set<any> = this._$dom.get(parent);
            // if (!children) {
            //     this._$dom.set(parent, (children = new Set()));
            // }
            // children.add(this);
        },
        detached() {
            Object.keys(this._$effect).forEach((key) => {
                const effect = this._$effect[key];
                const destroy = effect.destroy;

                // tslint:disable-next-line: curly
                if (typeof destroy === 'function') destroy.call(null);
            });
            this._$destroyed = true;

            reomveInvalidTask(this._$id);
        },
    };

    config.observers = config.observers || {};
    config.properties = config.properties || {};
    const propertiesKeys = Object.keys(config.properties);
    // tslint:disable-next-line: only-arrow-functions
    if (propertiesKeys.length) {
        config.observers[propertiesKeys.join(',')] = function(...params) {
            // 在第一次渲染前，也会观察到properties的变化
            // 并且会早于父组件的第一次渲染前
            // 此时传递过来的数据全为空，所以舍弃

            // 另外第一次是在attached中同步setData
            // 父组件会先于子组件setData
            // 此时观察到的变化也舍弃，所以第一次setup一定是在attached由组件自己触发。
            if (this._$firstRender) {
                return;
            }

            // log('observer change', Object.keys(config.properties).join(','));
            // this._$setup();
            queueSetupJobs(this._$setup);
        };
    }

    setOptionBefore(config, {
        // TODOS: 兼容原生写法
        relations: config.relations,
    });

    return wxa.launchComponent(config);
}

function dispatch(state, action) {
    if (typeof action !== 'function') {
        state.value = action;
    } else {
        state.value = action(state.value);
    }
}

function useState<T extends WXAHook.IType>(init: T): [T, WXAHook.IFunction] {
    checkInstance();

    const index = callIndex++;
    const instance = currentComInstance;

    let state = instance._$state[index];

    // initialState;
    if (state === undefined) {
        const initState = () => {
            state = {
                value: undefined,
                tracks: [init],
                get() {
                    state.tracks.forEach((track) => {
                        dispatch(state, track);
                    });

                    state.tracks.length = 0;
                },
            };

            state.initFn = <WXAHook.IFunction>init;

            instance._$state[index] = state;
        };

        initState();
    }

    // tslint:disable-next-line: only-arrow-functions
    const setState = function(value: WXAHook.IType | WXAHook.SetStateCb) {
        if (Object.is(value, state.value)) {
            return;
        }
        state.tracks.push(value);
        queueSetupJobs(instance._$setup);
    };

    state.get();

    return [state.value as T, setState];
}

function useEffect(effectFn: () => WXAHook.EffectDestroy, deps: WXAHook.Deps): void {
    checkInstance();

    const index = callIndex++;
    const instance = currentComInstance;

    let effect = instance._$effect[index];

    const setEffect = () => {
        effect.lastDeps = deps === undefined ? undefined : [...deps];
        effect.cb = effectFn;
    };

    if (effect === undefined) {
        const initEffect = () => {
            const runEffect = () => {
                if (instance._$destroyed) {
                    return;
                }
                // 清除上一次的 effecct
                if (typeof effect.destroy === 'function') {
                    effect.destroy();
                    effect.destroy = null;
                }
                // 调用下一次的 effect;
                if (effect.cb) {
                    effect.destroy = effect.cb.call(null);
                }
            };

            runEffect.id = instance._$id;

            effect = {
                run: runEffect,
                cb: undefined,
                lastDeps: undefined,
            };
            setEffect();

            instance._$effect[index] = effect;
        };

        initEffect();
        queuePostJobs(effect.run);

        return;
    }

    if (depsChanged(deps, effect.lastDeps)) {
        setEffect();
        queuePostJobs(effect.run);
    }
}

function useMemo<T extends WXAHook.MemoValue>(memoFn: () => T, deps: WXAHook.Deps): T {
    checkInstance();

    const index = callIndex++;
    const instance = currentComInstance;
    const memo = instance._$useMemo[index];

    const runCallback = () => {
        instance._$useMemo[index] = {
            lastDeps: deps === undefined ? undefined : [...deps],
            value: memoFn(),
        };

        return instance._$useMemo[index].value as T;
    };

    if (memo === undefined) {
        return runCallback();
    }

    if (depsChanged(deps, memo.lastDeps)) {
        return runCallback();
    }

    return instance._$useMemo[index].value as T;
}

function useCallback(callbackFn: WXAHook.IFunction, deps: []): WXAHook.IFunction {
    return useMemo(() => callbackFn, deps);
}

function useInstance(): WXAHook.componentInstance {
    checkInstance();

    return currentComInstance;
}

function useRef<T extends WXAHook.IType>(initialVal: T): { current: T } {
    checkInstance();

    const obj = {
        current: initialVal,
    };

    const instance = currentComInstance;
    const index = callIndex++;

    if (instance._$refs[index] === undefined) {
        instance._$refs[index] = obj;
    }

    return instance._$refs[index];
}

export {
    withHooks, useState, useEffect, useMemo, useCallback, useInstance, checkInstance, useRef,
};
