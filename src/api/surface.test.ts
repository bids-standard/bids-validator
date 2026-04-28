import * as _validate from './validate/mod.ts'
import * as _files from './files/mod.ts'
import * as _filetree from './filetree/mod.ts'
import * as _filesDeno from './files/deno/mod.ts'
import * as _filesBrowser from './files/browser/mod.ts'
import * as _filesGit from './files/git/mod.ts'
import * as _issues from './issues/mod.ts'
import * as _output from './output/mod.ts'
import * as _cli from './cli/mod.ts'
import * as _mainDeprecated from './main/mod.ts'
import * as _optionsDeprecated from './options/mod.ts'

Deno.test('public API surface loads', () => {
  // Reference each namespace so that the imports are treated as value
  // imports rather than type-only imports. If a module is removed or a
  // re-export is dropped the TypeScript compiler will reject this file
  // and CI will fail.
  void [
    _validate,
    _files,
    _filetree,
    _filesDeno,
    _filesBrowser,
    _filesGit,
    _issues,
    _output,
    _cli,
    _mainDeprecated,
    _optionsDeprecated,
  ]
})
