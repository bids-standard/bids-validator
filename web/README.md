# BIDS Validator web app

This is a web app for running the schema based BIDS validator in the browser. For local development, this is run using deno and uses an esbuild bundle created from the native deno codebase. A bundle is generated in `dist/validator` and used by the otherwise static vite app.

## Running

You need to have Deno v1.28.0 or later installed to run this repo.

Start a dev server:

```
$ deno task dev
```

## Deploy

Build production assets:

```
$ deno task build
```

## Notes

- You need to use `.mjs` or `.mts` extension for the `vite.config.[ext]` file.

## Papercuts

Currently there's a "papercut" for Deno users:

- peer dependencies need to be referenced in `vite.config.js` - in this example
  it is `react` and `react-dom` packages that need to be referenced
