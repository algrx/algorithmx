import { AnimSpec } from '../client/attributes/components/animation';
import { InputAttr } from '../client/attributes/derived';
import { ReceiveEvent, DispatchEvent } from '../client/types';
import { ElementFn, ElementArg } from './types';

export interface ElementCallbacks {
    readonly click?: () => void;
    readonly hoverin?: () => void;
    readonly hoverout?: () => void;
}

export interface ClientCallbacks {
    dispatch?: (event: DispatchEvent) => void;
    receive?: (event: ReceiveEvent) => void;
    message?: (message: string) => void;
    messages?: {
        readonly [k: string]: () => void;
    };
    nodes?: {
        readonly [k: string]: ElementCallbacks;
    };
}

export interface Client {}

export interface ElementContext<D> {
    readonly ids: ReadonlyArray<string>;
    readonly data?: ReadonlyArray<D>;
    readonly withQ?: string | null;
    readonly animation?: InputAttr<AnimSpec>;
    readonly parentkey?: string;
    readonly parent?: ElementContext<D | unknown>;
    readonly callbacks: ClientCallbacks;
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

export const applyAttrs = <T extends {}, D>(
    context: ElementContext<D>,
    attrFn: (data: D, dataIndex: number, elementIndex: number) => T
) => {
    if (!context.parent) {
        if (context.data !== undefined && context.callbacks.dispatch) {
            // dispatch attributes
            const attrs = attrFn(context.data[0], 0, 0);
            context.callbacks.dispatch({
                attrs: attrs,
                ...(context.animation !== undefined ? { animation: context.animation } : {}),
                ...(context.withQ !== undefined ? { withQ: context.withQ } : {}),
            });
        }
        return;
    }

    const parentAttrFn = (data: D, dataIndex: number) => {
        let dict: { [k: string]: T } = {};
        Object.keys(context.ids).forEach((k, i) => {
            dict[k] =
                context.data !== undefined
                    ? attrFn(context.data[i], i, i) // use current data
                    : attrFn(data, dataIndex, i); // use parent data
        });
        return { [context.parentkey!]: dict };
    };
    // apply attributes on the parent
    applyAttrs(
        {
            ...(context.parent as ElementContext<D>),
            withQ: context.withQ,
            animation: context.animation,
        },
        parentAttrFn
    );
};

export const addElementCallback = <D>(
    context: ElementContext<D>, // with the canvas as its parent
    eventType: keyof ElementCallbacks,
    fn: ElementFn<void, D>
) => {
    const cbs = context.parent!.callbacks;
    const elementKey = context.parentkey! as 'nodes';

    const elementCbDict = { ...cbs[elementKey] };
    context.ids.forEach((k, i) => {
        elementCbDict[k] = {
            ...elementCbDict[k],
            [eventType]: () => evalElementArg(fn, context.data![i], i),
        };
    });

    context.parent!.callbacks[elementKey] = elementCbDict;
};
