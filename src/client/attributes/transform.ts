import { AttrSpec, EntrySpec, AttrType, DictSpec, AnyRecordSpec, AttrKey } from './spec';
import { PartialAttr, FullAttr } from './derived';
import { AnimSpec, animSpec } from './components/animation';
import { combineAttrs, getAttrEntry, mapAttr, isPrimitive } from './attr-utils';
import { CanvasSpec } from './components/canvas';
import { EdgeSpec, parseEdgeId } from './components/edge';
import { mapDict, mapDictKeys, filterDict } from '../utils';

// apply defaults to all attributes which are new (e.g. when a new node is added)
export const applyDefaults = <T extends AttrSpec>(
    spec: T,
    prevAttrs: FullAttr<T> | undefined,
    changes: PartialAttr<T> | undefined,
    defaults: FullAttr<T>
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
                if (k === '*') return undefined; // don't include "*" as an actual attribute
                return applyDefaults(
                    childSpec,
                    undefined,
                    childChanges,
                    childDefaults as FullAttr<EntrySpec<T>>
                );
            }
        );
    }

    return mapAttr(spec, changes, (childChanges, k, childSpec) => {
        // the "*" entry in a dict contains defaults for all of the children
        const childDefaults =
            getAttrEntry(defaults, k) ?? (defaults as PartialAttr<DictSpec<T>>['*']);

        return applyDefaults(
            childSpec,
            prevAttrs ? getAttrEntry(prevAttrs, k) : undefined,
            childChanges,
            childDefaults as FullAttr<EntrySpec<T>>
        );
    });
};

// apply animation defaults to endpoints only
export const applyAnimDefaults = <T extends AttrSpec>(
    spec: T,
    changes: PartialAttr<T>,
    anim: PartialAttr<AnimSpec>
): PartialAttr<T> => {
    // the 'value' attribute only exists on endpoints
    if (spec.type === AttrType.Record && 'value' in (spec as AnyRecordSpec).entries) {
        // merge animation defaults
        const validAnim = filterDict(anim, (_, k) => k in (spec as AnyRecordSpec).entries);
        return { ...(changes as PartialAttr<AnyRecordSpec>), ...validAnim } as PartialAttr<T>;
    }

    return mapAttr(spec, changes, (childChanges, k, childSpec) => {
        return applyAnimDefaults(childSpec, childChanges, anim);
    });
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
        else if (k in changes.edges!) return edge;
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
