import { Primitive } from '../utils'
import { AttrType, AttrDef, IAttrDef, IAttrDefPrimitive } from './definitions'
import { Attr, AttrNum, INumExpr, AttrPrimitive, VarSymbol, PartialAttr } from './types'
import * as attrUtils from './utils'
import * as utils from '../utils'

interface ITerm { readonly num: number, readonly symbol?: string }
const parseSingleTerm = (term: string): ITerm | Error => {
  const reverseIndex = term.split('').findIndex((c, i) => utils.isNumStr(term.substring(0, term.length - i)))
  const varIndex = reverseIndex === -1 ? (term[0] === '-' || term[0] === '+' ? 1 : 0) : term.length - reverseIndex
  const rawNumStr = term.substring(0, varIndex)
  const varStr = term.substring(varIndex)
  const numStr = rawNumStr === '' && varStr === '' ? '0'
    : rawNumStr === '' || rawNumStr === '+' ? '1'
    : rawNumStr === '-' ? '-1' : rawNumStr
  if (!utils.isNumStr(numStr)) return new Error()
  return {
    num: parseFloat(numStr),
    ...(varStr !== '' ? { symbol: varStr } as Partial<ITerm> : {})
  }
}

export const parseExpr = (value: string, vars: ReadonlyArray<VarSymbol>): INumExpr | Error => {
  // e.g. parse 4.7r - 9 to { m: 4.7, x: 'r', c: -9 }
  const errorText = `invalid expression '${value}'`

  const expression = utils.removeWhitespace(value)
  const opIndex = expression.lastIndexOf('+') > 0 ? expression.lastIndexOf('+')
    : expression.lastIndexOf('-') > 0 ? expression.lastIndexOf('-') : expression.length

  const term1 = parseSingleTerm(expression.substring(0, opIndex))
  const term2 = parseSingleTerm(expression.substring(opIndex))

  if (term1 instanceof Error) return new Error(errorText)
  else if (term2 instanceof Error) return new Error(errorText)
  else {
    if (term1.symbol !== undefined && term2.symbol !== undefined) return new Error(`${errorText}: too many variables`)
    const exprObject: INumExpr = term1.symbol !== undefined
      ? { m: term1.num, x: term1.symbol as VarSymbol, c: term2.num }
      : { m: term2.num, x: term2.symbol as VarSymbol, c: term1.num }
    return parseExprObj(exprObject, vars, value)
  }
}

export const parseExprObj = (value: object, vars: ReadonlyArray<VarSymbol>,
                             formatted?: string): INumExpr | Error => {
  const formattedExpr = formatted || JSON.stringify(value)
  const numExpr = value as Partial<INumExpr>

  if (numExpr.m !== undefined && typeof numExpr.m !== 'number'
    || numExpr.c !== undefined && typeof numExpr.c !== 'number'
    || numExpr.x === undefined)
    return new Error(`invalid expression '${formattedExpr}'`)

  if (!vars.includes(numExpr.x))
    return new Error(`expression '${formattedExpr}' uses invalid variable '${numExpr.x}'`
    + ` (valid variables are [${vars}])`)

  return {
    m: numExpr.m !== undefined ? numExpr.m : 1,
    x: numExpr.x,
    c: numExpr.c !== undefined ? numExpr.c : 0
  }
}

export const isExpressionNum = (attr: AttrNum): attr is INumExpr => utils.isDict(attr)
export const isExpression = (attr: AttrPrimitive, def: IAttrDef): boolean => {
  if (def.type === AttrType.Number) return isExpressionNum(attr as AttrNum)
  else return false
}

export type VarLookup = { readonly [k in VarSymbol]?: Primitive }
export const evaluateNum = (expression: AttrNum, vars: VarLookup): AttrNum => {
  // e.g. expressionDict = { value: 8, units: 'x' }, units = { x: 5 } => return 16
  if (!isExpressionNum(expression)) return expression
  const m = expression.m !== undefined ? expression.m : 1
  const c = expression.c !== undefined ? expression.c : 0

  if (expression.x === undefined) return m + c
  else if (vars.hasOwnProperty(expression.x)) return m * (vars[expression.x] as number) + c
  else return expression
}

export const getExpressionVars = (attr: AttrPrimitive, def: IAttrDef): ReadonlyArray<VarSymbol> => {
  if (def.type === AttrType.Number && isExpression(attr, def)) {
    return [(attr as INumExpr).x]
  } else return []
}

export const evaluate = <T extends Attr>(attr: T, vars: VarLookup, definition: AttrDef<T>): T => {
  if (definition.type === AttrType.Number) return evaluateNum(attr as AttrNum, vars) as T
  else return attrUtils.map(attr, definition, (k, v, def) => evaluate(v, vars, def))
}

export const evaluateChanges = <T extends Attr>(prevAttr: T | undefined, attr: T, def: AttrDef<T>,
                                                varsFn: (a: T) => VarLookup): PartialAttr<T> => {
  return evaluateIfChanged(attr, prevAttr === undefined ? {} : varsFn(prevAttr), varsFn(attr), def)
}

export const evaluateIfChanged = <T extends Attr>(attr: T, varsPrev: VarLookup, vars: VarLookup,
                                                  def: AttrDef<T>): PartialAttr<T> => {
  const didChange = Object.keys(varsPrev).length !== Object.keys(vars).length
    || Object.keys(vars).findIndex(k => varsPrev[k] !== vars[k]) >= 0

  if (!didChange) return undefined
  else return getEvaluatedChanges(attr as null, {...varsPrev, ...vars }, def)
}

export function getEvaluatedChanges<T extends Attr> (attr: PartialAttr<T>, vars: VarLookup,
                                                     def: AttrDef<T>): PartialAttr<T> {
  if (def.type === AttrType.Number && isExpressionNum(attr as AttrNum)) {
    const varSymbols = getExpressionVars(attr as AttrNum, def)
    const shouldUpdate = Object.keys(vars).findIndex((k: VarSymbol) => varSymbols.includes(k)) >= 0
    if (shouldUpdate) return evaluateNum(attr as AttrNum, vars) as PartialAttr<T>
    else return undefined

  } else return attrUtils.reduceChanges(attr, def, (k, v, d) => getEvaluatedChanges(v, vars, d))
}

export const getExpr = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>): PartialAttr<T> => {
  if (attrUtils.isDefPrimitive(def) && isExpression(attr as AttrPrimitive, def)) return attr
  else return attrUtils.reduceChanges(attr, def, (k, v, d) => getExpr(v, d))
}

export const getNonExpr = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>): PartialAttr<T> => {
  if (attrUtils.isDefPrimitive(def) && !isExpression(attr as AttrPrimitive, def)) return attr
  else return attrUtils.reduceChanges(attr, def, (k, v, d) => getNonExpr(v, d))
}

export const getPermanentExpr = <T extends Attr>(attr: PartialAttr<T>, def: AttrDef<T>): PartialAttr<T> => {
  if (attrUtils.isDefPrimitive(def) && isExpression(attr as AttrPrimitive, def)) {
    const vars = getExpressionVars(attr as AttrPrimitive, def)
    const symbol = (def as IAttrDefPrimitive<T & AttrPrimitive>).symbol
    return symbol !== undefined && vars.includes(symbol) ? undefined : attr
  } else return attrUtils.reduceChanges(attr, def, (k, v, d) => getPermanentExpr(v, d))
}
