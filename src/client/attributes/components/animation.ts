import {
    StringSpec,
    NumSpec,
    ExactStringSpec,
    RecordEntries,
    RecordSpec,
    BoolSpec,
    AttrType,
    EndpointValueSpec,
} from '../spec';
import { FullAttr } from '../derived';

export const animEases = <const>[
    'linear',
    'poly',
    'poly-in',
    'poly-out',
    'poly-in-out',
    'quad',
    'quad-in',
    'quad-out',
    'quad-in-out',
    'cubic',
    'cubic-in',
    'cubic-out',
    'cubic-in-out',
    'sin',
    'sin-in',
    'sin-out',
    'sin-in-out',
    'exp',
    'exp-in',
    'exp-out',
    'exp-in-out',
    'circle',
    'Circle-out',
    'circle-out',
    'circle-in-out',
    'elastic',
    'elastic-in',
    'elastic-out',
    'elastic-in-out',
    'back',
    'back-in',
    'back-out',
    'back-in-out',
    'bounce',
    'bounce-in',
    'bounce-out',
    'bounce-in-out',
];
export type AnimEase = typeof animEases[number];

export type AnimSpec = RecordSpec<{
    readonly duration: NumSpec;
    readonly ease: ExactStringSpec<AnimEase>;
    readonly highlight: BoolSpec;
    readonly linger: NumSpec; // how long to highlight for
}>;

export const animSpec: AnimSpec = {
    type: AttrType.Record,
    entries: {
        duration: { type: AttrType.Number },
        ease: { type: AttrType.String, validValues: animEases },
        highlight: { type: AttrType.Boolean },
        linger: { type: AttrType.Number },
    },
};

export const animDefaults: FullAttr<AnimSpec> = {
    duration: 0.5,
    ease: 'poly',
    highlight: false,
    linger: 0.5,
};

export type WithAnimSpec<T extends EndpointValueSpec> = RecordSpec<
    RecordEntries<AnimSpec> & {
        readonly value: T;
    }
>;

export const withAnimSpec = <T extends EndpointValueSpec>(valueSpec: T): WithAnimSpec<T> => {
    return {
        type: AttrType.Record,
        entries: {
            value: valueSpec,
            ...animSpec.entries,
        },
    };
};
