import { InputCanvasAttr } from '../client/attributes/definitions/types'
import { ISelContext, EventHandler } from './Selection'
import { nodeSelection } from './NodeSelection'
import { edgeSelection } from './EdgeSelection'
import { labelSelection } from './LabelSelection'
import { CanvasSelection } from './types/canvas'
import { Selection } from './types/selection'
import { ClassBuilder } from './utils'
import * as events from '../client/types/events'
import * as selection from './Selection'
import * as utils from './utils'

const receiveHandler = (event: events.ReceiveEvent, listeners: selection.SelListeners): void => {
  if (event.type === events.EnumReceiveType.broadcast)
    selection.triggerListener(listeners, event.data.message)

  else if (event.type === events.EnumReceiveType.click)
    selection.triggerListener(listeners, `click-node-${event.data.id}`)

  else if (event.type === events.EnumReceiveType.hover)
    selection.triggerListener(listeners, `${event.data.entered ? 'hoverin' : 'hoverout'}-node-${event.data.id}`)

  else if (event.type === events.EnumReceiveType.error)
    throw Error(event.data.message)
}

const builder: ClassBuilder<CanvasSelection, ISelContext<InputCanvasAttr>> = (context, self, construct) =>
  utils.inherit<CanvasSelection, Selection<InputCanvasAttr>>({

  node: id => {
    return self().nodes([id])
  },
  nodes: ids => {
    return nodeSelection({...context, parent: context, ids: ids, data: ids, initattr: undefined })
  },

  edge: edge => {
    return self().edges([edge])
  },
  edges: edges => {
    const ids = edges.map(([source, target, edgeId]) => {
      const orderedNodes = [source, target].sort()
      return `${orderedNodes[0]}-${orderedNodes[1]}${edgeId !== undefined ? '-' + edgeId : ''}`
    })

    const initAttr = edges.map(([source, target]) =>
      ({ source: String(source), target: String(target) }))

    return edgeSelection({...context, parent: context, ids: ids, data: edges, initattr: initAttr })
  },

  label: (id = 'title') => {
    return self().labels([id])
  },
  labels: ids => {
    return labelSelection({...context, parent: context, ids: ids, data: undefined, initattr: undefined })
  },

  size: size => {
    context.client.dispatch(utils.attrEvent(context, size, d => ({ size: d })))
    return self()
  },
  edgelengths: lengthInfo => {
    context.client.dispatch(utils.attrEvent(context, lengthInfo, d => ({ edgelengths: d })))
    return self()
  },

  pan: location => {
    context.client.dispatch(utils.attrEvent(context, location, d => ({ pan: d })))
    return self()
  },
  zoom: zoom => {
    context.client.dispatch(utils.attrEvent(context, zoom, d => ({ zoom: d })))
    return self()
  },

  panlimit: box => {
    context.client.dispatch(utils.attrEvent(context, box, d => ({ panlimit: d })))
    return self()
  },
  zoomlimit: limit => {
    context.client.dispatch(utils.attrEvent(context, limit, d => ({ zoomlimit: d })))
    return self()
  },

  zoomkey: required => {
    context.client.dispatch(utils.attrEvent(context, required, d => ({ zoomkey: d })))
    return self()
  },
  ...(selection.svgMixinAttrBuilder(context, self))

}, selection.builder(context, self, construct))

export const canvasSelection = (canvas: events.Canvas, handler: EventHandler) => {
  const context: ISelContext<InputCanvasAttr> = {
    ...selection.defaultContext,
    client: handler,
    name: 'canvas',
    ids: [String(canvas)],
    data: [canvas]
  }
  handler.subscribe(event => receiveHandler(event, context.listeners))
  return utils.build(builder, context)
}
