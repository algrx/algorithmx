import { InputAttr } from '../client/attributes/derived';
import { CanvasSpec, EdgeLayout } from '../client/attributes/components/canvas';
import { CanvasElement, ReceiveEvent, DispatchEvent } from '../client/types';

import { ElementSelection } from './ElementSelection';
import { NodeSelection } from './NodeSelection';
import { EdgeSelection, EdgeId } from './EdgeSelection';
import { LabelSelection } from './LabelSelection';
import { QueueSelection } from './QueueSelection';
import { ElementContext, ElementObjArg, ElementCallbacks, evalElementObjArg } from './utils';
import { ElementId, NumAttr } from './types';

export type CanvasAttrs = InputAttr<CanvasSpec>;

interface Client {
    readonly dispatch: (event: DispatchEvent) => void;
    readonly onreceive: (fn: (event: ReceiveEvent) => void) => void;
}

/**
 * An object responsible for rendering the network, storing application state, and
 * dispatching/receiving events.
 */
export class Canvas extends ElementSelection<CanvasAttrs, null> {
    constructor(context: Partial<ElementContext<null> & { readonly client: Client }>) {
        super({
            ids: ['canvas'],
            data: [null],
            callbacks: {},
            ...context,
        });

        if (context.client) {
            this._selection.callbacks.dispatch = context.client.dispatch.bind(context.client);
            context.client.onreceive(this.receive.bind(this));
        }
    }

    /**
     * Selects a node by its ID. Use "*" to select all existing nodes.
     *
     * @param id - A node ID.
     *
     * @return A new selection corresponding to the given node.
     */
    node<ID extends ElementId>(id: ID): NodeSelection<ID> {
        return this.nodes([id]);
    }

    /**
     * Selects multiple nodes using an list of ID values. If no list is provided, all existing nodes
     * will be selected.
     *
     * @param ids - A list of node IDs.
     *
     * @return A new selection corresponding to the given nodes.
     */
    nodes<ID extends ElementId = '*'>(ids: ReadonlyArray<ID> = ['*' as ID]): NodeSelection<ID> {
        return new NodeSelection({
            ...this._selection,
            ids: ids.map((id) => String(id)),
            data: ids,
            parentkey: 'nodes',
            parent: this._selection,
        });
    }

    /**
     * Selects a single edge using a (source, target, optional ID) tuple.
     *
     * The optional ID is used to distinguish multi-edges. The full string ID of the edge will take
     * the form "source-target(-ID)". If the edge has `directed` set to false, 'source' and 'target'
     * can be provided in any order, as long as they do not contain the "-" character.
     *
     * When accessing edges using string IDs, e.g. through [[Canvas.attrs]], the following rules
     * apply:
     * - New edges with IDs in the form "source-target(-ID)" will automatically initialize their
     * `source`/`target` attributes.
     * - For edges with `directed` set to false, "target-source(-ID)" will fall back to
     * "source-target(-ID)".
     *
     * @param tuple - A (source, target) or (source, target, ID) tuple.
     *
     * @return A new selection corresponding to the given edge.
     */
    edge<ID extends EdgeId>(id: ID): EdgeSelection<ID> {
        return this.edges([id]);
    }

    /**
     * Selects multiple edges using a list of (source, target, optional ID) tuples, see
     * [[Canvas.edge]].
     *
     * If no list is provided, all existing edges will be selected.
     *
     * @param ids - A list of (source, target) or (source, target, ID) tuples.
     *
     * @return A new selection corresponding to the given edges.
     */
    edges<ID extends EdgeId>(ids?: ReadonlyArray<ID>): EdgeSelection<ID> {
        return new EdgeSelection({
            ...this._selection,
            ids:
                ids === undefined
                    ? ['*']
                    : ids.map((id) => {
                          return id[0] + '-' + id[1] + (id.length > 2 ? '-' + id[2] : '');
                      }),
            data: ids ?? [['*', '*'] as ID],
            tuples: ids,
            parentkey: 'edges',
            parent: this._selection,
        });
    }

    /**
     * Selects a single canvas label by its ID. Use "*" to select all existing labels.
     *
     * @param id - A label ID.
     *
     * @return A new selection corresponding to the given label.
     */
    label<ID extends ElementId>(id: ID): LabelSelection<ID> {
        return this.labels([id]);
    }

