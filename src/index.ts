import { Client } from './client/client';
import { CanvasElement, DispatchEvent, ReceiveEvent } from './client/types';

import { Canvas, CanvasAttrs } from './api/Canvas';
import { EdgeSelection, EdgeAttrs } from './api/EdgeSelection';
import { NodeSelection, NodeAttrs } from './api/NodeSelection';
import { LabelSelection, LabelAttrs } from './api/LabelSelection';

/**
 * Creates a new [[Canvas]]. The canvas can be rendered in any HTML element on the page (preferably
 * a `div`), or in an `Element` object.
 *
 * @param output - The HTML `id` attribute of an existing element on the page, or an `Element` object.
 *
 * @return A new [[Canvas]].
 */
export const createCanvas = (output: CanvasElement): Canvas => {
    const client = new Client(output);
    const canvas = new Canvas({ client: client });
    return canvas;
};

export {
    CanvasElement,
    DispatchEvent,
    ReceiveEvent,
    Canvas,
    NodeSelection,
    EdgeSelection,
    LabelSelection,
    CanvasAttrs,
    NodeAttrs,
    EdgeAttrs,
    LabelAttrs,
};
