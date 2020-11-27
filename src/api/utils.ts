import { AnimSpec } from '../client/attributes/components/animation';
import { InputAttr } from '../client/attributes/derived';
import { ReceiveEvent, DispatchEvent } from '../client/types';
import { ElementFn, ElementArg } from './types';

export interface ElementCallbacks {
    readonly click?: () => void;
    readonly hoverin?: () => void;
    readonly hoverout?: () => void;
}

export interface EventCallbacks {
    dispatch?: (event: DispatchEvent) => void;
    receive?: (event: ReceiveEvent) => void;
    messages?: {
        readonly [k: string]: () => void;
    } & {
        readonly '*': (message: string) => void;
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
    readonly callbacks: EventCallbacks;
}

export type ElementObjArg<T, D> =
    | ElementArg<T, D>
    | { readonly [k in keyof T]: ElementArg<T[k], D> };

export const isElementFn = <V, D>(v: ElementArg<V, D>): v is ElementFn<V, D> =>
    typeof v === 'function';

export const evalElementValue = <T, D>(value: ElementArg<T, D>, data: D, index: number): T => {
    if (isElementFn(value)) return value(data, index);
    else return value;
};

export const evalElementDict = <T, D>(dict: ElementObjArg<T, D>, data: D, index: number): T => {
    // evaluate the entire object as a function
    if (isElementFn(dict)) return dict(data, index);
    else {
        if (Object.keys(dict).every((k) => !isElementFn(dict[k as keyof T]))) {
            // simply return the object if it has no function keys
            return dict as T;
        }

        // evaluate each key which has a function
        let newDict = {} as T;
        Object.keys(dict).forEach((k) => {
            newDict[k as keyof T] = evalElementValue(
                dict[k as keyof T] as ElementArg<T[keyof T], D>,
                data,
                index
            );
        });
        return newDict;
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
        context.ids.forEach((k, i) => {
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
            [eventType]: () => evalElementValue(fn, context.data![i], i),
        };
    });

    context.parent!.callbacks[elementKey] = elementCbDict;
};
