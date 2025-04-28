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
      minify: true,
      lib: {
          entry: {
            'base': resolve(__dirname, 'src/base.css.ts'),
            'root': resolve(__dirname, 'src/root.css'),
            'util': resolve(__dirname, 'src/model/util.ts'),
            'lit': resolve(__dirname, 'src/model/lit.ts'),
            'module/module': resolve(__dirname, 'src/module/module.ts'),
            'module/tab': resolve(__dirname, 'src/module/tab.ts'),
            'module/module-element': resolve(__dirname, 'src/module/module-element.ts'),
          },
          name: 'bookera-themes',
          formats: ['es'],
          terserOptions: {
            keep_classnames: true,
          },
      },
      target: 'esnext',
      cssCodeSplit: true,
  },
});