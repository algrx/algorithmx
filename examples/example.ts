import { createCanvas } from '..';

const canvas = createCanvas('root');
canvas.pause(0.1); // pause for hot reloading
canvas.size([400, 300]);

canvas.nodes([1, 2, 3, 4, 5, 6, 7]).add();
canvas
    .edges([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
        [1, 3],
        [2, 4],
        [2, 7],
    ])
    .add();

(window as any).canvas = canvas;
