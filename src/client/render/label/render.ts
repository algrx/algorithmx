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

const isAlignTop = (a: Align): boolean => a === 'top-left' || a === 'top-middle' || a === 'top-right'
const isAlignBottom = (a: Align): boolean => a === 'bottom-left' || a === 'bottom-middle' || a === 'bottom-right'

export const renderAlign = (selection: D3Selection, renderData: RenderAttr<ILabelAttr['align']>): void => {
  renderCommon.renderSvgAttr(selection, 'dominant-baseline', v =>
    isAlignTop(v) ? 'hanging' : isAlignBottom(v) ? 'baseline' : 'middle',
    {...renderData, name: renderData.name + '-y' })

  renderCommon.renderSvgAttr(selection, 'text-anchor', v =>
    v === 'top-left' || v === 'middle-left' || v === 'bottom-left' ? 'start'
    : v === 'top-right' || v === 'middle-right' || v === 'bottom-right' ? 'end'
    : 'middle', {...renderData, name: renderData.name + '-x' })
}

export const renderText = (textSel: D3Selection, text: string, align: Align): void => {
  const splitText = text.split('\n')
  textSel.selectAll('tspan').remove()

  splitText.forEach((line, i) => {
    const lineHeight = 1.2
    const initOffset = isAlignTop(align) ? 0
      : isAlignBottom(align) ? (splitText.length - 1) * lineHeight
      : ((splitText.length - 1) / 2) * lineHeight

    textSel.append('tspan').attr('x', 0).attr('dy', i === 0 ? `-${initOffset}em` : `${lineHeight}em`).text(line)
  })
}

export const preprocessAlign = (labelData: RenderAttr<ILabelAttr>): RenderAttr<ILabelAttr['align']> => {
  const align = labelData.attr.align
  const changedRadialAlign = labelData.changes && (labelData.changes.align !== undefined
    || labelData.changes.angle !== undefined || labelData.changes.rotate !== undefined)

  return {...getEntry(labelData, 'align'),
    attr: align === 'radial' ? attrLabel.alignFromAngle(math.angleToRad(labelData.attr.angle), labelData.attr.rotate)
      : align,
    changes: align === 'radial' && changedRadialAlign ? align
      : (labelData.changes ? labelData.changes.align : undefined)
  }
}

export const renderVisible: renderFns.RenderAttrFn<ILabelAttr['visible']> = (selection, renderData) => {
  renderCommon.renderVisible(selection, renderData)
}

export const render: renderFns.RenderAttrFn<ILabelAttr> = (selection, renderData) => {
  const alignData = preprocessAlign(renderData)

  const textSel = renderUtils.selectOrAdd(selection, 'text', s =>
    s.append('text').attr('pointer-events', 'none'))

  const combinedTextAlign = renderProcess.combine({ text: getEntry(renderData, 'text'), align: alignData })
  renderFns.render(textSel, combinedTextAlign, (sel, textData) => {
    renderText(textSel, textData.text, textData.align)
    return sel
  })

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
