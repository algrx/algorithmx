module.exports = (config) => {
    config.set({
        basePath: '',
        frameworks: ['karma-typescript', 'mocha', 'chai'],
        files: [
            'node_modules/webcola/WebCola/cola.js',
            'node_modules/d3-color/dist/d3-color.js',
            'node_modules/d3-dispatch/dist/d3-dispatch.js',
            'node_modules/d3-drag/dist/d3-drag.js',
            'node_modules/d3-ease/dist/d3-ease.js',
            'node_modules/d3-interpolate/dist/d3-interpolate.js',
            'node_modules/d3-path/dist/d3-path.js',
            'node_modules/d3-selection/dist/d3-selection.js',
            'node_modules/d3-shape/dist/d3-shape.js',
            'node_modules/d3-timer/dist/d3-timer.js',
            'node_modules/d3-transition/dist/d3-transition.js',
            'node_modules/d3-zoom/dist/d3-zoom.js',
            'src/**/*.ts',
            'tests/**/*.ts',
        ],
        exclude: [],
        client: {
            mocha: {
                reporter: 'html',
            },
        },
        preprocessors: {
            '**/*.ts': ['karma-typescript'],
        },
        karmaTypescriptConfig: {
            coverageOptions: {
                exclude: /tests/,
            },
            reports: {
                lcovonly: {
                    directory: 'coverage',
                    filename: 'lcov.info',
                    subdirectory: '.',
                },
                json: {
                    directory: 'coverage',
                    filename: 'coverage-final.json',
                    subdirectory: '.',
                },
                html: {
                    directory: 'coverage',
                    subdirectory: '.',
                },
            },
            compilerOptions: {
                module: 'commonjs',
            },
            include: ['src/**/*.ts', 'tests/**/*.ts'],
            tsconfig: './tsconfig.json',
        },

        reporters: ['mocha', 'karma-typescript'],

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        customLaunchers: {
            ChromeCustom: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
        },
        browsers: ['ChromeCustom'],
        singleRun: true,
        concurrency: Infinity,
    });
};
