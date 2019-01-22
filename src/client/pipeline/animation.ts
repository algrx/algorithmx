import { AnimationFull, IAnimation } from '../attributes/definitions/animation'
import { AttrDef } from '../attributes/definitions'
import { Attr, PartialAttr, AttrEntryPartial, AttrEntry } from '../attributes/types'
import { MapEndpoints } from '../attributes/utils'
import { ICanvasAttr, definition as canvasDef } from '../attributes/definitions/canvas'
import * as attrAnim from '../attributes/definitions/animation'
import * as attrCanvas from '../attributes/definitions/canvas'
import * as attrUtils from '../attributes/utils'
import { InputCanvasAnimAttr, InputAnimAttr } from '../attributes/definitions/types'

export const definition: AttrDef<AnimationFull<ICanvasAttr>> =
  attrAnim.createFullDef(attrCanvas.definition, attrAnim.definition)

type InputAnimFull<T> = MapEndpoints<PartialAttr<T>, PartialAttr<IAnimation>>
const addEndpoints = <T extends Attr>(anim: InputAnimAttr<T> | null, attr: PartialAttr<T>, def: AttrDef<T>,
                                      curAnim: PartialAttr<IAnimation> = {}): InputAnimFull<T> => {
  if (attrUtils.isDefPrimitive(def)) return (anim !== null ? anim : curAnim) as InputAnimFull<T>
  else {
    return attrUtils.reduceChanges(attr, def, (k, v, d) => {
      const newAnim = anim !== null && anim[k] !== undefined ? anim[k] : null
      const newCurAnim = anim !== null && anim['**'] !== undefined
        ? attrUtils.merge(curAnim, anim['**'], attrAnim.definition) : curAnim
      return addEndpoints(newAnim, v, d, newCurAnim) as unknown as AttrEntryPartial<T>

    }) as unknown as InputAnimFull<T>
  }
}

const getRelevantChanges = <T extends Attr>(prevAttr: T | undefined, changes: PartialAttr<T>,
                                            def: AttrDef<T>): PartialAttr<T> => {
  if (attrUtils.isDefPrimitive(def)) return changes
  else {
    return attrUtils.reduceAttr(changes, def, (k, v, d) => {
      const prevChild = prevAttr ? prevAttr[k] as AttrEntry<T> : undefined
      if (prevChild === undefined) return undefined
      else if (attrUtils.isDefLookup(def) && v === null)
        return prevChild as unknown as AttrEntryPartial<T>
      else return getRelevantChanges(prevChild, v, d)
    })
  }
}

export const process = (animation: InputCanvasAnimAttr, prevState: ICanvasAttr | undefined,
                        changes: PartialAttr<ICanvasAttr>, changesForced: PartialAttr<ICanvasAttr>):
                        AnimationFull<ICanvasAttr> => {
  const changesMain = getRelevantChanges(prevState, changes, canvasDef)
  const changesFull = attrUtils.merge(changesForced, changesMain, canvasDef)

  const animChanges = addEndpoints(animation, changesFull, canvasDef)

  const animDefaultsRegular = addEndpoints({ '**': attrAnim.defaults }, changesFull, canvasDef)
  const animDefaultsExtra = attrUtils.fillLookupEntries(attrCanvas.animationDefaults,
    animDefaultsRegular, definition)

  const animDefaultsFull = attrUtils.merge(animDefaultsRegular, animDefaultsExtra, definition)

  return attrUtils.merge(animDefaultsFull, animChanges, definition) as AnimationFull<ICanvasAttr>
}
