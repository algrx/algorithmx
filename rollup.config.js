import { uglify } from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import * as pkg from './package.json';

const FORMAT = process.env.format;
const MIN = process.env.min === 'true';

const copyright = `// ${pkg.homepage} v${pkg.version} Copyright ${new Date().getFullYear()} ${
    pkg.author.name
}`;

const formatExtension = FORMAT === 'umd' ? '' : `.${FORMAT}`;
const fullExtension = MIN ? formatExtension + '.min' : formatExtension;

export default {
    input: 'src/index.ts',
    output: {
        file: `dist/${pkg.name}${fullExtension}.js`,
        name: pkg.name,
        format: process.env.format,
        banner: copyright,
        globals: {
            webcola: 'cola',
            'd3-color': 'd3',
            'd3-dispatch': 'd3',
            'd3-drag': 'd3',
            'd3-ease': 'd3',
            'd3-interpolate': 'd3',
            'd3-path': 'd3',
            'd3-selection': 'd3',
            'd3-shape': 'd3',
            'd3-timer': 'd3',
            'd3-transition': 'd3',
            'd3-zoom': 'd3',
        },
    },
    plugins: [
        ...(MIN ? [uglify()] : []),
        nodeResolve({ jsnext: true }),
        typescript({ useTsconfigDeclarationDir: true }),
    ],
    external: [
        'webcola',
        'd3-color',
        'd3-drag',
        'd3-dispatch',
        'd3-drag',
        'd3-ease',
        'd3-interpolate',
        'd3-path',
        'd3-selection',
        'd3-shape',
        'd3-timer',
        'd3-transition',
        'd3-zoom',
    ],
};
