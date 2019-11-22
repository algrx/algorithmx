import { Layout } from '../../layout/layout'
import { NodeLayout } from '../../layout/node'
import { D3Selection } from '../utils'
import * as renderUtils from '../utils'
import * as renderCanvasUtils from '../canvas/utils'
import * as webcola from 'webcola'
import * as d3 from '../d3.modules'

/* tslint:disable */
let _dragging = false
let _mouseover = false
/* tslint:enable */

export const enableHover = (canvasSel: D3Selection, selection: D3Selection,
                            onHover: (entered: boolean) => void): void => {
  selection.on('mouseover', () => {
    _mouseover = true
    if (!_dragging) {
      canvasSel.style('cursor', 'pointer')
      onHover(true)
    }
  })
  selection.on('mouseout', () => {
    _mouseover = false
    if (!_dragging) {
      canvasSel.style('cursor', null)
      onHover(false)
    }
  })
}

export const enableDrag = (canvasSel: D3Selection, nodeSel: D3Selection,
                           colaLayout: Layout, nodeLayout: NodeLayout): void => {
  nodeSel.call(d3.drag().subject(() => {
    const origin = webcola.Layout.dragOrigin(nodeLayout)
    return {...origin, y: -origin.y }
  }).on('start', () => {
    _dragging = true
    canvasSel.style('cursor', 'pointer')
    webcola.Layout.dragStart(nodeLayout)
  }).on('drag', () => {
    webcola.Layout.drag(nodeLayout, { x: d3.event.x, y: -d3.event.y })
    colaLayout.resume()
  }).on('end', () => {
    _dragging = false
    if (!_mouseover) canvasSel.style('cursor', null)
    webcola.Layout.dragEnd(nodeLayout)
  }))
}

export const disableDrag = (selection: D3Selection): void => {
  selection.on('.drag', undefined)
}

export const enableClick = (selection: D3Selection, onClick: () => void): void => {
  selection.on('click', () => {
    if (d3.event.defaultPrevented) return
    onClick()
  })
}
