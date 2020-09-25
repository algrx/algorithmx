import { InputAttr } from '../client/attributes/derived-attr';
import { EdgeSpec, EdgeCurve } from '../client/attributes/components/edge';

import { ElementSelection, ElementContext, evalElementArg, applyAttrs } from './ElementSelection';
import { ElementId, ElementArg, NumAttr } from './types';
import { LabelSelection } from './LabelSelection';

export type EdgeId = [ElementId, ElementId, ElementId?];

export type InputEdgeAttrs = InputAttr<EdgeSpec>;

type EdgeContext<D> = ElementContext<D> & {
    readonly tuples?: ReadonlyArray<EdgeId>;
};

/**
 * A selection of edges.
 */
export class EdgeSelection<D> extends ElementSelection<InputEdgeAttrs, D> {
    _selection: EdgeContext<D>;

    constructor(context: EdgeContext<D>) {
        super(context);
        this._selection = context;
    }
    /**
     * Selects a single edge label by its ID. Use "*" to select all existing labels.
     *
     * @param id - A label IDs.
     *
     * @return A new selection corresponding to the given label, with the same data as the current
     * selection.
     */
    label(id: ElementId): LabelSelection<ElementId> {
        return this.labels([id]);
    }

    /**
     * Selects multiple edge labels using a list of ID values. If no list is provided, all existing
     * labels will be selected.
     *
     * @param ids - A list of label IDs.
     *
     * @return A new selection corresponding to the given labels, with the same data as the current
     * selection.
     */
    labels(ids?: ReadonlyArray<ElementId>): LabelSelection<ElementId> {
        return new LabelSelection({
            ...this._selection,
            ids: (ids ?? ['*']).map((id) => String(id)),
            data: undefined, // use the node (parent) data
            parent: ['edges', this],
        });
    }

    /**
     * Sets whether or not the edge should include an arrow pointing towards its target node.
     *
     * @param directed - True if the edge should be directed, false otherwise.
     */
    directed(directed: ElementArg<boolean, D>) {
        return this.attrs({ directed });
    }

    /**
     * Sets the length of the edge. This will only take effect when [[CanvasSelection.edgelengths]]
     * is set to "individual".
     *
     * @param length - The length of the edge.
     */
    length(length: ElementArg<NumAttr, D>) {
        return this.attrs({ length });
    }

    /**
     * Sets the thickness of the edge.
     *
     * @param thickness - The thickness of the edge, in pixels.
     */
    thickness(thickness: ElementArg<NumAttr, D>) {
        return this.attrs({ thickness });
    }

    /**
     * Sets the color of the edge. The default color is "light-gray".
     *
     * @param color - A CSS color string.
     */
    color(color: ElementArg<string, D>) {
        return this.attrs({ color });
    }

    /**
     * Sets the color of the edge using a traversal animation.
     *
     * If no source is provided, the first element in each edge tuple will be used.
     *
     * @param value - A CSS color string.
     * @param source - The ID of the node from which the traversal animation should originate.
     */
    traverse(value: ElementArg<string, D>, source?: ElementArg<ElementId, D>) {
        applyAttrs<InputEdgeAttrs, D>(this._selection, (data, dataIndex, i) => {
            const animsource = source
                ? evalElementArg(source, data, dataIndex)
                : this._selection.tuples
                ? this._selection.tuples[i][0]
                : undefined;

            return {
                color: {
                    animtype: 'traverse',
                    value: evalElementArg(value, data, dataIndex),
                    ...(animsource ? { animsource } : {}),
                },
            };
        });
        return this;
    }

    /**
     * Sets whether or not the edge should be 'flipped' after exceeding a certain angle, such that
     * it is never rendered upside-down. This does not apply to looping edges.
     *
     * @param flip - True if the edge should flip automatically, false otherwise.
     */
    flip(flip: ElementArg<boolean, D>) {
        return this.attrs({ flip });
    }

    /**
     * Sets the curve function used to interpolate the edge's path. The default setting is
     * "cardinal". More information is available here: [[https://github.com/d3/d3-shape#curves]].
     *
     * @param curve - The name of the curve function, based on the functions found in D3. The full
     * list is below:
     *
     * "basis", "bundle", "cardinal", "catmull-rom", "linear", "monotone-x", "monotone-y",
     * "natural", "step", "step-before", "step-after"
     */
    curve(curve: ElementArg<EdgeCurve, D>) {
        return this.attrs({ curve });
    }

    /**
     * Sets a custom path for the edge. The path is a list of (x, y) tuples, which will
     * automatically connect to the boundaries of the source and target nodes.
     *
     * If the edge connects two nodes, (0, 0) will be the midpoint between the two nodes. If edge is
     * a loop, (0, 0) will be a point on the node's boundary.
     *
     * @param path - A list of (x, y) tuples.
     */
    path(path: ElementArg<ReadonlyArray<[NumAttr, NumAttr]>, D>) {
        return this.attrs({ path });
    }

    /**
     * Sets custom SVG attributes on the edge's `path` element.
     *
     * @param svgattrs - A dictionary of SVG attributes, where each attribute is a string.
     */
    svgattrs(svgattrs: ElementArg<{ readonly [k: string]: string }, D>) {
        return this.attrs({ svgattrs });
    }

    data<ND>(data: ReadonlyArray<ND>): EdgeSelection<ND> {
        return super.data(data) as EdgeSelection<ND>;
    }
}
