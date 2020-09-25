import { ReceiveEvent, DispatchEvent } from '../client/types';
import { ElementAttrs, ElementFn } from './types';
import { ElementContext, evalElementArg } from './ElementSelection';

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

export interface CallbackHandler {
    _callbacks: ClientCallbacks;
}

export const addElementCallback = <D>(
    selection: ElementContext<D>, // with the canvas as its parent
    eventType: keyof ElementCallbacks,
    fn: ElementFn<void, D>
) => {
    const client = (selection.parent![1] as unknown) as CallbackHandler;
    const elementType = selection.parent![0] as 'nodes';

    const elementCbs = {} as { [k: string]: ElementCallbacks };
    selection.ids.forEach((k, i) => {
        elementCbs[k] = {
            ...(client._callbacks[elementType][k] ?? {}),
            [eventType]: () => evalElementArg(fn, selection.data![i], i),
        };
    });

    client._callbacks = {
        ...client._callbacks,
        [elementType]: {
            ...client._callbacks[elementType],
            ...elementCbs,
        },
    };
};

export const execCallbacks = (cbs: ClientCallbacks, event: ReceiveEvent) => {
    // event callback
    if (cbs.onreceive) cbs.onreceive(event);

    // message callbacks
    if (event.message && cbs.messages) {
        if ('*' in cbs.messages) cbs.messages['*']!(event.message);
        if (event.message in cbs.messages) cbs.messages[event.message]();
    }

    // node click/hover callbacks
    const elementEventTypes = <const>['click', 'hoverin', 'hoverout'];
    const elementTypes = <const>['nodes'];

    elementTypes.forEach((elementType) => {
        if (!(elementType in event && elementType in cbs)) return;

        Object.entries(event[elementType]!).forEach(([k, elementEvents]) => {
            Object.keys(elementEvents).forEach((eventType) => {
                if (k in cbs.nodes && eventType in cbs[elementType][k])
                    cbs[elementType][k][eventType as keyof ElementCallbacks]!();
            });
        });
    });
};
