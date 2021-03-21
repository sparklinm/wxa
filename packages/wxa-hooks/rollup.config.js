import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
const isDev = process.env.NODE_ENV !== 'production';

import babel from 'rollup-plugin-babel';
import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';
// import { eslint } from 'rollup-plugin-eslint'

export default {
    input: 'lib/index.ts',
    // output: {
    //   file: (!isDev && 'bundle.min.js') || 'bundle.js',
    //   format: 'umd',
    //   name: 'util'
    // },
    output: [
        {
            file: (!isDev && pkg.main) || 'dist/hooks.cjs.js',
            format: 'cjs',
        },
        {
            file: (!isDev && pkg.module) || 'dist/hooks.esm.js',
            format: 'esm',
        },
        {
            file: (!isDev && pkg.browser) || 'dist/hooks.umd.js',
            format: 'umd',
            name: 'util',
        },
    ],
    plugins: [
        resolve(),
        commonjs({
            namedExports: {
                // 对应 module ：name
                '@wxa/core': ['diff'],
            },
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'ESNext',
                },
            },
        }),
        babel({
            exclude: 'node_modules/**', // 只编译我们的源代码
            runtimeHelpers: true,
            extensions: [
                '.ts',
                '.tsx',
                '.js',
            ],
        }),
        !isDev && terser(),
    ],
    // external: ['jquery']
};
