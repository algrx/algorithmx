import { ISelContext } from './Selection'
import { EdgeSelection } from './types/edge'
import { Selection } from './types/selection'
import { labelSelection } from './LabelSelection'
import { ClassBuilder } from './utils'
import { IEdgeAttr } from '../client/attributes/definitions/edge'
import * as selection from './Selection'
import * as utils from './utils'

const builder: ClassBuilder<EdgeSelection, ISelContext<IEdgeAttr>> = (context, self, construct) =>
  utils.inherit<EdgeSelection, Selection>({

  label: (id = 'weight') => {
    return self().labels([id])
  },
  labels: (ids) => {
    return labelSelection({...context, parent: context, ids: ids, data: undefined, initAttr: undefined })
  },
  length: length => {
    context.client.dispatch(utils.createUpdateEvent(context, length, d => ({ length: d })))
    return self()
  },
  thickness: thickness => {
    context.client.dispatch(utils.createUpdateEvent(context, thickness, d => ({ thickness: d })))
    return self()
  },
  color: color => {
    context.client.dispatch(utils.createUpdateEvent(context, color, d => ({ color: d })))
    return self()
  },
  flip: flip => {
    context.client.dispatch(utils.createUpdateEvent(context, flip, d => ({ flip: d })))
    return self()
  },
  curve: curve => {
    context.client.dispatch(utils.createUpdateEvent(context, curve, d => ({ curve: d })))
    return self()
  },
  path: path => {
    context.client.dispatch(utils.createUpdateEvent(context, path, d => ({ path: d })))
    return self()
  }
}, selection.builder(context, self, construct))

export const edgeSelection = (args: ISelContext<IEdgeAttr>) => {
  return utils.create(builder, {...args, name: 'edges' })
}
