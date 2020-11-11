import {
    AttrSpec,
    EntrySpec,
    AttrType,
    DictSpec,
    AnyRecordSpec,
    AttrKey,
    AnyDictSpec,
    RecordSpec,
    EndpointValueSpec,
} from './spec';
import { PartialAttr, FullAttr } from './derived';
import { AnimSpec, animSpec, WithAnimSpec } from './components/animation';
import { combineAttrs, getAttrEntry, mapAttr, isPrimitive } from './attr-utils';
import { CanvasSpec } from './components/canvas';
import { EdgeSpec, parseEdgeId } from './components/edge';
import { mapDict, mapDictKeys, filterDict } from '../utils';
import { ElementSpec } from './components/element';

// the 'value' attribute only exists on endpoints
const isEndpointSpec = <T extends AttrSpec>(spec: T) =>
    spec.type === AttrType.Record && 'value' in (spec as AnyRecordSpec).entries;

const isElementSpec = <T extends AttrSpec>(spec: T) =>
    spec.type === AttrType.Record && 'visible' in (spec as AnyRecordSpec).entries;

// remove all animations
export const withoutAnim = <T extends AttrSpec>(spec: T, attrs: PartialAttr<T>): PartialAttr<T> => {
    if (spec.type === AttrType.Record && 'duration' in (spec as AnyRecordSpec).entries) {
        const noAnim: PartialAttr<AnimSpec> = { duration: 0 };
        return { ...(attrs as PartialAttr<AnyRecordSpec>), ...noAnim } as PartialAttr<T>;
    }
    return attrs;
};

export const withAnim = <T extends AttrSpec>(
    spec: T,
    attrs: PartialAttr<T>,
    anim: PartialAttr<AnimSpec>
): PartialAttr<T> => {
    if (spec.type === AttrType.Record) {
        // merge animation defaults
        const validAnim = filterDict(anim, (_, k) => k in (spec as AnyRecordSpec).entries);
        return { ...(attrs as PartialAttr<AnyRecordSpec>), ...validAnim } as PartialAttr<T>;
    }
    return attrs;
};

// apply defaults to all attributes which are new (e.g. when a new node is added)
export const applyDefaults = <T extends AttrSpec>(
    spec: T,
    prevAttrs: FullAttr<T> | undefined,
    changes: PartialAttr<T> | undefined,
    [defaults, animDefaults]: [FullAttr<T>, PartialAttr<AnimSpec>]
): PartialAttr<T> => {
    // always fall back on the defaults
    if (isPrimitive(spec)) return changes ?? (defaults as PartialAttr<T>);

    if (prevAttrs === undefined || changes === undefined) {
        // if the attributes are new, apply all defaults
        return combineAttrs(
            spec,
            defaults as PartialAttr<T>,
            changes,
            (childDefaults, childChanges, k, childSpec) => {
                if (childDefaults === undefined) {
                    console.error('unexpected error: missing defaults');
                    return undefined;
                }
                if (k === '*') return undefined; // don't include "*" as an actual attribute

                // if an element is new, the only attribute that should be animated is visibility
                const newChildDefaults = isEndpointSpec(childSpec)
                    ? k === 'visible'
                        ? withAnim(childSpec, childDefaults, animDefaults)
                        : withoutAnim(childSpec, childDefaults)
                    : childDefaults;

                return applyDefaults(childSpec, undefined, childChanges, [
                    newChildDefaults as FullAttr<EntrySpec<T>>,
                    animDefaults,
                ]);
            }
        );
    }

    // include animation defautls
    const defaultsWithAnim = isEndpointSpec(spec)
        ? (withAnim(spec, defaults as PartialAttr<T>, animDefaults) as FullAttr<T>)
        : defaults;

    return mapAttr(spec, changes, (childChanges, k, childSpec) => {
        // the "*" entry in a dict contains defaults for all of the children
        const childDefaults =
            getAttrEntry(defaultsWithAnim, k) ?? getAttrEntry(defaultsWithAnim, '*' as AttrKey<T>);

        return applyDefaults(
            childSpec,
            prevAttrs ? getAttrEntry(prevAttrs, k) : undefined,
            childChanges,
            [childDefaults as FullAttr<EntrySpec<T>>, animDefaults]
        );
    });
};

