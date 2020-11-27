export const angleToRad = (angleDeg: number) => (angleDeg * Math.PI) / 180;
export const angleToDeg = (angleRad: number) => (angleRad * 180) / Math.PI;

export const restrictAngle = (angle: number) =>
    (angle < 0 ? Math.PI * 2 - (-angle % (Math.PI * 2)) : angle) % (Math.PI * 2);

export const radiusAtAngleRect = (angle: number, rx: number, ry: number) => {
    const a = restrictAngle(angle);
    const cornerAngle = Math.atan2(ry, rx);
    if (a >= 0 && a < cornerAngle) {
        return rx / Math.cos(a);
    } else if (a >= cornerAngle && a < Math.PI - cornerAngle) {
        return ry / Math.cos(a - Math.PI / 2);
    } else if (a >= Math.PI - cornerAngle && a < Math.PI + cornerAngle) {
        return rx / Math.cos(a - Math.PI);
    } else if (a >= Math.PI + cornerAngle && a < Math.PI * 2 - cornerAngle) {
        return ry / Math.cos(a - (Math.PI * 3) / 2);
    } else return rx / Math.cos(Math.PI * 2 - a);
};

export const rotate = ([x, y]: [number, number], angle: number): [number, number] => [
    x * Math.cos(angle) - y * Math.sin(angle),
    y * Math.cos(angle) + x * Math.sin(angle),
];

export const translate = (
    [x, y]: [number, number],
    [tx, ty]: [number, number]
): [number, number] => [x + tx, y + ty];
