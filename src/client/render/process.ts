import { IAnimation, AnimationFull } from '../attributes/definitions/animation'
import { Attr, PartialAttr, AttrEval, AttrRecord } from '../attributes/types'
import * as attrUtils from '../attributes/utils'
import * as utils from '../utils'

export interface IRender<T extends Attr> {
  readonly name: string
  readonly attr: T
  readonly animation: AnimationFull<PartialAttr<T>>
  readonly changes?: PartialAttr<T>
  readonly highlight?: PartialAttr<T>
}

export interface IRenderEndpoint<T extends Attr> {
  readonly name: string
  readonly attr: T
  readonly animation?: IAnimation
  readonly changes?: PartialAttr<T>
  readonly highlight?: T
}

export type RenderAttr<T extends Attr> = IRender<AttrEval<T>>
export type RenderEndpoint<T extends Attr> = IRenderEndpoint<AttrEval<T>>

export const flatten = <T extends { readonly [k: string]: attrUtils.AttrEndpoint }>
  (renderData: RenderAttr<T>): RenderEndpoint<T> => {

  const mapped = utils.mapDict(renderData.attr, k => getEntry(renderData, k as keyof T))
  return combine(mapped as unknown as { readonly [k in keyof T]: RenderEndpoint<T[k]> })
}

export const combine = <T extends object>(renderDict: { readonly [k in keyof T]: RenderEndpoint<T[k]> }):
                                          RenderEndpoint<T> => {
  const hasHighlight = !utils.isDictEmpty(utils.filterDict(renderDict, (k, v) => v.highlight !== undefined))
  const highlight = !hasHighlight ? undefined : utils.mapDict(renderDict, (k, v) =>
    v.highlight !== undefined ? v.highlight : v.attr) as RenderEndpoint<T>['highlight']

  const changesDict = utils.filterDict(utils.mapDict(renderDict, (k, v) => v.changes), (k, v) => v !== undefined)
  const changes = utils.isDictEmpty(changesDict) ? undefined : changesDict as RenderEndpoint<T>['changes']

  const animation = Object.entries(renderDict).reduce(
    (result: IAnimation, [k, renderData]: [string, RenderEndpoint<T[keyof T]>], i) => {

    const shouldTake = renderData.changes !== undefined && renderData.animation !== undefined
    if (result === undefined && (shouldTake || i === Object.keys(renderDict).length - 1)) return renderData.animation
    else return result
  }, undefined)

  const attr = utils.mapDict(renderDict, (k, v) => v.attr) as RenderEndpoint<T>['attr']

  return {
    name: Object.keys(renderDict).reduce((result, k, i) => result + (i === 0 ? '' : '-') + k),
    attr: attr,
    changes: changes,
    animation: animation,
    highlight: highlight
  }
}

export const getEntry = <T extends AttrRecord, K extends keyof T>
  (renderData: RenderAttr<T>, key: K): RenderAttr<T[K]> => {
  return {
    name: key as string,
    attr: renderData.attr[key as string],
    animation: (renderData.animation || {})[key as string],
    changes: (renderData.changes || {})[key as string],
    highlight: (renderData.highlight || {})[key as string]
  }
}

export const hasChanged = (renderAttr: RenderEndpoint<Attr> | RenderAttr<Attr>): boolean => {
  return renderAttr.changes !== undefined || renderAttr.highlight !== undefined
}

export const markForUpdate = <T extends AttrRecord>(renderAttr: RenderAttr<T>): RenderAttr<T> => {
  return markKeysForUpdate(renderAttr, Object.keys(renderAttr.attr) as unknown as ReadonlyArray<keyof T>)
}
export const markKeysForUpdate = <T extends AttrRecord>(renderAttr: RenderAttr<T>,
                                                        keys: ReadonlyArray<keyof T>): RenderAttr<T> => {
  const newChanges = keys.reduce((result, k) => ({...result, [k]: renderAttr.attr[k as string] }), {})
  return {...renderAttr, changes: {
      ...renderAttr.changes || {},
      ...newChanges
    } as RenderAttr<T>['changes']
  }
}
