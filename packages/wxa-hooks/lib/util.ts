export function firstUpperLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isObj(e: any): boolean {
    return '[object Object]' === toString.call(e);
}

// eslint-disable-next-line max-len
export function depsChanged(deps: WXAHook.Deps, lastDeps: WXAHook.Deps): boolean {
    if (!deps || !lastDeps) {
        return true;
    }

    for (let i = 0, len = deps.length; i < len; i++) {
        if (!Object.is(lastDeps[i], deps[i])) {
            // 依赖发生变化
            return true;
        }
    }

    return false;
}
