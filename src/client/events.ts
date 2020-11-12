import {
    CanvasSpec,
    canvasSpec,
    createCanvasDefaults,
    evalCanvasChanges,
} from './attributes/components/canvas';
import { AnimSpec, animSpec } from './attributes/components/animation';
import { InputAttr, FullAttr, PartialAttr } from './attributes/derived';
import { preprocess } from './attributes/preprocess';
import { AttrType } from './attributes/spec';
import { CanvasElement, ClientState, ReceiveEvent, DispatchEvent } from './types';
import {
    removeInvalidEdges,
    adjustEdgeIds,
    applyDefaults,
    mergeChanges,
    fillStarKeys,
    addVisible,
    mergeExprs,
} from './attributes/transform';
import { updateCanvasLayout, resetLayout } from './layout/canvas';
import { renderCanvas } from './render/canvas';

export interface EventContext {
    readonly state: ClientState;
    readonly canvasElement: CanvasElement;
    readonly receive: (event: ReceiveEvent) => void;
    readonly tick: () => void;
}

const updateAttrs = (
    context: EventContext,
    inputChanges: InputAttr<CanvasSpec>,
    inputDefaults?: InputAttr<AnimSpec>
): ClientState => {
    const state = context.state;

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
    //console.log(inputAttrs)

    // apply some transformations
    type TransformFn = (
        p: FullAttr<CanvasSpec> | undefined,
        c: PartialAttr<CanvasSpec>
    ) => PartialAttr<CanvasSpec>;
    const transformFns: ReadonlyArray<TransformFn> = [
        (p, c) => fillStarKeys(canvasSpec, p, c),
        removeInvalidEdges,
        adjustEdgeIds,
        (p, c) => addVisible(canvasSpec, p, c),
    ];
    //console.log(preprocChanges);
    const prevAttrs = state.attributes;
    const transformedChanges = transformFns.reduce((acc, fn) => fn(prevAttrs, acc), preprocChanges);

    // apply defaults
    const changesWithDefaults = applyDefaults(canvasSpec, prevAttrs, transformedChanges, [
        createCanvasDefaults(prevAttrs, transformedChanges),
        animation,
    ]);

    // evaluate expressions
    const changesWithoutSelfRef = evalCanvasChanges({
        prevAttrs,
        prevExprs: state.expressions,
        changes: changesWithDefaults,
        selfRefOnly: true,
        parentVars: {},
    });
    const fullChanges = evalCanvasChanges({
        prevAttrs,
        prevExprs: state.expressions,
        changes: changesWithoutSelfRef,
        selfRefOnly: false,
        parentVars: {},
    });

    // merge all changes with previous attributes
    const newAttrs = mergeChanges(canvasSpec, prevAttrs, fullChanges);
    const newExprs = mergeExprs(canvasSpec, state.expressions, changesWithoutSelfRef) ?? {};

    // update layout
    const newLayout = newAttrs
        ? updateCanvasLayout(state.layout, newAttrs, fullChanges)
        : resetLayout(state.layout);

    // render the canvas
    const newRenderState = renderCanvas(
        context.canvasElement,
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
