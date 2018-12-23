export interface Lookup<T> { readonly [k: string]: T }
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type MapDict<D, M> = { [k in keyof D]: M }
export type Primitive = string | number | boolean

export type RPartial<T> = T extends object ? {
  readonly [k in keyof T]?: RPartial<T[k]>
} : T

export const mapDict = <T, M>(dict: T, func: ((k: keyof T, v: T[keyof T], i: number) => M)): MapDict<T, M> => {
  /* tslint:disable */
  let newDict = {}
  const keys = Object.keys(dict)
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    newDict[k] = func(k as keyof T, dict[k], i)
  }
  return newDict as MapDict<T, M> 
  /* tslint:enable */
}

export const enumValues = <T>(enumeration: T): ReadonlyArray<T[keyof T]> =>
  Object.keys(enumeration).map(k => enumeration[k])

export const isNumStr = (value: string): boolean => {
  return !isNaN(value as unknown as number) && value !== ''
}

export const isDict = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isDictEmpty = (dict: object) => Object.keys(dict).length === 0

export const filterError = <T>(value: { [k in keyof T]: T[k] | Error }): T | Error => {
  const error = Array.isArray(value) ? value.find(v => v instanceof Error)
    : typeof value === 'object' ? Object.values(value).find(v => v instanceof Error)
    : value
  return error || value
}

type FilterFn<T> = (k: keyof T, v: T[keyof T], i: number) => boolean
export const filterDict = <T extends object>(dict: T, filterFn: FilterFn<T>): Partial<T> => {
  return Object.entries(dict).reduce((newDict, [k, v], i) =>
    ({...newDict, ...(filterFn(k as keyof T, v, i) ? { [k]: v } : {}) }), {})
}

export const removeWhitespace = (s: string) => s.replace(/\s/g, '')
