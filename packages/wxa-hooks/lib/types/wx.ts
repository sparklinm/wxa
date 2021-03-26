type onShareAppMessage = WechatMiniprogram.Page.ILifetime['onShareAppMessage'];

type onPageScroll = WechatMiniprogram.Page.ILifetime['onPageScroll'];

type onTabItemTap = WechatMiniprogram.Page.ILifetime['onTabItemTap'];

type onAddToFavorites = WechatMiniprogram.Page.ILifetime['onAddToFavorites'];

type onShareTimeline = WechatMiniprogram.Page.ILifetime['onShareTimeline'];

type onLoad = WechatMiniprogram.Page.ILifetime['onLoad'];

type onResize = WechatMiniprogram.Page.ILifetime['onResize'];

type relationFunction = WechatMiniprogram.Component.RelationOption['linked'];

type Relation = WechatMiniprogram.Component.RelationOption;

type Relations = WechatMiniprogram.Component.OtherOption['relations'];

type Data = WechatMiniprogram.Component.DataOption;
type Properties = WechatMiniprogram.Component.PropertyOption;
type Method = Partial<WechatMiniprogram.Component.MethodOption>;

type ComponentInstance = WechatMiniprogram.Component.Instance<Data, Properties, Method>;
type ComponentOptions = WechatMiniprogram.Component.Options<
Data,
Properties,
Method
>;

type PageInstance = WechatMiniprogram.Page.Instance<Data, Record<string, unknown>>;
