import {useInstance} from './hooks';

export function useEvent(name: string): WXAHook.IFunction {
    const instance = useInstance();

    return (value) => {
        instance.triggerEvent(name, value);
    };
}
