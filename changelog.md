# 2.0.0

-   Renamed `selection.set` to `selection.attrs`.
-   When using `attrs`, most attribute endpoints can take the form `value` or `{ value, duration, ease, ... }`.
-   When using `attrs`, direct entries can also be functions.

```
canvas.edges([[1, 2], [2, 3]]).attrs({
    color: {
        value: "red",
        animtype: "traverse",
        duration: 1.2,
    },
    labels: ([s, t]) => ({
        0: { text: someData[s][t] },
    })
}
```

-   Merged `CanvasSelection` and `Client` into a single `Canvas` class.
-   Redesigned the event format.
-   Initial attributes can be provided to `element.add`.
-   Changed `edge.traverse(source?).color()` to `edge.traverse(color, source?)`.
-   Added a generic data parameter to all selections, to improve type hints.
-   Renamed `eventQ` to `withQ`.
-   Added a dedicated `QueueSelection`, accessible through `canvas.queue` and `canvas.queues`.
-   Renamed `queue.cancel` to `queue.clear`.
-   Replaced `client.listen`/`client.receive` with `canvas.dispatch`/`canvas.ondispatch`/`canvas.receive`/`canvas.onreceive`.
-   Renamed `canvas.broadcast`/`canvas.listen` to `canvas.message`/`canvas.onmessage`.
-   Removed `canvas.callback`, use explicit messages instead.
-   Split `canvas.edgelengths` into `canvas.edgelayout` and `canvas.edgelength`.
-   Renamed `canvas.zoomkey` to `canvas.zoomtoggle`.
-   Renamed `node.click`/`node.hover` to `node.onclick`/`node.onhoverin`/`node.onhoverout`.
-   All default IDs are now 0 (e.g. node value label, edge weight label, default event queue).
-   Edges with IDs in the form "source-target(-ID)" automatically initialise their source and target.
-   For undirected edges, IDs in the form "source-target(-ID)" will try to match "target-source(-ID)".
-   For directed edges, (source, target) and (target, source) are now different.
