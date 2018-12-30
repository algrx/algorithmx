import { ISelContext } from './Selection'
import { NodeSelection } from './types/node'
import { Selection } from './types/selection'
import { labelSelection } from './LabelSelection'
import { ClassBuilder } from './utils'
import { INodeAttr } from '../client/attributes/definitions/node'
import { InputAttr } from '../client/attributes/types'
import * as selection from './Selection'
import * as utils from './utils'

const builder: ClassBuilder<NodeSelection, ISelContext<INodeAttr>> = (context, self, construct) =>
  utils.inherit<NodeSelection, Selection>({

  label: (id = 'value') => {
    return self().labels([id])
  },
  labels: (ids = ['*'] as ReadonlyArray<string>) => {
    return labelSelection({...context, parent: context, ids: ids, data: undefined, initAttr: undefined })
  },
  shape: shape => {
    context.client.dispatch(utils.createUpdateEvent(context, shape, d => ({ shape: d })))
    return self()
  },
  corners: radius => {
    context.client.dispatch(utils.createUpdateEvent(context, radius, d => ({ corners: d })))
    return self()
  },
  color: color => {
    context.client.dispatch(utils.createUpdateEvent(context, color, d => ({ color: d })))
    return self()
  },
  size: size => {
    context.client.dispatch(utils.createUpdateEvent(context, size, d =>
      ({ size: d }) as InputAttr<INodeAttr>))
    return self()
  },
  pos: pos => {
    context.client.dispatch(utils.createUpdateEvent(context, pos, d => ({ pos: d })))
    return self()
  },
  fixed: fixed => {
    context.client.dispatch(utils.createUpdateEvent(context, fixed, d => ({ fixed: d })))
    return self()
  },
  draggable: draggable => {
    context.client.dispatch(utils.createUpdateEvent(context, draggable, d => ({ draggable: d })))
    return self()
  },
  click: onClick => {
    context.client.dispatch(utils.createUpdateEvent(context, true, d => ({ click: d })))
    context.ids.forEach((id, i) => {
      const elementData = utils.getElementData(context, i)
      selection.addListener(context.listeners, `click-node-${id}`, () => onClick(elementData, i))
    })
    return self()
  },
  hoverIn: onHoverIn => {
    context.client.dispatch(utils.createUpdateEvent(context, true, d => ({ hover: d })))
    context.ids.forEach((id, i) => {
      const elementData = utils.getElementData(context, i)
      selection.addListener(context.listeners, `hoverin-node-${id}`, () => onHoverIn(elementData, i))
    })
    return self()
  },
  hoverOut: onHoverOut => {
    context.client.dispatch(utils.createUpdateEvent(context, true, d => ({ hover: d })))
    context.ids.forEach((id, i) => {
      const elementData = utils.getElementData(context, i)
      selection.addListener(context.listeners, `hoverout-node-${id}`, () => onHoverOut(elementData, i))
    })
    return self()
  }
}, selection.builder(context, self, construct))

export const nodeSelection = (args: ISelContext<INodeAttr>) => {
  return utils.create(builder, {...args, name: 'nodes' })
}
