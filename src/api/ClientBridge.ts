import { Client } from './types/client';
import { ClassBuilder } from './utils';
import { ReceiveEvent, DispatchEvent, Canvas } from '../client/types/events';
import { canvasSelection } from './CanvasSelection';
import * as realClient from '../client/client';
import * as utils from './utils';

interface ClientBridgeContext {
    readonly realClient: realClient.Client;
    readonly realCanvas: Canvas;
    /* tslint:disable */
    readonly subscriptions: Array<(event: ReceiveEvent) => void>;
    /* tslint:enable */
}

const builder: ClassBuilder<Client, ClientBridgeContext> = (context, self) => ({
    dispatch: (event) => {
        context.realClient.dispatch(event);
    },
    subscribe: (listener) => {
        context.subscriptions.push(listener);
        context.realClient.onReceive((event) => {
            context.subscriptions.forEach((fn) => fn(event));
        });
    },
    canvas: () => {
        return canvasSelection(context.realCanvas, self());
    },
});

export const client = (canvas: Canvas): Client => {
    const context: ClientBridgeContext = {
        realClient: realClient.client(canvas),
        realCanvas: canvas,
        subscriptions: [],
    };
    return utils.build(builder, context);
};
