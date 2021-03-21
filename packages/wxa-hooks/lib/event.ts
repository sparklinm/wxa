import {checkInstance, useInstance} from './hooks';

export function useEvent(name: string): WXAHook.IFunction {
    checkInstance();

    const instance = useInstance();

    return (value) => {
        instance.triggerEvent(name, value);
    };
}
