import { terser } from 'rollup-plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as pkg from './package.json';

const env = {
    format: process.env.format,
    min: process.env.min === 'true',
    dev: process.env.mode === 'dev',
};

// the build hangs when these are imported
const serve = env.dev ? require('rollup-plugin-serve').serve : () => null;
const livereload = env.dev ? require('rollup-plugin-livereload').serve : () => null;

const copyright = `// ${pkg.homepage} v${pkg.version} Copyright ${new Date().getFullYear()} ${
    pkg.author.name
}`;

const formatExtension = env.format === 'umd' ? '' : `.${env.format}`;
const fullExtension = env.min ? formatExtension + '.min' : formatExtension;

const mainConfig = {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        entryFileNames: `${pkg.name}${fullExtension}.js`,
        name: pkg.name,
        format: process.env.format,
        banner: copyright,
        sourcemap: true,
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
    plugins: [...(env.min ? [terser()] : []), nodeResolve(), typescript()],
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

const examplesConfig = {
    input: ['examples/basic.ts'],
    output: {
        dir: 'examples/dist',
        name: 'examples',
        format: 'iife',
        globals: {
            '..': 'algorithmx',
        },
        sourcemap: true,
    },
    plugins: [
        typescript({ tsconfig: 'examples/tsconfig.json' }),
        serve({
            open: true,
            contentBase: ['examples', 'dist'],
            port: 8080,
        }),
        livereload(),
    ],
    watch: {
        clearScreen: false,
    },
};

export default env.dev ? [mainConfig, examplesConfig] : mainConfig;
