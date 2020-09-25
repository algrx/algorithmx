import {
    StringSpec,
    NumSpec,
    AnyStringSpec,
    RecordEntries,
    RecordSpec,
    BoolSpec,
    AttrType,
} from '../attr-spec';
import { FullAttr } from '../derived-attr';

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
    readonly ease: StringSpec<AnimEase>;
}>;

export const animSpecEntries: RecordEntries<AnimSpec> = {
    duration: { type: AttrType.Number },
    ease: { type: AttrType.String, validValues: animEases },
};

export const defaultAnim: FullAttr<AnimSpec> = {
    duration: 0.5,
    ease: 'poly',
};
