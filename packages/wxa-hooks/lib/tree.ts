const nodes: Record<string, WXAHook.Node> = {};

// 组件实例
export function setNode(id: string | number, wxInstance: WXAHook.componentInstance): void {
    nodes[id] = {
        id,
        wxInstance,
    };
}

export function getNode(id: string | number): WXAHook.Node {
    return nodes[id];
}
