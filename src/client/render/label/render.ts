import { ILabelAttr, Align, ALIGN_ANGLES } from '../../attributes/definitions/label'
import { RenderAttr } from '../process'
import { D3Selection, D3SelTrans } from '../utils'
import { getEntry } from '../process'
import * as attrLabel from '../../attributes/definitions/label'
import * as renderProcess from '../process'
import * as renderFns from '../render'
import * as renderCommon from '../common'
import * as renderUtils from '../utils'
import * as math from '../../math'

interface LabelPosData {
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly angle: number
  readonly rotate: boolean
  readonly align: Align
}
const renderPos = (selection: D3SelTrans, posData: LabelPosData): D3SelTrans => {
  const polarX = posData.radius * Math.cos(posData.angle)
  const polarY = posData.radius * Math.sin(posData.angle)

  const rotation = math.restrictAngle(-posData.angle + ALIGN_ANGLES[posData.align] + Math.PI)
  const rotateStr = posData.rotate ? `rotate(${math.angleToDeg(rotation)})` : ''

  return selection.attr('transform', `translate(${posData.x + polarX},${-(posData.y + polarY)})${rotateStr}`)
}

export const renderAlign = (selection: D3Selection, alignData: RenderAttr<ILabelAttr['align']>): void => {
  renderCommon.renderSvgAttr(selection, 'dominant-baseline', v =>
    v === 'top-left' || v === 'top-middle' || v === 'top-right' ? 'hanging'
    : v === 'middle-left' || v === 'middle' || v === 'middle-right' ? 'middle'
    : 'baseline', {...alignData, name: alignData.name + '-y' })

  renderCommon.renderSvgAttr(selection, 'text-anchor', v =>
    v === 'top-left' || v === 'middle-left' || v === 'bottom-left' ? 'start'
    : v === 'top-middle' || v === 'middle' || v === 'bottom-middle' ? 'middle'
    : 'end', {...alignData, name: alignData.name + '-x' })
}

export const renderVisible: renderFns.RenderAttrFn<ILabelAttr['visible']> = (selection, renderData) => {
  renderCommon.renderVisible(selection, renderData)
}

export const render: renderFns.RenderAttrFn<ILabelAttr> = (selection, renderData) => {
  const textSel = renderUtils.selectOrAdd(selection, 'text', s =>
    s.append('text').attr('pointer-events', 'none'))

  renderFns.onChanged(textSel, getEntry(renderData, 'text'), (sel, textData) => {
    sel.selectAll('tspan').remove()
    sel.append('tspan').text(textData.attr)
  })

  const align = renderData.attr.align
  const changedRadialAlign = renderData.changes && (renderData.changes.align !== undefined
    || renderData.changes.angle !== undefined || renderData.changes.rotate !== undefined)

  const alignData = {...getEntry(renderData, 'align'),
    attr: align === 'radial' ? attrLabel.alignFromAngle(math.angleToRad(renderData.attr.angle), renderData.attr.rotate)
      : align,
    changes: align === 'radial' && changedRadialAlign ? align
      : (renderData.changes ? renderData.changes.align : undefined)
  }

  const combinedPos = renderProcess.combine({
    x: getEntry(getEntry(renderData, 'pos'), 'x'),
    y: getEntry(getEntry(renderData, 'pos'), 'y'),
    radius: getEntry(renderData, 'radius'),
    angle: getEntry(renderData, 'angle'),
    rotate: getEntry(renderData, 'rotate'),
    align: alignData
  })
  renderFns.render(textSel, combinedPos, (sel, posData) => {
    return renderPos(sel, {...posData,
      angle: math.angleToRad(posData.angle)
    })
  })

  renderAlign(textSel, alignData)

  renderCommon.renderCustomSvg(textSel, renderData)
  renderCommon.renderSvgAttr(textSel, 'fill', v => renderUtils.parseColor(v), getEntry(renderData, 'color'))
  renderCommon.renderSvgAttr(textSel, 'font-family', v => v, getEntry(renderData, 'font'))
  renderCommon.renderSvgAttr(textSel, 'font-size', v => v, getEntry(renderData, 'size'))
}
