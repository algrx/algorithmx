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
  white: '#ffffff',
  silver: '#b5b5b5',
  lightGray: '#969696',
  lightGrey: '#969696',
  gray: '#323232',
  grey: '#323232',
  black: '#111111'
}

export const parseColor = (color: string): string => {
  if (Object.keys(COLORS).includes(color.trim())) return COLORS[color]
  else return color
}

export const renderId = (id: string): string => {
  /* tslint:disable */
  const hash = id.split('').reduce((h, c) => {
    const newHash = ((h << 5) - h) + c.charCodeAt(0)
    return newHash & newHash
  }, 0)
  return (hash >>> 0).toString(16)
  /* tslint:enable */
}

export const selectOrAdd = (selection: D3Selection, selector: string,
                            addFn: ((s: D3Selection) => D3Selection)): D3Selection => {
  const selected = selection.select(selector)
  if (selected.empty()) return addFn(selection)
  else return selected as D3Selection
}

export const dashToUpperCamel = (str: string) =>
  str.split('-').map(s => s.charAt(0).toUpperCase() + s.substr(1)).join('')

export const easeFn = (name: AnimationEase): ((t: number) => number) => {
  // e.g. convert 'linear' to 'easeLinear'
  return d3.ease['ease' + dashToUpperCamel(name)]
}

export const isInBrowser = (): boolean => {
  return typeof window !== undefined
}
