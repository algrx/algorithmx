import { createCanvas } from '..';

const canvas = createCanvas('root');
canvas.pause(0.1); // pause for hot reloading
canvas.size([400, 300]);

canvas.nodes([1, 2, 3]).add();
canvas
    .edges([
        [1, 2],
        [2, 3],
        [3, 1],
    ])
    .add();
canvas.pause(0.5);

(window as any).canvas = canvas;
