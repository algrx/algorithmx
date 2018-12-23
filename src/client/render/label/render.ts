import { INodeAttr, Shape } from '../../attributes/definitions/node'
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

const renderPolarPos = (selection: D3SelTrans, [x, y]: [number, number], [radius, angle]: [number, number],
                        [rotate, align]: [boolean, Align]): D3SelTrans => {
  const polarX = radius * Math.cos(angle)
  const polarY = radius * Math.sin(angle)

  const rotation = math.restrictAngle(-angle + ALIGN_ANGLES[align] + Math.PI)
  const rotateStr = rotate ? `rotate(${math.angleToDeg(rotation)})` : ''

  return selection.attr('transform', `translate(${x + polarX},${-(y + polarY)})${rotateStr}`)
}

export const renderAlign = (selection: D3Selection, alignData: RenderAttr<ILabelAttr['align']>): void => {
  renderCommon.renderSvgAttr(selection, 'dominant-baseline', v =>
    v === Align.TopLeft || v === Align.TopCenter || v === Align.TopRight ? 'hanging'
    : v === Align.CenterLeft || v === Align.Center || v === Align.CenterRight ? 'middle'
    : 'baseline', {...alignData, name: alignData.name + '-y' })

  renderCommon.renderSvgAttr(selection, 'text-anchor', v =>
    v === Align.TopLeft || v === Align.CenterLeft || v === Align.BottomLeft ? 'start'
    : v === Align.TopCenter || v === Align.Center || v === Align.BottomCenter ? 'middle'
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

  // renderCommon.renderSvgAttr(textSel, 'x', v => v, getEntry(getEntry(renderData, 'pos'), 'x'))
  // renderCommon.renderSvgAttr(textSel, 'y', v => -v, getEntry(getEntry(renderData, 'pos'), 'y'))
  const align = renderData.attr.align
  const alignData = {...getEntry(renderData, 'align'),
    attr: align === Align.Radial ? attrLabel.alignFromAngle(renderData.attr.angle, renderData.attr.rotate) : align,
    changes: renderData.changes && (renderData.changes.angle !== undefined || renderData.changes.rotate !== undefined)
      ? align : (renderData.changes ? renderData.changes.align : undefined)
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
    return renderPolarPos(sel,
      [posData.x, posData.y],
      [posData.radius, math.angleToRad(posData.angle)],
      [posData.rotate, posData.align])
  })

  renderAlign(textSel, alignData)

  renderCommon.renderCustomSvg(textSel, renderData)
  renderCommon.renderSvgAttr(textSel, 'fill', v => v, getEntry(renderData, 'color'))
  renderCommon.renderSvgAttr(textSel, 'font-family', v => v, getEntry(renderData, 'font'))
  renderCommon.renderSvgAttr(textSel, 'font-size', v => v, getEntry(renderData, 'size'))
}
