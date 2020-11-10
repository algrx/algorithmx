import { transition } from './attribute';
import { D3Selection, D3SelTrans } from './utils';
import { ElementSpec } from '../attributes/components/element';
import {
    AttrSpec,
    EndpointValueSpec,
    DictSpec,
    PrimitiveSpec,
    StringSpec,
    BoolSpec,
    NumSpec,
} from '../attributes/spec';
import { PartialAttr, FullAttr } from '../attributes/derived';
import { AnimAttrSpec, WithAnimSpec } from '../attributes/components/animation';
import {
    renderAnimAttr,
    RenderElementFn,
    RenderFn,
    animate,
    newTransition,
    isAnimationImmediate,
    parseTime,
} from './attribute';
import { isNum } from '../utils';

export const renderDict = <T extends AttrSpec>(
    attrs: FullAttr<DictSpec<T>>,
    changes: PartialAttr<DictSpec<T>> | undefined,
    renderFn: (k: string, childAttrs: FullAttr<T>, childChanges: PartialAttr<T>) => void
): void => {
    if (changes === undefined) return;
    Object.entries(changes).forEach(([k, childChanges]) => {
        renderFn(k, attrs[k], childChanges);
    });
};

export const renderSvgAttr = <T extends PartialAttr<AnimAttrSpec>>(
    selection: D3Selection,
    name: string | [string, string], // attrName | [attrName, animName]
    changes: T | undefined,
    valueFn: (v: NonNullable<T['value']>) => PartialAttr<PrimitiveSpec> | null = (v) =>
        v as PartialAttr<PrimitiveSpec>
): D3SelTrans => {
    if (changes === undefined || changes.value === undefined) return selection;
    const value = valueFn(changes.value as NonNullable<T['value']>);

    const attrName = Array.isArray(name) ? name[0] : name;
    const animName = Array.isArray(name) ? name[1] : name;
    return renderAnimAttr(selection, animName, changes, (sel) => {
        return value == null ? sel.attr(attrName, null) : sel.attr(attrName, String(value));
    });
};

export const renderSvgDict = (
    selection: D3Selection,
    changes: PartialAttr<DictSpec<WithAnimSpec<StringSpec>>>
) => {
    const select = (sel: D3Selection, k: string): [D3Selection, string] =>
        k.includes('@') ? [sel.selectAll(k.split('@')[1]), k.split('@')[0]] : [sel, k];

    Object.entries(changes).forEach(([baseKey, v]) => {
        const [s, k] = select(selection, baseKey);
        if (v.value === '') renderSvgAttr(s, k, v, (v) => null);
        // remove
        else renderSvgAttr(s, k, v);
    });
    return selection;
};

const animateAdd = <T extends AnimAttrSpec>(selection: D3Selection, attr: PartialAttr<T>): void => {
    selection.attr('opacity', '0');
    const transition = animate(selection, 'visible-fade', attr).attr('opacity', '1');
    newTransition(transition, (t) => t).attr('opacity', null);
};

const animateRemove = <T extends AnimAttrSpec>(
    selection: D3Selection,
    attr: PartialAttr<T>
): void => {
    selection.attr('opacity', '1');
    animate(selection, 'visible-fade', attr).attr('opacity', '0');
};

export const renderVisible = (
    selection: D3Selection,
    attr: PartialAttr<WithAnimSpec<BoolSpec>>
) => {
    if (!isAnimationImmediate(attr)) {
        if (attr.value === true) animateAdd(selection, attr);
        else animateRemove(selection, attr);
    }
};

/*
export const renderRemove = (
    selection: D3Selection,
    attr: PartialAttr<WithAnimSpec<BoolSpec>>,
) => {
};

export const preprocess = <T extends ElementSpec>(renderData: RenderAttr<T>): RenderAttr<T> => {
    const visibleData = getEntry(renderData, 'visible');
    return renderProcess.hasChanged(visibleData) && visibleData.attr === true
        ? renderProcess.markForUpdate(renderData)
        : renderData;
};
*/

const removeElement = <T extends ElementSpec>(selection: D3Selection, attr: PartialAttr<T>) => {
    const visibleAttr = { ...attr.visible, value: false };
    renderVisible(selection, visibleAttr);

    if (isAnimationImmediate(visibleAttr)) selection.remove();
    else {
        transition(selection, 'remove', (t) =>
            t.delay(isNum(visibleAttr.duration) ? visibleAttr.duration * 1000 : 0)
        ).remove();
    }
};

export const renderElement = <T extends ElementSpec>(
    selection: D3Selection,
    attrs: FullAttr<T>,
    initChanges: PartialAttr<T>,
    renderFn: RenderElementFn<T>
) => {
    //const renderDataFull = preprocess(renderData);
    //const changes = initChanges.visible === true ? attr :
    if (attrs.visible?.value === false) return;
    const changes = initChanges.visible?.value === true ? (attrs as PartialAttr<T>) : initChanges;

    //if (changes.visible?.value === true) selector().remove();
    //const selection = selector();

    renderFn(selection, attrs, changes);

    if (changes.remove === true || changes.visible?.value === false) {
        const visibleAttr = { ...changes.visible, value: false };
        renderVisible(selection, visibleAttr);

        if (isAnimationImmediate(visibleAttr)) selection.remove();
        else {
            transition(selection, 'remove', (t) =>
                t.delay(isNum(visibleAttr.duration) ? visibleAttr.duration * 1000 : 0)
            ).remove();
        }
    } else if (changes.visible?.value === true) renderVisible(selection, changes.visible);
};

/*
export const renderElementLookup = <T extends ElementSpec>(
    selector: (k: string) => D3Selection,
    attr: PartialAttr<DictSpec<T>>,
    changes: PartialAttr<DictSpec<T>>,
    renderFn: (key: string, attr: PartialAttr<T>) => void,
) => {
    Object.entries(attr).forEach(([k, v]) => {
        if (v.visible == true) renderElement(() => selector(k), v, renderFn)
    );

    Object.entries(attr).forEach(([k, v]) => {
        if (v.remove)
        renderFns.renderLookupRemovals(renderData, (k, data) => renderElementRemove(selector(k), data));
    }
};
*/
