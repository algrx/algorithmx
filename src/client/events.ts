import {
    CanvasSpec,
    canvasSpec,
    createCanvasDefaults,
    evalCanvasChanges,
} from './attributes/components/canvas';
import { AnimSpec, animSpec } from './attributes/components/animation';
import {
    InputAttr,
    FullAttr,
    PartialAttr,
    PartialEvalAttr,
    FullEvalAttr,
} from './attributes/derived';
import { preprocess } from './attributes/preprocess';
import { AttrType } from './attributes/spec';
import { CanvasElement, ClientState, ReceiveEvent, DispatchEvent } from './types';
import {
    adjustEdgeIds,
    applyDefaults,
    mergeChanges,
    fillStarKeys,
    addVisible,
    mergeExprs,
    removeEdgesWithNodes,
    checkInvalidEdges,
} from './attributes/transform';
import { updateCanvasLayout, resetLayout } from './layout/canvas';
import { renderCanvas } from './render/canvas';

export interface EventContext {
    readonly state: ClientState;
    readonly canvasEl: CanvasElement;
    readonly receive: (event: ReceiveEvent) => void;
    readonly tick: () => void;
}

type TransformFn = (
    p: FullAttr<CanvasSpec> | undefined,
    c: PartialAttr<CanvasSpec>
) => PartialAttr<CanvasSpec>;

// after preprocess, before defaults
const preTransformFns: ReadonlyArray<TransformFn> = [
    (p, c) => fillStarKeys(canvasSpec, p, c),
    adjustEdgeIds,
    (p, c) => addVisible(canvasSpec, p, c),
];

// after defaults, before evaluation
const postTransformFns: ReadonlyArray<TransformFn> = [removeEdgesWithNodes];

const updateAttrs = (
    context: EventContext,
    inputChanges: InputAttr<CanvasSpec>,
    inputDefaults?: InputAttr<AnimSpec>
): ClientState => {
    const state = context.state;
    const prevAttrs = state.attributes;

    // preprocess the attribute changes changes
    const preprocChanges = preprocess(
        canvasSpec,
        { path: [['canvas', AttrType.Record]], validVars: [] },
        inputChanges
    );
    if (preprocChanges instanceof Error) {
        context.receive({ error: { type: 'attribute', message: preprocChanges.message } });
        return state;
    }

    // preprocess the attribute animation defaults
    const animation = preprocess(
        animSpec,
        { path: [['animation', AttrType.Record]], validVars: [] },
        inputDefaults ?? {}
    );
    if (animation instanceof Error) {
        context.receive({ error: { type: 'attribute', message: animation.message } });
        return state;
    }

    // apply transformations
    const preTransformedChanges = preTransformFns.reduce(
        (acc, fn) => fn(prevAttrs, acc),
        preprocChanges
    );

    // apply defaults
    const changesWithDefaults = applyDefaults(canvasSpec, prevAttrs, preTransformedChanges, [
        createCanvasDefaults(prevAttrs, preTransformedChanges),
        animation,
    ]);

    // apply more transformations
    const postTransformedChanges = postTransformFns.reduce(
        (acc, fn) => fn(prevAttrs, acc),
        changesWithDefaults
    );

    // validate the changes
    const validationError = checkInvalidEdges(prevAttrs, changesWithDefaults);
    if (validationError !== undefined) {
        context.receive({ error: { type: 'validation', message: validationError.message } });
        return state;
    }

    // evaluate expressions
    const changesWithoutSelfRef = evalCanvasChanges({
        prevAttrs,
        prevExprs: state.expressions,
        changes: postTransformedChanges,
        selfRefOnly: true,
        parentVars: {},
    });
    const fullChanges = evalCanvasChanges({
        prevAttrs,
        prevExprs: state.expressions,
        changes: changesWithoutSelfRef,
        selfRefOnly: false,
        parentVars: {},
    }) as PartialEvalAttr<CanvasSpec>;

    // merge all changes with previous attributes
    const newAttrs = mergeChanges(canvasSpec, prevAttrs, fullChanges) as
        | FullEvalAttr<CanvasSpec>
        | undefined;
    const newExprs =
        mergeExprs(canvasSpec, state.expressions, changesWithoutSelfRef) ??
        ({} as PartialEvalAttr<CanvasSpec>);

    // update layout
    const newLayout = newAttrs
        ? updateCanvasLayout(state.layout, newAttrs, fullChanges)
        : resetLayout(state.layout);

    // render the canvas
    const newRenderState = renderCanvas(
        context.canvasEl,
        {
            state: state.render,
            layout: newLayout,
            receive: context.receive,
            tick: context.tick,
        },
        newAttrs,
        fullChanges
    );

    return {
        ...state,
        attributes: newAttrs,
        expressions: newExprs,
        layout: newLayout,
        render: newRenderState,
    };
};

export const executeEvent = (context: EventContext, event: DispatchEvent): ClientState => {
    if (event.message !== undefined) {
        context.receive({ message: event.message });
    }

    const attrState =
        event.attrs !== undefined
            ? updateAttrs(context, event.attrs, event.animation)
            : context.state;

    return attrState;
};
