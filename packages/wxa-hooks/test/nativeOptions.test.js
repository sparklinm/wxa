import {
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
    useRelations,
} from '../lib/nativeOptions';

import {withHooks} from '../lib/hooks';

global.Component = jest.fn();

withHooks(
    () => {
        useShow(() => {
            console.log('show');
        });

        useHide(() => {
            console.log('show');
        });

        useShareAppMessage(() => {
            console.log('useShareAppMessage');
        });

        useShareTimeline(() => {
            console.log('useShareTimeline');
        });

        useAddToFavorites(() => {
            console.log('useAddToFavorites');
        });

        useReachBottom(() => {
            console.log('useReachBottom');
        });

        useReachBottom(() => {
            console.log('useReachBottom');
        });

        usePageScroll(() => {
            console.log('usePageScroll');
        });

        usePullDownRefresh(() => {});

        useTabItemTap(() => {});

        useResize(() => {});

        useMoved(() => {});

        useRelations({
            './custom-li': {
                type: 'child',
                linked: function(target) {},
                linkChanged: function(target) {},
                unlinked: function(target) {},
            },
        });

        useRelations({
            './custom-li': {
                type: 'child',
                linked: function(target) {},
                linkChanged: function(target) {},
                unlinked: function(target) {},
            },
        });

        useRelations({
            './ul': {
                type: 'parent',
                linked: function(target) {},
                linkChanged: function(target) {},
                unlinked: function(target) {},
            },
        });

        return {
            data: {},
            methods: {},
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
        relations: [['./custom-li', 'child'], ['./ul', 'parent']],
    },
);

const instance = Component.mock.calls[0][0];
instance.created();

test('native options', () => {
    for (const [key, value] of Object.entries(instance._$storedOptions)) {
        if (key === 'onReachBottom') {
            expect(value.length).toBe(2);
        } else {
            expect(value.length).toBe(1);
        }
    }

    for (const [key, value] of Object.entries(
        instance._$storagedRelations['./custom-li'],
    )) {
        if (key === 'type') {
            expect(value).toBe('child');
        } else {
            expect(value.length).toBe(2);
        }
    }

    for (const [key, value] of Object.entries(
        instance._$storagedRelations['./ul'],
    )) {
        if (key === 'type') {
            expect(value).toBe('parent');
        } else {
            expect(value.length).toBe(1);
        }
    }

    const options ={
        onShow: expect.any(Function),
        onHide: expect.any(Function),
        onPullDownRefresh: expect.any(Function),
        onReachBottom: expect.any(Function),
        onShareAppMessage: expect.any(Function),
        onShareTimeline: expect.any(Function),
        onAddToFavorites: expect.any(Function),
        onPageScroll: expect.any(Function),
        onTabItemTap: expect.any(Function),
        onResize: expect.any(Function),
    };

    const relations ={
        './custom-li': {
            type: 'child',
            linked: expect.any(Function),
            linkChanged: expect.any(Function),
            unlinked: expect.any(Function),
        },
        './ul': {
            type: 'parent',
            linked: expect.any(Function),
            linkChanged: expect.any(Function),
            unlinked: expect.any(Function),
        },
    };

    expect(instance).toMatchObject(options);
    expect(instance.relations).toMatchObject(relations);
});