    /**
     * Selects multiple canvas labels using a list of ID values. If no list is provided, all
     * existing labels will be selected.
     *
     * @param ids - A list of label IDs.
     *
     * @return A new selection corresponding to the given labels.
     */
    labels<ID extends ElementId = '*'>(ids: ReadonlyArray<ID> = ['*' as ID]): LabelSelection<ID> {
        return new LabelSelection({
            ...this._selection,
            ids: ids.map((id) => String(id)),
            data: ids,
            parentkey: 'labels',
            parent: this._selection,
        });
    }

    /**
     * Sets the width and height of the canvas.
     *
     * This will determine the coordinate system, and will update the `width` and `height`
     * attributes of the main SVG element, unless otherwise specified with
     * [[ElementSelection.svgattr]]. Size is not animated by default.
     *
     * @param value - A (width, height) tuple.
     */
    size(size: [NumAttr, NumAttr]) {
        return this.attrs({ size });
    }

    /**
     * Sets strategy used to calculate edge lengths. Edges can either specify individual length
     * values (see [[EdgeSelection.length]]), or have their lengths dynamically calculated with the
     * given strategy, and with an average of [[Canvas.edgelength]].
     *
     * More information is available at [[https://github.com/tgdwyer/WebCola/wiki/link-lengths]].
     *
     * @param edgelayout - The edge length calculation strategy:
     * - "individual": Uses each edge's `length` attribute individually.
     * - "jaccard" (default): Dynamic calculation based on [[Canvas.edgelength]].
     * - "symmetric": Dynamic calculation based on [[Canvas.edgelength]].
     */
    edgelayout(edgelayout: EdgeLayout) {
        return this.attrs({ edgelayout });
    }

    /**
     * Sets the average length of all edges. This only applies if [[Canvas.edgelayout]] is not
     * "individual". The default average edge length is 70.
     *
     * @param edgelength - The average edge length.
     */
    edgelength(edgelength: NumAttr) {
        return this.attrs({ edgelength });
    }

    /**
     * Sets the location of the canvas camera. The canvas uses a Cartesian coordinate system with
     * (0,0) at the center.
     *
     * @param pan - An (x, y) tuple describing the new pan location.
     */
    pan(pan: [NumAttr, NumAttr]) {
        return this.attrs({ pan });
    }

    /**
     * Sets the zoom level of the canvas camera. A zoom level of 2.0 will make objects appear twice
     * as large, 0.5 will make them half as large, etc.
     *
     * @param zoom - The new zoom level.
     */
    zoom(zoom: NumAttr) {
        return this.attrs({ zoom });
    }

    /**
     * Restricts the movement of the canvas camera to the given bounding box, centered at (0,0).
     *
     * The default pan limit is (-Infinity, Infinity).
     *
     * @param panlimit - A (width/2, height/2) tuple describing the bounding box.
     */
    panlimit(panlimit: [NumAttr, NumAttr]) {
        return this.attrs({ panlimit });
    }

    /**
     * Restricts the zoom level of the canvas camera to the given range. The lower bound describes
     * how far out the camera can zoom, while the upper bound describes the maximum enlarging zoom.
     *
     * The default zoom limit is (0.1, 10).
     *
     * @param zoomlimit - A (min, max) tuple describing the zoom limit.
     */
    zoomlimit(zoomlimit: [NumAttr, NumAttr]) {
        return this.attrs({ zoomlimit });
    }

    /**
     * Sets whether or not zooming requires the `ctrl`/`cmd` key to be held down. Disabled by
     * default.
     *
     * @param zoomtoggle - True if the `ctrl`/`cmd` key is required, false otherwise.
     */
    zoomtoggle(zoomtoggle: boolean) {
        return this.attrs({ zoomtoggle });
    }

    /**
     * Selects a single event queue by its ID. The default queue has ID 0. Use "*" to select all
     * existing queues.
     *
     * By default, any changes made to the queue (e.g. start/stop) will take place immediately.
     * However, if [[ElementSelection.withQ]] was previously called, the changes themselves will be
     * added as events onto the current event queue.
     *
     * @param id - A queue ID. Defaults to 0.
     *
     * @return A new selection corresponding to the given queue.
     */
    queue(id: string | number = 0): QueueSelection {
        return this.queues([id]);
    }

