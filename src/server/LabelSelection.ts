import { ISelContext } from './Selection'
import { Selection } from './types/selection'
import { LabelSelection } from './types/label'
import { ClassBuilder } from './utils'
import { ILabelAttr } from '../client/attributes/definitions/label'
import * as selection from './Selection'
import * as utils from './utils'

const builder: ClassBuilder<LabelSelection, ISelContext<ILabelAttr>> = (context, self, construct) =>
  utils.inherit<LabelSelection, Selection>({

  text: text => {
    context.client.dispatch(utils.attrEvent(context, text, d => ({ text: d })))
    return self()
  },
  align: align => {
    context.client.dispatch(utils.attrEvent(context, align, d => ({ align: d })))
    return self()
  },
  pos: pos => {
    context.client.dispatch(utils.attrEvent(context, pos, d => ({ pos: d })))
    return self()
  },
  radius: radius => {
    context.client.dispatch(utils.attrEvent(context, radius, d => ({ radius: d })))
    return self()
  },
  angle: angle => {
    context.client.dispatch(utils.attrEvent(context, angle, d => ({ angle: d })))
    return self()
  },
  rotate: rotate => {
    context.client.dispatch(utils.attrEvent(context, rotate, d => ({ rotate: d })))
    return self()
  },
  color: color => {
    context.client.dispatch(utils.attrEvent(context, color, d => ({ color: d })))
    return self()
  },
  font: font => {
    context.client.dispatch(utils.attrEvent(context, font, d => ({ font: d })))
    return self()
  },
  size: size => {
    context.client.dispatch(utils.attrEvent(context, size, d => ({ size: d })))
    return self()
  }
}, selection.builder(context, self, construct))

export const labelSelection = (args: ISelContext<ILabelAttr>) => {
  return utils.build(builder, {...args, name: 'labels' })
}
