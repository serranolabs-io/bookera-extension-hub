import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import babel from 'vite-plugin-babel';

export default defineConfig({
  server: {
    port: 3000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
  plugins: [
    dts(),
    babel({
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            { loose: true, version: '2022-03' },
          ],
        ],
      },
    }),
  ],
  build: {
    minify: 'terser',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'bookera-keyboard-shortcuts',
      formats: ['es'],
    },
    target: 'esnext',
    terserOptions: {
      keep_classnames: true,
    },
  },
  // resolve: {
  //   alias: {
  //     // Ensure the shared package is resolved locally
  //     '@serranolabs.io/shared': resolve(__dirname, '../../shared/src'),
  //   },
  // },
});
