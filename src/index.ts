import { canvasSelection } from './server/CanvasSelection'
import { CanvasSelection } from './server/types/canvas'
import { EventHandler } from './server/types/events'
import { Canvas } from './client/types/events'
import * as client from './client/client'

/**
 * Selects the given canvas, providing an interface to its graphics. The returned object will be responsible for storing
 * application state and dispatching/receiving events. The canvas can be any `div` or `svg` element on the HTML page,
 * or an `SVGSVGElement`.
 *
 * @param output - The id attribute of an element on the HTML page to use as the canvas, or an `SVGSVGElement`.
 */
export const canvas = (output: Canvas): CanvasSelection => {
  return canvasSelection(client.createClient(output))
}