// add visible=true for new elements, visibl=false for elements being removed
export const addVisible = <T extends AttrSpec>(
    spec: T,
    prevAttrs: FullAttr<T> | undefined,
    changes: PartialAttr<T>
): PartialAttr<T> => {
    const withVisible = (visible: boolean) => {
        const visibleAttr: PartialAttr<ElementSpec> = { visible: { value: visible } };
        return { ...visibleAttr, ...(changes as {}) } as PartialAttr<T>;
    };

    const changesWithVisible = isElementSpec(spec)
        ? prevAttrs === undefined
            ? withVisible(true)
            : (changes as PartialAttr<ElementSpec>).remove === true
            ? withVisible(false)
            : changes
        : changes;

    return mapAttr(spec, changesWithVisible, (childChanges, k, childSpec) =>
        addVisible(childSpec, prevAttrs ? getAttrEntry(prevAttrs, k) : undefined, childChanges)
    );
};

// merge changes with full attributes
export const mergeChanges = <T extends AttrSpec>(
    spec: T,
    prevAttrs: FullAttr<T> | undefined,
    changes: PartialAttr<T>
): FullAttr<T> | undefined => {
    // remove records with a 'remove=true' entry
    if (spec.type === AttrType.Record && 'remove' in (spec as AnyRecordSpec).entries) {
        if ((changes as PartialAttr<AnyRecordSpec>)['remove'] === true) return undefined;
    }

    // if the changes are completely new,
    // assume that they have been initialized with full defaults
    if (prevAttrs === undefined) return changes as FullAttr<T>;

    return combineAttrs(
        spec,
        prevAttrs as PartialAttr<T>,
        changes,
        (prevChild, childChanges, _, childSpec) => {
            return childChanges === undefined
                ? prevChild
                : (mergeChanges(
                      childSpec,
                      prevChild as FullAttr<EntrySpec<T>>,
                      childChanges
                  ) as PartialAttr<EntrySpec<T>>);
        }
    ) as FullAttr<T>;
};

// replace the "*" key in dicts with all existing IDs
export const fillStarKeys = <T extends AttrSpec>(
    spec: T,
    prevAttrs: FullAttr<T> | undefined,
    changes: PartialAttr<T>
): PartialAttr<T> => {
    return combineAttrs(
        spec,
        prevAttrs as PartialAttr<T>,
        changes,
        (prevChild, childChanges, k, childSpec) => {
            // fall back on the "*" key
            const newChildChanges =
                spec.type === AttrType.Dict && childChanges === undefined && '*' in changes
                    ? ((changes as PartialAttr<AnyDictSpec>)['*'] as PartialAttr<EntrySpec<T>>)
                    : childChanges;

            // don't include "*" as an actual attribute
            if (spec.type === AttrType.Dict && k === '*') return undefined;
            if (newChildChanges === undefined) return undefined;

            return fillStarKeys(childSpec, prevChild as FullAttr<EntrySpec<T>>, newChildChanges);
        }
    );
};

// remove edges connected to nodes which are being removed
export const removeInvalidEdges = (
    prevAttrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>
): PartialAttr<CanvasSpec> => {
    if (!prevAttrs || !changes.nodes) return changes;

    const edgeChanges = mapDict(prevAttrs.edges, (edge, k) => {
        // check if either the source or target was removed
        if (changes.nodes![edge.source]?.remove === true) return { remove: true };
        else if (changes.nodes![edge.target]?.remove === false) return { remove: true };
        else if (changes.edges && k in changes.edges) return edge;
        else return undefined;
    });

    return {
        ...changes,
        ...(Object.keys(edgeChanges).length > 0 ? { edges: edgeChanges } : {}),
    };
};

// change "target-source(-ID)" to "source-target(-ID)" for undirected edges
export const adjustEdgeIds = (
    prevAttrs: FullAttr<CanvasSpec> | undefined,
    changes: PartialAttr<CanvasSpec>
): PartialAttr<CanvasSpec> => {
    if (!changes.edges || !prevAttrs) return changes;

    const edgeChanges = mapDictKeys(changes.edges, (edge, k) => {
        if (k in changes.edges!) return k; // leave the ID as-is if it already exists
        if (edge.directed === true) return k; // leave the ID as-is if the edge is directed
        const parsedId = parseEdgeId(k);
        if (parsedId === undefined) return k; // leave the ID as-is if it's not in standard form

        // return the new ID if it matches an existing, undirected edge
        const newId = [parsedId[1], parsedId[0]]
            .concat(parsedId.length === 3 ? [parsedId[2]] : [])
            .join('-');
        if (newId in changes.edges!) {
            if (prevAttrs.edges![newId].directed === false) return newId;
        }
        return k;
    });

    return {
        ...changes,
        edges: edgeChanges,
    };
};
