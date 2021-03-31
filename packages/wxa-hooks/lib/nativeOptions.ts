import {firstUpperLetter} from './util';

const storedPageOptions: WXAHook.StoredPageOptions = {
    onLoad: [],
    onPullDownRefresh: [],
    onReachBottom: [],
    onShareAppMessage: [],
    onShareTimeline: [],
    onAddToFavorites: [],
    onPageScroll: [],
    onTabItemTap: [],
};

// 放入pageLifetimes中
const storedBothOptions: WXAHook.PageAndComponentOptions = {
    show: [],
    hide: [],
    resize: [],
};

const storedComponentOptions: WXAHook.StoredComponentOptions = {
    moved: [],
};

let storedOptions = {
    ...storedPageOptions,
    ...storedComponentOptions,
    ...storedBothOptions,
};

let storagedRelations: WXAHook.StoredRelations = {};

function useConstructor(): WXAHook.UseFn {
    const useFn: Partial<WXAHook.UseFn> = {};

    for (const key of Object.keys(storedOptions)) {
        let fnName = '';
        if (key.startsWith('on')) {
            fnName = key.replace('on', 'use');
        } else {
            fnName = 'use' + firstUpperLetter(key);
        }
        useFn[fnName] = function(cb) {
            if (typeof cb === 'function') {
                if (
                    (key === 'onShareAppMessage' ||
                        key === 'onShareTimeline') &&
                    storedOptions[key].length >= 1
                ) {
                    throw new Error(`${key} only need one`);
                }
                storedOptions[key].push(cb);
            }
        };
    }

    return useFn as WXAHook.UseFn;
}

function clearStoredOptions(): void {
    for (const key of Object.keys(storedPageOptions)) {
        storedPageOptions[key] = [];
    }
    for (const key of Object.keys(storedComponentOptions)) {
        storedComponentOptions[key] = [];
    }
    for (const key of Object.keys(storedBothOptions)) {
        storedBothOptions[key] = [];
    }

    storedOptions = {
        ...storedPageOptions,
        ...storedComponentOptions,
        ...storedBothOptions,
    };
}

function useRelations(relations: Relations): void {
    for (const key of Object.keys(relations)) {
        const linked = relations[key].linked;
        const linkChanged = relations[key].linkChanged;
        const unlinked = relations[key].unlinked;

        if (
            !storagedRelations[key] ||
            storagedRelations[key].type !== relations[key].type
        ) {
            storagedRelations[key] = {
                type: relations[key].type,
                linked: [],
                linkChanged: [],
                unlinked: [],
            };
        }

        linked && storagedRelations[key].linked.push(linked);
        linkChanged && storagedRelations[key].linkChanged.push(linkChanged);
        unlinked && storagedRelations[key].unlinked.push(unlinked);
    }
}

function clearStoragedRelations(): void {
    storagedRelations = {};
}

const {
    useLoad,
    useShow,
    useHide,
    usePullDownRefresh,
    useReachBottom,
    useShareAppMessage,
    useShareTimeline,
    useAddToFavorites,
    usePageScroll,
    useTabItemTap,
    useResize,
    useMoved,
} = useConstructor();

export {
    storedOptions,
    storedPageOptions,
    storedComponentOptions,
    storedBothOptions,
    clearStoredOptions,
    useLoad,
    useShow,
    useHide,
    usePullDownRefresh,
    useReachBottom,
    useShareAppMessage,
    useShareTimeline,
    useAddToFavorites,
    usePageScroll,
    useTabItemTap,
    useResize,
    useMoved,
};

export {
    storagedRelations, useRelations, clearStoragedRelations,
};
