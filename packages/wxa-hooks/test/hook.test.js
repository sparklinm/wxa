import {
    withHooks,
    useState,
    useEffect,
    useMemo,
    useInstance,
} from '../lib/hooks';

global.Component = jest.fn();

let useMemoFn1;
let useMemoFn2;
let useMemoFn3;

const useEffectFn = jest.fn();
const useEffectDestroy = jest.fn();

let innerInstance = null;

withHooks(
    () => {
        const [count, setCount] = useState(0);
        const [other, setOther] = useState(0);
        const [effectDep, setEffectDep] = useState(0);

        innerInstance = useInstance(null);

        useEffect(() => {
            useEffectFn();

            return () => {
                useEffectDestroy();
            };
        }, [effectDep]);

        useMemoFn1 = jest.fn(() => {
            return count + 100;
        });
        useMemoFn2 = jest.fn(() => {
            return count + 100;
        });
        useMemoFn3 = jest.fn(() => {
            return count + 100;
        });

        const num1 = useMemo(useMemoFn1);
        const num2 = useMemo(useMemoFn2, [count]);
        const num3 = useMemo(useMemoFn3, []);

        return {
            data: {
                count,
                other,
                effectDep,
                num1,
                num2,
                num3,
            },
            methods: {
                changeCount: (value) => {
                    setCount(count + value);
                },
                changeOther: (value) => {
                    setOther(other + value);
                },
                changeEffectDep: (value) => {
                    setEffectDep(effectDep + value);
                },
            },
        };
    },
    {
        properties: {
            btnText: {
                type: String,
                value: 'Add',
            },
            value: Number,
        },
    },
);

const instance = Component.mock.calls[0][0];
const setData = jest.fn((data, cb) => {
    instance.data = data;
    wx.nextTick(() => {
        cb();
    }, 0);
});

instance.setData = setData;
instance.created();

test('init', (done) => {
    expect(useMemoFn1).toHaveBeenCalledTimes(1);
    expect(useMemoFn2).toHaveBeenCalledTimes(1);
    expect(useMemoFn3).toHaveBeenCalledTimes(1);
    expect(useEffectFn).toHaveBeenCalledTimes(0);

    wx.nextTick(() => {
        expect(setData).toHaveBeenCalledTimes(1);

        wx.nextTick(() => {
            expect(useEffectDestroy).toHaveBeenCalledTimes(0);
            expect(useEffectFn).toHaveBeenCalledTimes(1);

            done();
        });
    });
});

test('useMomo', (done) => {
    wx.nextTick(() => {
        instance.changeCount(1000);
        expect(useMemoFn1).toHaveBeenCalledTimes(1);
        expect(useMemoFn2).toHaveBeenCalledTimes(1);
        expect(useMemoFn3).toHaveBeenCalledTimes(0);

        instance.changeOther(1000);
        expect(useMemoFn1).toHaveBeenCalledTimes(1);
        expect(useMemoFn2).toHaveBeenCalledTimes(0);
        expect(useMemoFn3).toHaveBeenCalledTimes(0);

        wx.nextTick(() => {
            expect(setData).toHaveBeenCalledTimes(2);

            done();
        });
    });
});

test('useEffect', (done) => {
    // 初始化会触发一下
    expect(instance._$effect).not.toBeFalsy();
    expect(useEffectFn).toHaveBeenCalledTimes(1);
    expect(useEffectDestroy).toHaveBeenCalledTimes(0);
    instance.changeEffectDep(1000);
    expect(useEffectFn).toHaveBeenCalledTimes(1);
    expect(useEffectDestroy).toHaveBeenCalledTimes(0);
    setTimeout(() => {
        expect(useEffectDestroy).toHaveBeenCalledTimes(1);
        expect(useEffectFn).toHaveBeenCalledTimes(2);
        instance.changeEffectDep(1000);
        setTimeout(() => {
            expect(useEffectFn).toHaveBeenCalledTimes(3);

            done();
        }, 20);
    }, 20);
});


test('useInstance', () => {
    expect(innerInstance).toBe(instance);
});
