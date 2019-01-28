import { InputNodeAttr } from '../client/attributes/definitions/types'
import { ISelContext } from './Selection'
import { NodeSelection } from './types/node'
import { Selection } from './types/selection'
import { labelSelection } from './LabelSelection'
import { ClassBuilder } from './utils'
import * as selection from './Selection'
import * as utils from './utils'

const builder: ClassBuilder<NodeSelection, ISelContext<InputNodeAttr>> = (context, self, construct) =>
  utils.inherit<NodeSelection, Selection<InputNodeAttr>>({

  label: (id = 'value') => {
    return self().labels([id])
  },
  labels: ids => {
    return labelSelection({...context, parent: context, ids: ids.map(k => String(k)),
      data: null, initattr: undefined })
  },
  shape: shape => {
    context.client.dispatch(utils.attrEvent(context, shape, d => ({ shape: d })))
    return self()
  },
  color: color => {
    context.client.dispatch(utils.attrEvent(context, color, d => ({ color: d })))
    return self()
  },
  size: size => {
    context.client.dispatch(utils.attrEvent(context, size, d => ({ size: d })))
    return self()
  },
  pos: pos => {
    context.client.dispatch(utils.attrEvent(context, pos, d => ({ pos: d })))
    return self()
  },
  fixed: fixed => {
    context.client.dispatch(utils.attrEvent(context, fixed, d => ({ fixed: d })))
    return self()
  },
  draggable: draggable => {
    context.client.dispatch(utils.attrEvent(context, draggable, d => ({ draggable: d })))
    return self()
  },
  click: onClick => {
    context.client.dispatch(utils.attrEvent(context, true, d => ({ click: d })))
    context.ids.forEach((id, i) => {
      selection.addListener(context.listeners, `click-node-${id}`, () => onClick(context.data[i], i))
    })
    return self()
  },
  hoverin: onHoverin => {
    context.client.dispatch(utils.attrEvent(context, true, d => ({ hover: d })))
    context.ids.forEach((id, i) => {
      selection.addListener(context.listeners, `hoverin-node-${id}`, () => onHoverin(context.data[i], i))
    })
    return self()
  },
  hoverout: onHoverout => {
    context.client.dispatch(utils.attrEvent(context, true, d => ({ hover: d })))
    context.ids.forEach((id, i) => {
      selection.addListener(context.listeners, `hoverout-node-${id}`, () => onHoverout(context.data[i], i))
    })
    return self()
  },
  ...(selection.svgMixinAttrBuilder(context, self))

}, selection.builder(context, self, construct))

export const nodeSelection = (args: ISelContext<InputNodeAttr>) => {
  return utils.build(builder, {...args, name: 'nodes' })
}
