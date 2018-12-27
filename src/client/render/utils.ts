import { AnimationEase } from '../attributes/definitions/animation'
import * as d3 from './d3.modules'

type BaseType = import ('d3-selection').BaseType
export type D3Selection = import ('d3-selection').Selection
  <BaseType, unknown, BaseType, unknown>
export type D3Transition = import ('d3-transition').Transition
  <BaseType, unknown, BaseType, unknown>

export type D3SelTrans = D3Selection | D3Transition
export type D3Zoom = import ('d3-zoom').ZoomBehavior<Element, unknown>

export const selectOrAdd = (selection: D3Selection, selector: string,
                            addFn: ((s: D3Selection) => D3Selection)): D3Selection => {
  const selected = selection.select(selector)
  if (selected.empty()) return addFn(selection)
  else return selected as D3Selection
}

export const easeFn = (name: AnimationEase): ((t: number) => number) => {
  return d3.ease['ease' + name.charAt(0).toUpperCase() + name.substr(1)] // e.g. convert 'linear' to 'easeLinear'
}

export const isInBrowser = (): boolean => {
  return typeof window !== undefined
}
