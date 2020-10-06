import { ReceiveEvent, DispatchEvent } from '../client/types';
import { ElementAttrs, ElementFn, ElementArg } from './types';
import { ElementContext } from './ElementSelection';

export interface ElementCallbacks {
    readonly click?: () => void;
    readonly hoverin?: () => void;
    readonly hoverout?: () => void;
}

export interface ClientCallbacks {
    readonly ondispatch?: (event: DispatchEvent) => void;
    readonly onreceive?: (event: ReceiveEvent) => void;
    readonly messages: {
        readonly [k: string]: () => void;
    } & {
        readonly '*'?: (message: string) => void;
    };
    readonly nodes: {
        readonly [k: string]: ElementCallbacks;
    };
}

export interface EventHandler {
    readonly dispatch: (event: DispatchEvent) => void;
    _callbacks: ClientCallbacks;
}

export type ElementObjArg<T, D> =
    | ElementArg<T, D>
    | { readonly [k in keyof T]: ElementArg<T[k], D> };

export const isElementFn = <V, D>(v: ElementArg<V, D>): v is ElementFn<V, D> =>
    typeof v === 'function';

export const evalElementArg = <T, D>(arg: ElementArg<T, D>, data: D, index: number): T => {
    if (isElementFn(arg)) return arg(data, index);
    else return arg;
};

export const evalElementObjArg = <T, D>(arg: ElementObjArg<T, D>, data: D, index: number): T => {
    // evaluate the entire object as a function
    if (isElementFn(arg)) return arg(data, index);
    else {
        if (Object.keys(arg).every((k) => !isElementFn(arg[k as keyof T]))) {
            // simply return the object if it has no function keys
            return arg as T;
        }

        // evaluate each key which has a function
        let argObj = {} as T;
        Object.keys(arg).forEach((k) => {
            argObj[k as keyof T] = evalElementArg(
                arg[k as keyof T] as ElementArg<T[keyof T], D>,
                data,
                index
            );
        });
        return argObj;
    }
};

export const applyAttrs = <T, D>(
    selection: ElementContext<D>,
    attrFn: (data: D, dataIndex: number, elementIndex: number) => T
) => {
    if (selection.data !== undefined) {
        // evaluate using the current data
        let dict: { [k: string]: T } = {};
        Object.keys(selection.ids).forEach((k, i) => {
            dict[k] = attrFn(selection.data![i], i, i);
        });
        selection.parent!.selection.attrs({ [selection.parent!.key]: dict });
    } else {
        // pass a function on to the parent, so that the parent's data is used
        const dictFn = (data: D, dataIndex: number) => {
            let dict: { [k: string]: T } = {};
            Object.keys(selection.ids).forEach((k, i) => {
                dict[k] = attrFn(data, dataIndex, i);
            });
            return dict;
        };
        selection.parent!.selection.attrs({ [selection.parent!.key]: dictFn });
    }
};

export const addElementCallback = <D>(
    selection: ElementContext<D>, // with the canvas as its parent
    eventType: keyof ElementCallbacks,
    fn: ElementFn<void, D>
) => {
    const cbs = selection.parent!.root._callbacks;
    const elementKey = selection.parent!.key as 'nodes';

    const elementCbDict = { ...cbs[elementKey] };
    selection.ids.forEach((k, i) => {
        elementCbDict[k] = {
            ...elementCbDict[k],
            [eventType]: () => evalElementArg(fn, selection.data![i], i),
        };
    });

    selection.parent!.root._callbacks = {
        ...cbs,
        [elementKey]: elementCbDict,
    };
};
