import { AnimationFull, IAnimation } from '../attributes/definitions/animation'
import { AttrDef } from '../attributes/definitions'
import { Attr, PartialAttr, AttrEntryPartial, AttrEntry } from '../attributes/types'
import { MapEndpoints } from '../attributes/utils'
import { ICanvasAttr, definition as canvasDef } from '../attributes/definitions/canvas'
import * as attrAnim from '../attributes/definitions/animation'
import * as attrCanvas from '../attributes/definitions/canvas'
import * as attrUtils from '../attributes/utils'

export const definition: AttrDef<AnimationFull<ICanvasAttr>> =
  attrAnim.createFullDef(attrCanvas.definition, attrAnim.definition)

const addEndpoints = <T extends Attr, A> (animation: A, attr: PartialAttr<T>, def: AttrDef<T>):
                                                 MapEndpoints<PartialAttr<T>, A> => {
  if (attrUtils.isDefPrimitive(def)) return animation as MapEndpoints<PartialAttr<T>, A>
  else {
    return attrUtils.reduceChanges(attr, def, (k, v, d) =>
      addEndpoints(animation, v, d) as unknown as AttrEntryPartial<T>
    ) as unknown as MapEndpoints<PartialAttr<T>, A>
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

export const process = (animation: PartialAttr<IAnimation>, prevState: ICanvasAttr | undefined,
                        changes: PartialAttr<ICanvasAttr>, changesForced: PartialAttr<ICanvasAttr>):
                        AnimationFull<ICanvasAttr> => {
  const changesMain = getRelevantChanges(prevState, changes, canvasDef)
  const changesFull = attrUtils.merge(changesForced, changesMain, canvasDef)

  const animChanges = addEndpoints(animation, changesFull, canvasDef)

  const animDefaultsRegular = addEndpoints(attrAnim.defaults, changesFull, canvasDef)
  const animDefaultsExtra = attrUtils.fillLookupEntries(attrCanvas.animationDefaults,
    animDefaultsRegular, definition)

  const animDefaultsFull = attrUtils.merge(animDefaultsRegular, animDefaultsExtra, definition)

  return attrUtils.merge(animDefaultsFull, animChanges, definition) as AnimationFull<ICanvasAttr>
}
