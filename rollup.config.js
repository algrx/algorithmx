import { terser as pluginTerser } from 'rollup-plugin-terser';
import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginCommonjs from '@rollup/plugin-commonjs';
import pluginTypescript from '@rollup/plugin-typescript';
import * as pkg from './package.json';

const env = {
    format: process.env.format,
    min: process.env.min === 'true',
    dev: process.env.mode === 'dev',
};

// the build hangs when these are imported
const pluginServe = env.dev ? require('rollup-plugin-serve') : () => null;
const pluginLivereload = env.dev ? require('rollup-plugin-livereload') : () => null;

const copyright = `// ${pkg.homepage} v${pkg.version} Copyright ${new Date().getFullYear()} ${
    pkg.author.name
}`;

const formatExtension = env.format === 'umd' ? '' : `.${env.format}`;
const fullExtension = env.min ? formatExtension + '.min' : formatExtension;

const bundleDeps = env.dev;

const mainConfig = {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        entryFileNames: `${pkg.name}${fullExtension}.js`,
        name: pkg.name,
        format: process.env.format,
        banner: copyright,
        sourcemap: true,
        globals: bundleDeps
            ? {}
            : {
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
        ...(env.min ? [pluginTerser()] : []),
        pluginNodeResolve({ browser: env.format === 'iife' }),
        pluginCommonjs(),
        pluginTypescript(),
    ],
    external: bundleDeps
        ? []
        : [
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
    input: ['examples/example.ts'],
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
        pluginTypescript({ tsconfig: 'examples/tsconfig.json' }),
        pluginServe({
            open: true,
            contentBase: ['examples', 'dist'],
            port: 8080,
        }),
        pluginLivereload(),
    ],
    watch: {
        clearScreen: false,
    },
};

export default env.dev ? [mainConfig, examplesConfig] : mainConfig;
