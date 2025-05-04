# Shared Package

This folder contains shared utilities, constants, and functions that are meant to be consumed by other packages in the codebase. Below is an explanation of the exports available in this package:

## Exports

Take a look at the exports fields in `package.json`. You will see all utility in which consuming modules will use.

### Usage

To use any of the exports from this package, import them as follows:

```js
import { BookeraModule, RenderMode } from '@serranolabs.io/shared/module';
```

Unfortunately, HMR does not work. If you want to update something in `shared` you must run `bun run build`
