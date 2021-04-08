/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-namespace */
// tslint:disable-next-line: no-namespace
declare namespace WXAHook {
    type IType = unknown;
    type IObject = Record<string, unknown>;
    type WrapFunction<T> = (fn: T) => void;
    type IFunction = (...args: any[]) => any;

    type Deps = undefined | any[];
    type EffectDestroy = undefined | IFunction;
    type MemoValue = any | IFunction;
    type WXAComponentInstance = ComponentInstance & HookAttrs;

    type WXAPageInstance = PageInstance & HookAttrs;

    type componentInstance = WXAComponentInstance | WXAPageInstance;

    type componentOptions = Pick<
    ComponentOptions,
    'properties' | 'options' | 'externalClasses'
    >;

    type componentConfig = {
        data?: Data;
        created(this: componentInstance): void;
        attached(this: componentInstance): void;
        detached(this: componentInstance): void;
        relations?: Relations;
        observers?: Record<string, any>;
        [propName: string]: any;
    } & componentOptions;

    interface StoredPageOptions {
        onPullDownRefresh: IFunction[];
        onReachBottom: IFunction[];
        onShareAppMessage: onShareAppMessage[];
        onShareTimeline: onShareTimeline[];
        onAddToFavorites: onAddToFavorites[];
        onPageScroll: onPageScroll[];
        onTabItemTap: onTabItemTap[];
        onLoad: onLoad[];
    }

    interface PageAndComponentOptions {
        show: IFunction[];
        hide: IFunction[];
        resize: IFunction[];
    }

    interface StoredRelation {
        type: string;
        linked: relationFunction[];
        linkChanged: relationFunction[];
        unlinked: relationFunction[];
    }

    interface StoredRelations {
        [propName: string]: StoredRelation;
    }

    interface StoredComponentOptions {
        moved: IFunction[];
    }

    interface UseFn {
        useShow: IFunction;
        useHide: IFunction;
        usePullDownRefresh: IFunction;
        useReachBottom: IFunction;
        useShareAppMessage: WrapFunction<onShareAppMessage>;
        useShareTimeline: WrapFunction<onShareTimeline>;
        useAddToFavorites: WrapFunction<onAddToFavorites>;
        usePageScroll: WrapFunction<onPageScroll>;
        useTabItemTap: WrapFunction<onTabItemTap>;
        useResize: WrapFunction<onResize>;
        useMoved: IFunction;
        useReady: IFunction;
        useLoad: WrapFunction<onLoad>;
    }

    interface State {
        initFn?: IFunction;
        tracks: unknown[];
        value: unknown;
        get: IFunction;
    }

    interface SetStateCb {
        (preValue: unknown): unknown;
    }

    interface Effect {
        destroy?: EffectDestroy;
        cb: IFunction;
        lastDeps: Deps;
        run: IFunction;
    }

    interface Memo {
        value: MemoValue;
        lastDeps: Deps;
    }

    interface ComponentStateAndMethod {
        data?: IObject;
        methods?: Record<string, IFunction>;
    }

    interface HookAttrs {
        _$state?: Record<string, State>;
        _$effect?: Record<string, Effect>;
        _$properties?: string[];
        _$setup?: {
            (): void;
            id: string;
        };
        _$useMemo?: Record<string, Memo>;
        _$storedOptions: StoredPageOptions & StoredComponentOptions;
        _$storagedRelations: StoredRelations;
        _$updateData: {
            (this: WXAHook.componentInstance): Promise<void>;
            id: string;
        };
        _$sourceData: IObject;
        _$dom: Map<componentInstance, Set<componentInstance>>;
        _$getPropsValue: () => Record<string, any>;
        _$id: string;
    }

    interface PreDeclareField {
        relations:
        | Array<[string, Relation['type']]>
        | Record<string, WechatMiniprogram.Component.RelationOption>;
    }

    interface Node {
        id: number | string;
        wxInstance: WXAHook.componentInstance | null;
    }
}
