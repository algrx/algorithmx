import { INodeAttr, Shape } from '../../attributes/definitions/node'
import { RenderAttr } from '../process'
import { D3Selection } from '../utils'
import { getEntry } from '../process'
import * as nodeAttr from '../../attributes/definitions/node'
import * as renderLabel from '../label/render'
import * as renderProcess from '../process'
import * as renderFns from '../render'
import * as renderElement from '../element'
import * as renderUtils from '../utils'

export const selectNodeInner = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.node', s => s.append('g').classed('node', true))

export const selectLabelGroup = (sel: D3Selection): D3Selection =>
  renderUtils.selectOrAdd(sel, '.node-labels', s => s.append('g').classed('node-labels', true))

export const selectLabel = (sel: D3Selection, id: string): D3Selection => {
  const renderId = renderUtils.renderId(id)
  return renderUtils.selectOrAdd(sel, `#label-${renderId}`, s => s.append('g').attr('id', `label-${renderId}`))
}

const renderShape: renderFns.RenderFn<INodeAttr['shape']> = (selection: D3Selection, shape) => {
  selection.select('.shape').remove()
  return selection.insert(shape, ':first-child').classed('shape', true)
}

const renderSize = (selection: D3Selection, sizeData: RenderAttr<INodeAttr['size']>, shape: Shape): void => {
  const width = getEntry(sizeData, 'width')
  const height = getEntry(sizeData, 'height')
  switch (shape) {
    case 'circle':
      renderElement.renderSvgAttr(selection, 'r', v => v, width)
      break
    case 'rect':
      renderElement.renderSvgAttr(selection, 'width', v => v * 2, width)
      renderElement.renderSvgAttr(selection, 'height', v => v * 2, height)
      renderElement.renderSvgAttr(selection, 'x', v => -v, {...width, name: width.name + '-pos' })
      renderElement.renderSvgAttr(selection, 'y', v => -v, {...height, name: height.name + '-pos' })
      break
    case 'ellipse':
      renderElement.renderSvgAttr(selection, 'rx', v => v, width)
      renderElement.renderSvgAttr(selection, 'ry', v => v, height)
      break
  }
}

export const preprocessRenderData = (renderData: RenderAttr<INodeAttr>): RenderAttr<INodeAttr> => {
  const shapeUpdateKeys = nodeAttr.definition.keyOrder.filter(k => k !== 'pos' && k !== 'visible' && k !== 'labels')
  return renderProcess.hasChanged(getEntry(renderData, 'shape'))
    ? renderProcess.markKeysForUpdate(renderData, shapeUpdateKeys) : renderData
}

export const renderVisible: renderFns.RenderAttrFn<INodeAttr['visible']> = (selection, renderData) => {
  renderElement.renderVisible(selection.select('.node'), renderData)
}

export const render: renderFns.RenderAttrFn<INodeAttr> = (selection, renderDataInit) => {
  const renderData = preprocessRenderData(renderDataInit)
  const nodeSel = selectNodeInner(selection)

  renderFns.render(nodeSel, getEntry(renderData, 'shape'), (s, shape) => renderShape(nodeSel, shape))

  const shapeSelection = nodeSel.select('.shape')
  const labelGroup = selectLabelGroup(nodeSel)

  renderElement.renderElementLookup(k => selectLabel(labelGroup, k), getEntry(renderData, 'labels'),
    renderLabel.render, renderLabel.renderVisible)

  renderElement.renderSvgAttr(shapeSelection, 'fill', v => renderUtils.parseColor(v), getEntry(renderData, 'color'))

  renderSize(shapeSelection, getEntry(renderData, 'size'), getEntry(renderData, 'shape').attr)

  if (renderData.attr.shape === 'rect') {
    const cornerData = getEntry(renderData, 'corners')
    renderElement.renderSvgAttr(shapeSelection, 'rx', v => v, {...cornerData, name: cornerData.name + '-x' })
    renderElement.renderSvgAttr(shapeSelection, 'ry', v => v, {...cornerData, name: cornerData.name + '-y' })
  }

  renderElement.renderSvgMixin(shapeSelection, renderData)
}
