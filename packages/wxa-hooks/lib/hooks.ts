// tslint:disable: no-unused-expression no-console
import {wxa, diff} from '@wxa/core';
import {
    clearStoredOptions,
    clearStoragedRelations,
    storedPageOptions,
    storedComponentOptions,
    storedOptions,
    storagedRelations,
} from './nativeOptions';
import {isObj, depsChanged} from './util';

let currentComInstance: WXAHook.componentInstance = null;
let callIndex = 0;

const checkInstance = () => {
    // tslint:disable-next-line: curly
    if (!currentComInstance) throw new Error('Component instance not found');
};

// Component的选项只能在创建前添加
function setOptionBefore(config: WXAHook.componentConfig, preDeclareField: WXAHook.PreDeclareField) {
    for (const key of Object.keys(storedComponentOptions)) {
        const originFn = config[key];
        config[key] = function(params) {
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

const runEffect = (effect) => {
    console.log('runEffect', typeof effect.destroy === 'function');
    // 总是清除上一次的 effecct
    if (typeof effect.destroy === 'function') {
        effect.destroy();
        effect.destroy = null;
    }
    // 接着调用下一次的 effect;
    if (effect.run) effect.destroy = effect.run.call(null);
    effect.run = null;
    // if (typeof effect.destroy === 'function') {
    //     effect.destroy();
    //     effect.destroy = null;
    // }

    // if (effect.run) {
    //     effect.run.forEach((task) => {
    //         if (effect.destroy) effect.destroy();

    //         effect.destroy = task.call(null);
    //     });
    //     effect.run = null;
    // }
};

const log = (...args) => {
    console.log('[WXA hooks]', ...args);
};

function withHooks(
    setup: (props?: WXAHook.IObject) => WXAHook.ComponentStateAndMethod,
    options: WXAHook.componentOptions,
): WXAHook.IObject {
    // tslint:disable-next-line: no-empty
    setup = typeof setup === 'function' ? setup : () => ({});
    console.time('[with Hook] before' + setup.name);
    let cansetOptionAfter = true;

    const config: WXAHook.componentConfig = {
        ...options,
        created() {
            this._$state = {};
            this._$effect = {};
            this._$useMemo = {};
            this._$refs = {};
            this._$updated = false;
            this._$isUpdating = false;
            this._$dom = new Map();
            this._$properties = Object.keys(config.properties);

            // 初始渲染，即第一次执行_$setup
            this._$firstRender = true;
            this._$isSetting = false;

            this._$setup = () => {
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
                this._$deferUpdateData(data);

                this._$firstRender = false;

                // console.timeEnd('setup');
            };

            this._$deferSetup = () => {
                if (this._$isSetting) {
                    return;
                }
                this._$isSetting = true;
                wx.nextTick(() => {
                    this._$setup();
                    this._$isSetting = false;
                });
            };

            this._$getPropsValue = () => {
                const props = {};
                this._$properties.forEach((element) => {
                    props[element] = this.data[element];
                });
                return props;
            };

            console.log('created setup');
        },
        attached() {
            this._$setup();
            const parent = this.selectOwnerComponent() as WXAHook.componentInstance;
            if (!parent) {
                return;
            }

            let children: Set<any> = this._$dom.get(parent);
            if (!children) {
                this._$dom.set(parent, (children = new Set()));
            }
            children.add(this);
        },
        ready() {
            this._$consumeEffect();
        },
        detached() {
            Object.keys(this._$effect).forEach((key) => {
                const effect = this._$effect[key];
                const destroy = effect.destroy;

                // tslint:disable-next-line: curly
                if (typeof destroy === 'function') destroy.call(null);
            });
            this._$state = null;
            this._$effect = null;
            this._$setup = null;
            this._$useMemo = null;
            this._$dom = null;
            this._$storagedRelations = null;
            this._$storedOptions = null;
        },
        _$deferUpdateData(sourceData: WXAHook.IObject) {
            this._$deferData = sourceData;
            if (!this._$isUpdating && isObj(sourceData)) {
                this._$isUpdating = true;
                // wx.nextTick(() => {
                const diffedData = diff.bind(this)(this._$deferData);

                if (Object.keys(diffedData || {}).length === 0) {
                    this._$isUpdating = false;
                    return;
                }

                this.setData(diffedData, () => {
                    console.log('update');
                    this._$isUpdating = false;
                    this._$consumeEffect();

                    this._$deferUpdateData(this._$deferData);
                });
                // });
            }
        },
        _$consumeEffect() {
            currentComInstance = this;
            Object.keys(this._$effect).forEach((index) => {
                const effect = this._$effect[index];
                if (effect.run) {
                    runEffect(effect);
                }
            });
            currentComInstance = null;
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
            if (this._$firstRender) {
                return;
            }

            log('observer change', Object.keys(config.properties).join(','));
            this._$setup();
        };
    }

    setOptionBefore(config, {
    // TODOS: 兼容原生写法
        relations: config.relations,
    });
    console.timeEnd('[with Hook] before' + setup.name);
    console.log('config', config);

    return wxa.launchComponent(config);
}

function useState<T extends WXAHook.IType>(initialState: T): [T, WXAHook.IFunction] {
    checkInstance();

    const index = callIndex++;
    const instance = currentComInstance;

    // initialState;
    if (instance._$state[index] === undefined) {
        instance._$state[index] = initialState;
    }

    // tslint:disable-next-line: only-arrow-functions
    const setState = function(value: WXAHook.IType) {
        if (Object.is(value, instance._$state[index])) {
            return;
        }
        instance._$state[index] = value;
        instance._$deferSetup();
    };

    return [instance._$state[index] as T, setState];
}

function useEffect(effectFn: () => WXAHook.EffectDestroy, deps: WXAHook.Deps): void {
    checkInstance();

    const index = callIndex++;
    const instance = currentComInstance;

    let effect = instance._$effect[index];

    if (effect === undefined) {
        instance._$effect[index] = {
            lastDeps: null,
            run: null,
        };

        effect = instance._$effect[index];
    }

    // if (depsChanged(deps, effect.lastDeps)) {
    //     effect.run = effect.run || [];
    //     log('effect stack', effect.run.length);
    //     effect.run.push(effectFn);
    // }

    effect.run = depsChanged(deps, effect.lastDeps) ? effectFn : effect.run;
    effect.lastDeps = deps === undefined ? undefined : [...deps];
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


function useRef<T extends WXAHook.IType>(initialVal: T): {current: T} {
    checkInstance();

    let obj = {
        current: initialVal
    }

    const instance = currentComInstance;
    const index = callIndex++;

    if (instance._$refs[index] === undefined) {
        instance._$refs[index] = obj
    }

    return instance._$refs[index]
}


export {
    withHooks, useState, useEffect, useMemo, useCallback, useInstance, checkInstance, useRef
};
