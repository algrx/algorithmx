import { canvasSelection } from './server/CanvasSelection'
import { CanvasSelection } from './server/types/canvas'
import { Canvas } from './client/types/events'
import * as client from './client/client'

/**
 * Selects a canvas to use for rendering the network. The returned object will be responsible for storing application
 * state and providing an interface to the network's graphics. The canvas can be any element on the HTML page
 * (preferably a `div`), or an `Element` object.
 *
 * @param output - The `id` attribute of an element on the HTML page to use as the canvas, or an `Element` object.
 */
export const canvas = (output: Canvas): CanvasSelection => {
  return canvasSelection(client.createClient(output))
}
