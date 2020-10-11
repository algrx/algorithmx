import { InputAttr } from '../client/attributes/derived';
import { NodeSpec, NodeShape } from '../client/attributes/components/node';
import { VisibleAnimType } from '../client/attributes/components/element';

import { LabelSelection } from './LabelSelection';
import { ElementSelection } from './ElementSelection';
import { addElementCallback } from './utils';
import { ElementArg, ElementId, ElementFn, NumAttr } from './types';

export type NodeAttrs = InputAttr<NodeSpec>;

/**
 * A selection of nodes.
 */
export class NodeSelection<D> extends ElementSelection<NodeAttrs, D> {
    /**
     * Removes all selected nodes nodes, and any edges connected to the nodes.
     */
    remove(animtype?: ElementArg<VisibleAnimType, D>) {
        return super.remove(animtype);
    }

    /**
     * Selects a single node label by its ID. The node's default 'value label' has ID 0. Use "*" to
     * select all existing labels.
     *
     * @param id - A label ID. Defaults to 0.
     *
     * @return A new selection corresponding to the given label, with the same data as the current
     * selection.
     */
    label(id: ElementId = 0): LabelSelection<D> {
        return this.labels([id]);
    }

    /**
     * Selects multiple node labels using a list of ID values. If no list is provided, all existing
     * labels will be selected.
     *
     * @param ids - A list of label IDs.
     *
     * @return A new selection corresponding to the given labels, with the same data as the current
     * selection.
     */
    labels(ids: ReadonlyArray<ElementId> = ['*']): LabelSelection<D> {
        return new LabelSelection({
            ...this._selection,
            ids: ids.map((id) => String(id)),
            data: undefined, // use the node (parent) data
            parentkey: 'labels',
            parent: this._selection,
        });
    }

    /**
     * Sets the shape of the node.
     *
     * @param shape - One of the following strings:
     * - "circle" (default): Circular node with a single radius dimension.
     * - "rect": Rectangular node with separate width and height dimensions, and corner rounding.
     * - "ellipse": Elliptical node with separate width and height dimensions.
     */
    shape(shape: ElementArg<NodeShape, D>) {
        return this.attrs({ shape });
    }

    /**
     * Sets the color of the node. The default color is "dark-gray".
     *
     * @param color - A CSS color string.
     */
    color(color: ElementArg<string, D>) {
        return this.attrs({ color });
    }

    /**
     * Sets the size of the node using a (width/2, height/2) tuple.
     *
     * If a single value is provided, it will be used for both dimensions. If the node is a circle,
     * width/2 is the radius and height is ignored.
     *
     * Note that size can be set relative to the node's current size using string expressions, e.g.
     * "1.5x" for circles or ("1.5x", "1.5y") for rectangles.
     *
     * The default size is (12, 12).
     *
     * @param size - A single radius, or a (width/2, height/2) tuple.
     */
    size(size: ElementArg<NumAttr | [NumAttr, NumAttr], D>) {
        return this.attrs({ size });
    }

    /**
     * Sets the position of the node. The canvas uses a Cartesian coordinate system with (0,0) at
     * the center.
     *
     * @param pos - An (x, y) tuple describing the new position of the node.
     */
    pos(pos: ElementArg<[NumAttr, NumAttr], D>) {
        return this.attrs({ pos });
    }

    /**
     * When set to true, this prevents the node from being automatically moved during the layout
     * process. This does not affect manual dragging.
     *
     * @param fixed - True if the position of the node should be fixed, false otherwise.
     */
    fixed(fixed: ElementArg<boolean, D>) {
        return this.attrs({ fixed });
    }

    /**
     * Sets whether the node can be manually dragged around.
     *
     * @param draggable - True if the node should be draggable, false otherwise.
     */
    draggable(draggable: ElementArg<boolean, D>) {
        return this.attrs({ draggable });
    }

    /**
     * Registers a callback function to listen for node click events.
     *
     * This will override any previous callback.
     *
     * @param fn - A callback function taking the node's data and, optionally, index.
     */
    onclick(fn: ElementFn<void, D>) {
        addElementCallback(this._selection, 'click', fn);
        return this.attrs({ listenclick: true });
    }

    /**
     * Registers a callback function to listen for node mouse-over events, triggered when the mouse
     * enters the node.
     *
     * This will override any previous callback.
     *
     * @param fn - A callback function taking the node's data and, optionally, index.
     */
    onhoverin(fn: ElementFn<void, D>) {
        addElementCallback(this._selection, 'hoverin', fn);
        return this.attrs({ listenhover: true });
    }

    /**
     * Registers a callback function to listen for node mouse-over events, triggered when the mouse
     * leaves the node.
     *
     * This will override any previous callback.
     *
     * @param fn - A callback function taking the node's data and, optionally, index.
     */
    onhoverout(fn: ElementFn<void, D>) {
        addElementCallback(this._selection, 'hoverout', fn);
        return this.attrs({ listenhover: true });
    }

    data<ND>(data: ReadonlyArray<ND>): NodeSelection<ND> {
        return super.data(data) as NodeSelection<ND>;
    }
}
