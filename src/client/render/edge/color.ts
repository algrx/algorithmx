import { IEdgeAttr } from '../../attributes/definitions/edge'
import { D3Selection, D3SelTrans } from '../utils'
import { RenderAttr, getEntry } from '../process'
import { IAnimation } from '../../attributes/definitions/animation'
import * as renderFns from '../render'
import * as renderCommon from '../common'
import * as renderUtils from '../utils'

export const selectOverlay = (edgeSel: D3Selection, edgeRenderId: string): D3Selection => {
  edgeSel.select('.edge-path-overlay').remove()
  return edgeSel.append('path').classed('edge-path-overlay', true)
    .attr('fill', 'none').attr('stroke-linecap', 'butt')
    .attr('marker-end', `url(#marker-edge-${edgeRenderId}-target)`)
}

const getPathLength = (pathSel: D3Selection) => (pathSel.node() as SVGPathElement).getTotalLength()

const tweenOverlay = (overlaySel: D3SelTrans, animation: IAnimation, pathLengthFn: () => number,
                      beginTraverse: boolean): D3SelTrans => {
  if (renderUtils.isTransition(overlaySel)) {
    return overlaySel.attrTween('stroke-dashoffset', () => {
      const pathLength = pathLengthFn()
      if (beginTraverse) return t => (pathLength - (animation.type === 'traverse' ? t : -t) * pathLength).toString()
      else return t => ((animation.type === 'traverse' ? -t : t) * pathLength).toString()
    })
  } else return overlaySel.attr('stroke-dashoffset', beginTraverse ? 0 : pathLengthFn())
}

const highlightTraverse = (pathSel: D3Selection, overlaySel: D3Selection,
                           renderData: RenderAttr<IEdgeAttr>): void => {
  const colorData = getEntry(renderData, 'color')

  overlaySel.attr('stroke', renderUtils.parseColor(colorData.highlight))
    .attr('stroke-width', renderData.attr.thickness + 2)

  const startFn = (sel: D3SelTrans): D3SelTrans => {
    const trans = sel.attr('stroke-width', renderData.attr.thickness)
    return tweenOverlay(trans, colorData.animation, () => getPathLength(pathSel), true)
  }
  const endFn = (sel: D3SelTrans): D3SelTrans => {
    sel.on('start', () => {
      const pathLength = getPathLength(pathSel)
      overlaySel.attr('stroke-dasharray', pathLength)
    })
    const trans = tweenOverlay(sel, colorData.animation, () => getPathLength(pathSel), false)
    return renderFns.newTransition(trans, t => t.duration(0)).remove()
  }
  renderFns.renderHighlight(overlaySel, colorData, startFn, endFn)
}

export const renderTraverse = (pathSel: D3Selection, renderData: RenderAttr<IEdgeAttr>,
                               overlaySelector: () => D3Selection): void => {
  const colorData = getEntry(renderData, 'color')
  const overlaySel = overlaySelector()
  const pathLengthInit = getPathLength(pathSel)

  overlaySel.attr('stroke-dasharray', pathLengthInit).attr('stroke-offset', pathLengthInit)

  if (colorData.highlight !== undefined) highlightTraverse(pathSel, overlaySel, renderData)
  else {
    overlaySel.attr('stroke', renderUtils.parseColor(colorData.attr))
      .attr('stroke-width', renderData.attr.thickness + 2)

    renderFns.render(overlaySel, colorData, sel => {
      const trans = sel.attr('stroke-width', renderData.attr.thickness)
      return tweenOverlay(trans, colorData.animation, () => getPathLength(pathSel), true)
    })

    const animDuration = renderFns.parseTime(colorData.animation.duration)
    const endDuration = animDuration / 3
    renderFns.transition(pathSel, colorData.name, t =>
      t.delay(animDuration).duration(endDuration))
        .attr('stroke', renderUtils.parseColor(colorData.attr))

    const removeTrans = renderFns.newTransition(overlaySel.attr('opacity', 1), t =>
      t.delay(animDuration + endDuration).duration(endDuration))
        .attr('opacity', 0)
    renderFns.newTransition(removeTrans, t => t.duration(0)).remove()
  }
}

export const renderColor = (pathSel: D3Selection, markerSel: D3Selection, overlaySelector: () => D3Selection,
                            renderData: RenderAttr<IEdgeAttr>): void => {
  const colorData = getEntry(renderData, 'color')
  const doTraverse = colorData.animation && (colorData.animation.type === 'traverse'
    || colorData.animation.type === 'traverse-reverse')

  if (doTraverse) renderTraverse(pathSel, renderData, overlaySelector)
  else renderCommon.renderSvgAttr(pathSel, 'stroke', v => renderUtils.parseColor(v), colorData)

  renderCommon.renderSvgAttr(markerSel, 'fill', v => renderUtils.parseColor(v), colorData)
}
