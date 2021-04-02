# @wxa/hooks

提供一套 react hooks 思想的方案应用到小程序。

## hooks API

## withHooks

注册页面：

```js
withHooks(
    // properties 参数会传递过来
    ({ num }) => {
        let [count, setCount] = useState(0);

        useEffect(() => {
            console.log('counter changed');

            return () => {
                console.log('counter clean up');
            };
        }, [count]);

        return {
            data: {
                count,
                num
            },
            methods: {
                bindtap: ({
                    currentTarget: {
                        dataset: { value }
                    }
                }) => {
                    setCount(count + +value);
                }
            }
        };
    },
    {
        properties: {
            num: {
                type: Number,
                value: 0
            }
        },
        options: {
            addGlobalClass: true
        }，
        externalClasses: []
    }
);
```

第一个参数，我们称为 `setup` 函数，第一次的 `setup` 函数会在**组件 attached 时执行**。后续每次 `setState` 改变状态，都会执行 `setup` 函数。

## useState

返回一个 `state`，以及更新 `state` 的函数。

```js
const [state, setState] = useState(0);


// 惰性初始 state
// 传入一个函数，只在初始渲染时运行，获取初始值
const [state, setState] = useState(() => {
    return 1;
});


// setState
setState(10)
// 函数式更新
setCount(prevCount => prevCount + 1)}
```

`setState` 时会使用 Object.is 比较算法来比较新旧 `state`，相同就不更新。

## useEffect

副作用 `Hook`。

```js
useEffect(() => {
    const subscription = props.source.subscribe();
    return () => {
        // 清除函数
        subscription.unsubscribe();
    };
});
```

执行时机：

1. 第一次渲染完毕
2. 每次渲染更新完毕
3. 组件卸载时，会执行清除函数

### 与 React 的不同

由于小程序双线程（`js` 线程、渲染线程）独立的特性，每次渲染更新完毕的时机并不确定，这取决于当次更新的数据量，如果这一次更新的数据量很大，则 `useEffect` 会在延迟比较久的时间后执行。

例如，在 `react` 中可以在 `useEffect` 中设置定时器更新页面数据：

```js
let [count, setCount] = useState(0);

useEffect(() => {
    // 每秒递增1
    let timer = setTimeout(() => {
        setCount(count + 1);
    }, 1000);

    return () => {
        clearTimeout(timer);
    };
}, [count]);
```

但在小程序中，像这样使用就要注意，一次 `useEffect` 改变的数据越大，那下一次 `useEffect` 的执行就会越晚：

```js
count 更新间隔时间 = 上一次 useEffect 导致的渲染时间 + 定时器时间
```

另外，熟悉 `react` 的同学会在 `useEffect` 中进行数据请求：

```js
useEffect(async () => {
    // 数据请求
    let res = await getSongList();
}, []);
```

但在小程序中，并不建议在这里进行数据请求，第一次 `useEffect` 的执行时机是第一次渲染完毕，大概等于在 `onReady` 中执行。在 `onReady` 中执行请求，有点过于晚。

## useMemo

返回一个缓存值，把 **计算函数** 和 **依赖项数组** 作为参数传入 `useMemo`，它仅会在某个依赖项改变时才重新执行 **计算函数**。这种优化有助于避免在每次渲染时都进行高开销的计算。

```js
// 只有 a 或 b 变化时才会执行 computeExpensiveValue 函数
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## useCallback

`useMemo` 的语法糖，用于缓存函数，`useCallback(fn, deps)` 相当于 `useMemo(() => fn, deps)`。

```js
let doSomething = () => {
    // more
};

// memoizedCallback = doSomething
// 只有在 a 或 b 变化时，才会重新生成 memoizedCallback 函数
const memoizedCallback = useCallback(doSomething, [a, b]);
```

## useRef

和 `react` 的 `useRef` 不同的是，这里**不能用于获取子组件实例**。但可以用于缓存值，每次页面渲染时（`setup` 执行），能直接获取到缓存的值。例如：

```js
const [count, setCount] = useState(0);
const prevCountRef = useRef();

useEffect(() => {
    // 本次的count
    console.log(count);
    // 上次的count
    console.log(prevCountRef.current);
});

