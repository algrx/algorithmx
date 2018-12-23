import { ReceiveEvent, DispatchEvent } from '../../client/types/events'

export interface EventHandler {
  /**
   * Dispatches an event.
   *
   * @param event The event.
   */
  dispatch (event: DispatchEvent): this

  /**
   * Register a function to listen for events sent back by the client.
   * The event will be a dictionary in one of the following formats:
   *
   * **Error**
   *
   * Executed when an error occurs on the client, typically due to invalid input.
   *  - `type`: "error"
   *  - `data`:
   *    - `type`: (string) One of the following:
   *      - "attribute": When the client is provided with invalid attributes.
   *    - `message`: (string) The error message.
   *
   * * **Broadcast**
   *
   * Executed when a broadcast message is received.
   *  - `type`: "broadcast"
   *  - `data`:
   *    - `message`: (string) The message that was broadcast.
   *
   * * **Click**
   *
   * Executed when the user clicks on a node.
   *  - `type`: 'click'
   *  - `data`:
   *    - `id`: (string) The ID of the clicked node.
   *
   * * **Hover**
   *
   * Executed when the user hovers over a node.
   *  - `type`: 'hover'
   *  - `data`:
   *    - `id`: (string) The ID of the hovered node.
   *    - `entered`: (boolean) True if the mouse entered the node, false if it exited.
   *
   * @param listener - The listener function, taking the received event as an argument.
   */
  receive (listener: (event: ReceiveEvent) => void): this
}
