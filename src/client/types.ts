import { InputAttr, FullAttr } from './attributes/derived-attr';
import { CanvasSpec } from './attributes/components/canvas';
import { CommonSpec } from './attributes/components/common';
import { SchedulerState } from './scheduler';

export type CanvasElement = string | Element;

// dispatched from the API, to the client
export interface DispatchEvent {
    readonly attrs?: InputAttr<CanvasSpec>;
    readonly defaultattr?: InputAttr<CommonSpec>;
    readonly message?: string;
    readonly withQ?: string | number | null;
    readonly queues?: {
        readonly [k: string]: {
            readonly action: 'stop' | 'start' | 'clear' | 'pause';
            readonly duration?: number; // only for pause
        };
    };
}

// recieved by the API, from the client
export interface ReceiveEvent {
    readonly error?: {
        readonly type: 'attribute' | 'unknown';
        readonly message: string;
    };
    readonly message?: string;
    readonly nodes?: {
        readonly [k: string]: {
            readonly click?: boolean;
            readonly hoverin?: boolean;
            readonly hoverout?: boolean;
        };
    };
}

export interface ClientState {
    readonly scheduler: SchedulerState;
    readonly attributes?: FullAttr<CanvasSpec>;
    //readonly renderBehavior?: RenderBehavior;
}