    /**
     * Selects multiple event queues using an list of ID values, see [[Canvas.queue]].
     *
     * If no list is provided, all existing queues will be selected.
     *
     * @param ids - A list of queue IDs.
     *
     * @return A new selection corresponding to the given queues.
     */
    queues(ids: ReadonlyArray<string | number> = ['*']): QueueSelection {
        return new QueueSelection({
            ids: ids.map((id) => String(id)),
            callbacks: this._selection.callbacks,
            withQ: this._selection.withQ ?? null,
        });
    }

    /**
     * Adds a message to the current event queue. Together with [[Canvas.onmessage]], this can be
     * used to detect when a queue reaches a certain point in execution.
     *
     * @param message - A message string.
     */
    message(message: string) {
        return this.dispatch({
            message: message,
            ...(this._selection.withQ !== undefined ? { withQ: this._selection.withQ } : {}),
        });
    }

    onmessage(message: '*', fn: (message: string) => void): this;
    onmessage(message: string, fn: () => void): this;

    /**
     * Registers a callback function for messages sent by [[Canvas.message]]. Use "*" to listen for
     * all messages.
     *
     * @param message - The message to listen for, or "*" to listen for all messages.
     * @param fn - A callback function. When using "*", the exact message will be provided as an
     * argument.
     */
    onmessage(message: string | '*', fn: (message: string) => void) {
        if (message === '*') {
            this._selection.callbacks.message = fn;
        } else {
            this._selection.callbacks.messages = {
                ...this._selection.callbacks.messages,
                [message]: fn as () => void,
            };
        }
        return this;
    }

    /**
     * Sends an event to the client, in the form:
     * - attrs: An attribute dictionary, see [[ElementSelection.attrs]].
     * - animation: A partial animation dictionary which will apply to all provided attributes, see
     * [[ElementSelection.attrs]].
     * - message: A message, as sent by [[Canvas.message]].
     * - withQ: The event queue to which the event will be added, see [[ElementSelection.withQ]].
     * - queues:
     *     - [id]:
     *         - stop: True if the queue should be stopped, see [[QueueSelection.stop]].
     *         - start: True if the queue should be started, see [[QueueSelection.start]].
     *         - clear: True if all events should be cleared from the queue, see
     *         [[QueueSelection.clear]].
     *         - pause: The number of seconds the queue should be paused for, see
     *         [[QueueSelection.pause]].
     *
     * @param event - A partial event object.
     */
    dispatch(event: DispatchEvent) {
        if (this._selection.callbacks.dispatch) this._selection.callbacks.dispatch(event);

        return this;
    }

    /**
     * Registers a callback function to listen for all dispatched events, see [[Canvas.dispatch]].
     *
     * This will override the default event handler.
     *
     * @param fn - A callback function which receives a partial event object.
     */
    ondispatch(fn: (event: DispatchEvent) => void) {
        this._selection.callbacks.dispatch = fn;
        return this;
    }

    /**
     * Simulates an event being received from the client, see [[Canvas.onreceive]].
     *
     * @param event - A partial event object.
     */
    receive(event: ReceiveEvent) {
        const cbs = this._selection.callbacks;

        // event callback
        if (cbs.receive) cbs.receive(event);

        // error callbacks
        if (event.error) {
            console.error(`${event.error.type} error: ${event.error.message}`);
        }

        // message callbacks
        if (event.message !== undefined && cbs.messages) {
            if (cbs.message) cbs.message(event.message);
            if (event.message in cbs.messages) cbs.messages[event.message]();
        }

        // click/hover callbacks
        (<const>['nodes']).forEach((elementType) => {
            if (!(elementType in event)) return;

            Object.entries(event[elementType]!).forEach(([k, elementEvents]) => {
                Object.keys(elementEvents).forEach((eventType) => {
                    const elementCbDict = cbs[elementType] ?? {};
                    if (k in elementCbDict && eventType in elementCbDict[k])
                        elementCbDict[k][eventType as keyof ElementCallbacks]!();
                });
            });
        });

        return this;
    }

    /**
     * Registers a callback function for all events sent back by the client, in the form:
     * - error:
     *    - type: "attribute" (invalid attributes), "unknown".
     *    - message: The error message.
     * - message: A message, as sent by [[Canvas.message]].
     * - nodes:
     *     - [id]:
     *         - click: True if the node was clicked.
     *         - hoverin: True if the mouse hovered over the node.
     *         - hoverout: True if the mouse exited the node.
     *
     * @param fn - A callback function which receives a partial event object.
     */
    onreceive(fn: (event: ReceiveEvent) => void) {
        this._selection.callbacks.receive = fn;
    }
}
