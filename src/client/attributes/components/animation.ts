import {
    StringSpec,
    NumSpec,
    AnyStringSpec,
    Entries,
    RecordSpec,
    BoolSpec,
    AttrType,
} from '../attr-spec';
import { FullAttr } from '../derived-attr';
import * as attrUtils from '../utils';
import * as utils from '../../utils';

export const animTypes = <const>['none', 'normal'];
export type AnimType = typeof animTypes[number];

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
    readonly animType: StringSpec<AnimType>;
    readonly duration: NumSpec;
    readonly ease: StringSpec<AnimEase>;
    readonly highlight: BoolSpec;
    readonly linger: NumSpec;
}>;

export const animSpecEntries: Entries<AnimSpec> = {
    animType: { type: AttrType.String, validValues: animTypes },
    duration: { type: AttrType.Number },
    ease: { type: AttrType.String, validValues: animEases },
    highlight: { type: AttrType.Boolean },
    linger: { type: AttrType.Number },
};

export const defaultAnim: FullAttr<AnimSpec> = {
    animType: 'normal',
    duration: 0.5,
    ease: 'poly',
    highlight: false,
    linger: 0.5,
};
