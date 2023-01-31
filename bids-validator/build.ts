#!/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --allow-run
/**
 * Build the schema based validator for distribution (web and npm), targets browser compatible ESM
 *
 * If you would like to use this package in a Node.js project, you'll need to use native ESM or a transform system
 */
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.5/mod.js'
import { parse } from 'https://deno.land/std@0.175.0/flags/mod.ts'

const MAIN_ENTRY = 'src/main.ts'

const flags = parse(Deno.args, {
  boolean: ['minify'],
  default: { minify: false },
})

const result = await esbuild.build({
  format: 'esm',
  entryPoints: [MAIN_ENTRY],
  bundle: true,
  outdir: 'dist/validator',
  minify: flags.minify,
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
