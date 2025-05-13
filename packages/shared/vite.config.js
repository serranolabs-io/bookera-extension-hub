import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import babel from 'vite-plugin-babel'

export default defineConfig({
  plugins: [
    dts(),
    babel({
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: [
          [
            "@babel/plugin-proposal-decorators",
            { loose: true, version: "2022-03" },
          ],
        ],
      },
    }),
  ],
  build: {
      minify: false,
      resolve: {
        conditions: ['production']
      },
      lib: {
          entry: {
            'base': resolve(__dirname, 'src/base.css.ts'),
            'root': resolve(__dirname, 'src/root.css'),
            'util': resolve(__dirname, 'src/model/util.ts'),
            'lit': resolve(__dirname, 'src/model/lit.ts'),
            'panel': resolve(__dirname, 'src/model/panel.ts'),
            'module/module': resolve(__dirname, 'src/module/module.ts'),
            'module/tab': resolve(__dirname, 'src/module/tab.ts'),
            'module/module-element': resolve(__dirname, 'src/module/module-element.ts'),
            'keyboard-shortcuts': resolve(__dirname, 'src/model/keyboard-shortcuts/model.ts'),
          },
          name: 'shared',
          formats: ['es'],
          terserOptions: {
            // this is why we need to use rollup instead of esbuild
            keep_classnames: true,
          },
      },
      target: 'esnext',
      cssCodeSplit: true,
  },
});