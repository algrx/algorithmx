import { InputAttr } from '../client/attributes/derived-attr';
import { CanvasSpec, EdgeLengthType } from '../client/attributes/components/canvas';
import { CanvasElement, ReceiveEvent, DispatchEvent } from '../client/types';
import { Client as InternalClient } from '../client/client';

import { CallbackHandler, ClientCallbacks, execCallbacks } from './callbacks';
import { ElementSelection } from './ElementSelection';
import { NodeSelection } from './NodeSelection';
import { EdgeSelection, EdgeId } from './EdgeSelection';
import { LabelSelection } from './LabelSelection';
import { ElementId, NumAttr } from './types';

export type CanvasAttrs = InputAttr<CanvasSpec>;

/**
 * An object responsible for rendering the network, storing application state, and
 * dispatching/receiving events.
 */
export class Canvas extends ElementSelection<CanvasAttrs, null> implements CallbackHandler {
    readonly _client: InternalClient;
    _callbacks: ClientCallbacks;

    constructor(canvas: CanvasElement) {
        super({ ids: ['canvas'] });
        this._client = new InternalClient(canvas);
        this._callbacks = {
            messages: {},
            nodes: {},
        };
        this._client.onevent(this.receive);
    }

    attrs(attrs: CanvasAttrs) {
        this.dispatch({
            attrs: attrs,
            withQ: this._selection.withQ,
        });
        return this;
    }

    pause(duration: number) {
        //this.queue().pause(duration);
        return this;
    }

    /**
     * Selects a single node by its ID. Use "*" to select all existing nodes.
     *
     * @param id - A single node ID.
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
    nodes<ID extends ElementId>(ids?: ReadonlyArray<ID>): NodeSelection<ID> {
        return new NodeSelection({
            ...this._selection,
            ids: (ids ?? ['*' as ID]).map((id) => String(id)),
            data: ids ?? ['*' as ID],
            parent: ['canvas', this],
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
     * - New edges with IDs in the form "source-target(-ID)" will automatically initialise their
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
    edges<ID extends EdgeId>(ids: ReadonlyArray<ID>): EdgeSelection<ID> {
        return new EdgeSelection({
            ...this._selection,
            ids:
                ids === undefined
                    ? ['*']
                    : ids.map((id) => {
                          return id[0] + '-' + id[1] + (id.length > 2 ? '-' + id[2] : '');
                      }),
            data: ids ?? ['*'],
            tuples: ids,
            parent: ['canvas', this],
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
    labels<ID extends ElementId = '*'>(ids?: ReadonlyArray<ID>): LabelSelection<ID> {
        return new LabelSelection({
            ...this._selection,
            ids: (ids ?? ['*' as ID]).map((id) => String(id)),
            data: ids ?? ['*' as ID],
            parent: ['canvas', this],
        });
    }

    /**
     * Sets the width and height of the canvas.
     *
     * This will determine the coordinate system, and will update the `width` and `height`
     * attributes of the main SVG element, unless otherwise specified with [[Canvas.svgattrs]]. Size
     * is not animated by default.
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
     * @param type - The edge length calculation strategy:
     * - "individual": Uses each edge's `length` attribute individually.
     * - "jaccard" (default), "symmetric": Dynamic calculation based on canvas's `edgelength`
     *   attribute.
     */
    edgelengthtype(type: EdgeLengthType) {
        return this.attrs({ edgelengthtype: type });
    }

    /**
     * Sets the average length of all edges. This only applies if [[Canvas.edgelengthtype]] is not
     * "individual". The default averate edge length is 70.
     *
     * @param edgelength - The average edge length.
     */
    edgelength(edgelength: NumAttr) {
        return this.attrs({ edgelength });
    }

    /**
     * Sets the location of the canvas camera. The canvas uses a Cartesian coordinate system with
     * (0, 0) at the center.
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
     * Restricts the movement of the canvas camera to the given bounding box, centered at (0, 0).
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
     * @param value - True if the `ctrl`/`cmd` key is required, false otherwise.
     */
    zoomkey(zoomkey: boolean) {
        return this.attrs({ zoomkey });
    }

    /**
     * Sets custom SVG attributes on the canvas's `svg` element.
     *
     * @param svgattrs - A dictionary of SVG attributes, where each attribute is a string.
     */
    svgattrs(svgattrs: { readonly [k: string]: string }) {
        return this.attrs({ svgattrs });
    }

    /**
     * Sends an event to the client, in the form:
     * - attrs: An attribute dictionary, see [[ElementAttrs]].
     * - defaultattr: A partial `{ duration, ease, highlight, linger }` dictionary which will apply
     *   to all provided attributes, see [[ElementAttrs]].
     * - message: A message, as sent by [[Canvas.message]].
     * - withQ: The event queue to which the event will be added, see [[ElementSelection.withQ]].
     * - queues:
     *     - (id):
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
        if (this._callbacks.ondispatch) this._callbacks.ondispatch(event);

        this._client.event(event);
        return this;
    }

    /**
     * Registers a callback function to listen events before they are sent to the client, see
     * [[Canvas.dispatch]].
     *
     * @param fn - The callback function, which receives a partial event object.
     */
    ondispatch(fn: (event: DispatchEvent) => void) {
        this._callbacks = {
            ...this._callbacks,
            ondispatch: fn,
        };
        return this;
    }

    /**
     * Simulates an event being received from the client, see [[Canvas.onreceive]].
     *
     * @param event - A partial event object.
     */
    receive(event: ReceiveEvent) {
        execCallbacks(this._callbacks, event);
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
     * @param fn - The callback function, which receives a partial event object.
     */
    onreceive(fn: (event: ReceiveEvent) => void) {
        this._callbacks = {
            ...this._callbacks,
            onreceive: fn,
        };
    }

    /**
     * Adds a message to the current event queue. Together with [[Canvas.onmessage]], this can be
     * used to detect when a queue reaches a certain point in execution.
     *
     * @param message - The message string.
     */
    message(message: string) {
        this._client.event({ message: message });
        return this;
    }

    onmessage(message: '*', fn: (message: string) => void): this;
    onmessage(message: string, fn: () => void): this;

    /**
     * Registers a callback function for messages sent by [[Canvas.message]]. Use "*" to listen for
     * all message.
     *
     * @param message - The message to listen for, or "*" to listen for all messages.
     * @param fn - The callback function, which takes the message as an argument.
     */
    onmessage(message: string | '*', fn: (message: string) => void) {
        this._callbacks = {
            ...this._callbacks,
            messages: { ...this._callbacks.messages, [message]: fn as () => void },
        };
        return this;
    }
}
