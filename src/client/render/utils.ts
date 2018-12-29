import { AnimationEase } from '../attributes/definitions/animation'
import * as d3 from './d3.modules'

type BaseType = import ('d3-selection').BaseType
export type D3Selection = import ('d3-selection').Selection
  <BaseType, unknown, BaseType, unknown>
export type D3Transition = import ('d3-transition').Transition
  <BaseType, unknown, BaseType, unknown>

export type D3SelTrans = D3Selection | D3Transition
export type D3Zoom = import ('d3-zoom').ZoomBehavior<Element, unknown>

export const isTransition = (sel: D3SelTrans): sel is D3Transition =>
  (sel as D3Transition).duration !== undefined

export const COLORS = {
  navy: '#00229e',
  blue: '#2957c4',
  aqua: '#19c3d6',
  teal: '#05827d',
  olive: '#006333',
  green: '#05914d',
  lime: '#12bc6b',
  yellow: '#cc9918',
  orange: '#dd7d0f',
  red: '#af1c1c',
  pink: '#d14db0',
  fuchsia: '#bc2990',
  purple: '#a31578',
  maroon: '#7c0606',
  white: '#e5e5e5',
  silver: '#c4c4c4',
  gray: '#323232',
  grey: '#323232',
  black: '#111111'
}

export const parseColor = (color: string): string => {
  if (Object.keys(COLORS).includes(color.trim())) return COLORS[color]
  else return color
}

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
