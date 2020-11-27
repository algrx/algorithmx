import { InputAttr } from '../client/attributes/derived';
import { EdgeSpec, EdgeCurve } from '../client/attributes/components/edge';

import { ElementSelection } from './ElementSelection';
import { LabelSelection } from './LabelSelection';
import { AnyId, ElementArg, NumAttr, ElementFn } from './types';
import {
    ElementContext,
    evalElementValue,
    applyAttrs,
    ElementObjArg,
    evalElementDict,
} from './utils';

export type EdgeId = [AnyId, AnyId, AnyId?];

export type EdgeAttrs = InputAttr<EdgeSpec>;

type EdgeContext<D> = ElementContext<D> & {
    readonly edges?: ReadonlyArray<EdgeId>;
};

/**
 * A selection of edges.
 */
export class EdgeSelection<D> extends ElementSelection<EdgeAttrs, D> {
    _selection: EdgeContext<D>;

    constructor(context: EdgeContext<D>) {
        super(context);
        this._selection = context;
    }

    add(attrs?: ElementObjArg<EdgeAttrs, D>) {
        applyAttrs(this._selection, (data, dataIndex, elementIndex) => {
            const attrObj = attrs ? evalElementDict(attrs, data, dataIndex) : {};
            return this._selection.edges
                ? {
                      source: String(this._selection.edges[elementIndex][0]),
                      target: String(this._selection.edges[elementIndex][1]),
                      ...attrObj,
                  }
                : attrObj;
        });
        return this.duration(0);
    }

    /**
     * Selects a single edge label by its ID. Use "*" to select all existing labels.
     *
     * @param id - A label ID. Defaults to 0.
     *
     * @return A new selection corresponding to the given label, with the same data as the current
     * selection.
     */
    label(id: AnyId = 0): LabelSelection<D> {
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
    labels(ids: ReadonlyArray<AnyId> = ['*']): LabelSelection<D> {
        return new LabelSelection({
            ...this._selection,
            ids: ids.map((id) => String(id)),
            data: undefined, // use the edge (parent) data
            parent: this._selection,
            parentkey: 'labels',
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
     * Sets the length of the edge. This will only take effect when [[CanvasSelection.edgelayout]]
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
     * @param color - A CSS color string.
     * @param source - The ID of the node from which the traversal animation should originate.
     */
    traverse(color: ElementArg<string, D>, source?: ElementArg<AnyId, D>) {
        applyAttrs<EdgeAttrs, D>(this._selection, (data, dataIndex, i) => {
            const animsource = source
                ? String(evalElementValue(source, data, dataIndex))
                : this._selection.edges
                ? String(this._selection.edges[i][0])
                : undefined;

            return {
                color: {
                    animtype: 'traverse',
                    value: evalElementValue(color, data, dataIndex),
                    ...(animsource !== undefined ? { animsource } : {}),
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
     * Sets the curve function used to interpolate the edge's path.
     *
     * The default setting is "cardinal". More information is available here:
     * [[https://github.com/d3/d3-shape#curves]].
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
     * If the edge connects two nodes, (0,0) will be the midpoint between the two nodes. If edge is
     * a loop, (0,0) will be a point on the node's boundary.
     *
     * @param path - A list of (x, y) tuples.
     */
    path(path: ElementArg<ReadonlyArray<[NumAttr, NumAttr]>, D>) {
        return this.attrs({ path });
    }

    data<ND>(data: ReadonlyArray<ND> | ElementFn<ND, D>): EdgeSelection<ND> {
        return super.data(data) as EdgeSelection<ND>;
    }
}