function handleClick() {
    prevCountRef.current = count;
    setCount(count + 1);
}
```

## useInstance

获取当前组件实例。

```js
const instance = useInstance();
```

> 注意不要使用实例的 `setData`。

## 小程序特有 API

1. `useLoad`
2. `useShow`
3. `useHide`
4. `usePullDownRefresh`
5. `useReachBottom`
6. `useShareAppMessage`
7. `useShareTimeline`
8. `useAddToFavorites`
9. `usePageScroll`
10. `useTabItemTap`
11. `useResize`
12. `useMoved`
13. `useRelations`
14. `useEvent`

示例：

```js
withHooks(
    ({}) => {
        // 页面选项
        useLoad((options) => {});
        useShow((options) => {});
        useHide(() => {});
        usePullDownRefresh(() => {});
        useReachBottom(() => {});
        useShareAppMessage((obj) => {});
        useShareTimeline((obj) => {});
        useAddToFavorites((obj) => {});
        usePageScroll((obj) => {});
        useTabItemTap((obj) => {});
        useResize((obj) => {});

        // 自定义组件选项
        useShow((options) => {});
        useHide(() => {});
        useResize((obj) => {});
        useMoved(() => {});
        useRelations({
            './custom-li': {
                type: 'child', // 关联的目标节点应为子节点
                linked: function (target) {
                    // 每次有custom-li被插入时执行，target是该节点实例对象，触发在该节点attached生命周期之后
                },
                linkChanged: function (target) {
                    // 每次有custom-li被移动后执行，target是该节点实例对象，触发在该节点moved生命周期之后
                },
                unlinked: function (target) {
                    // 每次有custom-li被移除时执行，target是该节点实例对象，触发在该节点detached生命周期之后
                }
            }
        });

        // 分发事件，和 triggerEvent 相同
        emitCustomEvent = useEvent('customEvent');
        emitCustomEvent({ customData });
    },
    {
        options: {
            addGlobalClass: true
        },

        // 对于 relations 一定要在这里指明节点和type
        relations: [['./custom-li', 'child']]
    }
);
```

## 渲染

正常来说，每个 `setState` 都应该触发一次渲染：

```js
withHooks(() => {
    let [name, setName] = useState('');
    let [age, setAge] = useState(0);
    let [sex, setSex] = useState('未知');

    useShow(() => {
        setName('小明');
        setAge(20);
        setSex('男');
    });

    return {
        data: {
            name,
            age,
            sex
        }
    };
});
```

这样就会触发 `3` 次渲染：包括 `setup` 函数和小程序 `setData` 执行 `3` 次。

为了性能，**同步代码中的状态改变会被合并（暂定）**，所以这里只会执行 `1` 次 `setup` 和 `setData`。

同时由于小程序中渲染线程和 `js` 线程是分开的，在渲染时很可能会有新的状态改变而产生新的渲染，为了不丢失这些渲染，这些渲染将会被依次放入一个任务队列。渲染的过程就是从这个队列不断取出渲染任务，直到队列末尾。

## 其他注意

正常来说，`Hook` 组件可以和原生自定义组件可以互相嵌套。

当原生自定义组件作为 `Hook` 组件的子组件时，需要注意以下一点：如果原生自定义组件使用 `observers` 观察 `Hook` 组件传递过来的 `properties` 时，当自定义组件定义的 `properties` 默认值不为空，那 `observers` 会直接触发一次，且传递过来的值为空：

```html
<!-- hook 组件 -->
<script>
withHooks(() => {
    let [name, setName] = useState('小明');

    return {
        data: {
            name,
        }
    };
});
</script>

<config>
{
    "usingComponents":{
      "custom-component": "./components/custom-component",
    }
}
</config>


<template>
    <custom-component name="{{name}}">
</template>
```

```html
<!-- 原生自定义组件 custom-component-->
<script>
    export default class {
        properties = {
            name: {
                type: String,
                value: '未知姓名'
            }
        };

        observers = {
            name: function (value) {
                console.log(value);
                // 第一次 value 为空字符串 ''
            }
        };
    }
</script>

<config> { "component": true } </config>
```

这是因为 `observers` 的触发时间是在 `attached` 之前，也就是在 `hooks` 组件 `setup` 第一次执行之前，那自然传递过来的值为空，和 `value: 未知姓名`比较，观察到变化，`observers` 回调执行。

## 使用

-   `npm run build` dist 目录有相关接口定义。
-   `yarn link` 在需要使用项目中再次运行 `yarn link "@wxa/hooks"` 即可使用。

## todo
