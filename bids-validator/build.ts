#!/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --allow-run
/**
 * Build the schema based validator for distribution (web and npm), targets browser compatible ESM
 *
 * If you would like to use this package in a Node.js project, you'll need to use native ESM or a transform system
 */
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.5/mod.js'
import { parse } from 'https://deno.land/std@0.175.0/flags/mod.ts'

const MAIN_ENTRY = 'src/main.ts'
const CLI_ENTRY = 'src/bids-validator.ts'

const httpPlugin = {
  name: 'http',
  setup(build: esbuild.PluginBuild) {
    build.onResolve({ filter: /^https?:\/\// }, (args) => ({
      path: args.path,
      namespace: 'http-url',
    }))

    build.onResolve({ filter: /.*/, namespace: 'http-url' }, (args) => ({
      path: new URL(args.path, args.importer).toString(),
      namespace: 'http-url',
    }))

    build.onLoad({ filter: /.*/, namespace: 'http-url' }, async (args) => {
      const request = await fetch(args.path)
      const contents = await request.text()
      if (args.path.endsWith('.ts')) {
        return { contents, loader: 'ts' }
      } else if (args.path.endsWith('.json')) {
        return { contents, loader: 'json' }
      } else {
        return { contents, loader: 'js' }
      }
    })
  },
}

const flags = parse(Deno.args, {
  boolean: ['minify'],
  default: { minify: false },
})

const result = await esbuild.build({
  format: 'esm',
  entryPoints: [MAIN_ENTRY, CLI_ENTRY],
  bundle: true,
  outdir: 'dist/validator',
  minify: flags.minify,
  target: ['chrome109', 'firefox109', 'safari16'],
  plugins: [httpPlugin],
  allowOverwrite: true,
  sourcemap: flags.minify ? false : 'inline',
})

if (result.warnings.length > 0) {
  console.warn('Build reported warnings')
  console.dir(result.warnings)
}

if (result.errors.length === 0) {
  Deno.exit(0)
} else {
  console.error(`An issue occurred building '${MAIN_ENTRY}'`)
  console.dir(result.errors)
  Deno.exit(1)
}
