import { assert, assertEquals } from '@std/assert'
import { dirname, fromFileUrl, join } from '@std/path'
import { pathsToTree } from '../files/filetree.test.ts'
import type { BIDSFile } from '../types/filetree.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { validate } from './bids.ts'
import { StringOpener } from '../files/openers.test.ts'
import { RejectingFileOpener } from '../files/openers.ts'
import { annexIssue } from '../files/annexKey.ts'
import { loadJSON } from '../files/json.ts'
import { loadTSV } from '../files/tsv.ts'
import { readBytes, readText } from '../files/access.ts'
import { readFileTree } from '../files/deno.ts'
import { hashDirMixed } from '../files/repo.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import {
  addAnnexRemote,
  annexFetchStub,
  hasGit,
  isWindows,
  withRepo,
  writeAnnexObject,
} from '../files/utils.test.ts'

const dataset = pathsToTree([
  '/dataset_description.json',
  '/sub-01/anat/sub-01_T1w.nii.gz',
])

Deno.test('Smoke tests of main validation function', async (t) => {
  await t.step('Validating trivial with blacklist', async () => {
    let result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MRI'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG', 'MRI'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)
  })
  await t.step('Validate configuration', async () => {
    const result = await validate(
      dataset,
      {
        datasetPath: '/dataset',
        debug: 'INFO',
        blacklistModalities: [],
        datasetTypes: [],
      },
      {
        ignore: [{ location: '/dataset_description.json' }],
      },
    )
    const errors = result.issues.filter({ severity: 'error' })
    const warnings = result.issues.filter({ severity: 'warning' })
    const ignored = result.issues.filter({ severity: 'ignore' })
    assert(errors.get({ code: 'JSON_KEY_RECOMMENDED' }).length === 0)
    assert(ignored.get({ code: 'JSON_KEY_RECOMMENDED' }).length > 0)
    assert(errors.get({ location: '/dataset_description.json' }).length === 0)
    assert(warnings.get({ location: '/dataset_description.json' }).length === 0)
  })
})

function datasetFrom(files: Record<string, string>) {
  const tree = pathsToTree(Object.keys(files))
  for (const [path, contents] of Object.entries(files)) {
    const file = tree.get(path.slice(1)) as BIDSFile
    file.opener = new StringOpener(contents)
  }
  return tree
}

Deno.test('Loader issues are reported at the failing file', async (t) => {
  const DD = '{"Name": "Test", "BIDSVersion": "1.10.0", "Authors": ["A"]}'
  const options = {
    datasetPath: '/dataset',
    debug: 'ERROR' as const,
    blacklistModalities: [],
    datasetTypes: [],
  }

  await t.step('invalid dataset_description.json', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': '{"Name": ',
      '/sub-01/anat/sub-01_T1w.nii.gz': '',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assert(issues.get({ code: 'JSON_INVALID', location: '/dataset_description.json' }).length > 0)
  })

  await t.step('unreadable NIfTI header and invalid sidecar', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/anat/sub-01_T1w.nii.gz': 'not a nifti',
      '/sub-01/anat/sub-01_T1w.json': '{"a": 1]',
    })
    const { issues } = await validate(tree, options)
    assertEquals(
      issues.get({
        code: 'NIFTI_HEADER_UNREADABLE',
        location: '/sub-01/anat/sub-01_T1w.nii.gz',
      }).length,
      1,
    )
    const invalid = issues.get({ code: 'JSON_INVALID' })
    assertEquals(invalid.length, 1)
    assertEquals(invalid[0].location, '/sub-01/anat/sub-01_T1w.json')
  })

  await t.step('ambiguous inheritance', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/T1w.json': '{}',
      '/acq-MPRAGE_T1w.json': '{}',
      '/sub-01/anat/sub-01_acq-MPRAGE_T1w.nii.gz': '',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assertEquals(
      issues.get({ code: 'MULTIPLE_INHERITABLE_FILES', location: '/T1w.json' }).length,
      1,
    )
    assertEquals(issues.get({ code: 'MULTIPLE_INHERITABLE_FILES' }).length, 1)
  })

  await t.step('ragged events.tsv', async () => {
    const events = '/sub-01/func/sub-01_task-rest_events.tsv'
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/func/sub-01_task-rest_bold.nii.gz': '',
      [events]: 'onset\tduration\n1\t2\n3\n',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assertEquals(issues.get({ code: 'TSV_EQUAL_ROWS', location: events }).length, 1)
    assertEquals(issues.get({ code: 'TSV_EQUAL_ROWS' }).length, 1)
  })

  await t.step('ragged .bvec', async () => {
    const bvec = '/sub-01/dwi/sub-01_dwi.bvec'
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/dwi/sub-01_dwi.nii.gz': '',
      '/sub-01/dwi/sub-01_dwi.bval': '0 1000\n',
      [bvec]: '0 1\n0 1\n0\n',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    const found = issues.get({ code: 'BVEC_ROW_LENGTH', location: bvec })
    assertEquals(found.length, 1)
    assertEquals(found[0].severity, 'error')
    assertEquals(issues.get({ code: 'BVEC_ROW_LENGTH' }).length, 1)
  })
})

Deno.test('Unresolvable dataset_description.json is reported once', async () => {
  loadJSON.cache.clear()
  const tree = datasetFrom({
    '/dataset_description.json': '',
    '/sub-01/anat/sub-01_T1w.nii.gz': '',
  })
  const dd = tree.get('dataset_description.json') as BIDSFile
  dd.opener = new RejectingFileOpener(
    16,
    annexIssue('UNLOCKED_ANNEX_DATA', 'MD5E-s16--0123456789abcdef0123456789abcdef.json'),
  )
  const { issues } = await validate(tree, {
    datasetPath: '/dataset',
    debug: 'ERROR' as const,
    ignoreNiftiHeaders: true,
    blacklistModalities: [],
    datasetTypes: [],
  })
  const found = issues.get({ code: 'UNLOCKED_ANNEX_DATA' })
  assertEquals(found.length, 1)
  assertEquals(found[0].location, '/dataset_description.json')
  loadJSON.cache.clear()
})

/** A valid 352-byte NIfTI-1 header. */
const nifti = await Deno.readFile(
  fromFileUrl(
    new URL(
      '../../tests/data/valid_dataset/sub-05/ses-02/anat/sub-05_ses-02_T1w.nii',
      import.meta.url,
    ),
  ),
)

/** A file committed to git-annex, as an annex link or as a pointer (unlocked) file. */
interface Annexed {
  annex: 'link' | 'pointer'
  key: string
}

let keyCount = 0
/** A git-annex key for `content`, with a made-up hash unique within this module. */
function annexKey(content: string | Uint8Array, ext: string): string {
  const size = typeof content === 'string'
    ? new TextEncoder().encode(content).length
    : content.length
  return `MD5E-s${size}--${String(++keyCount).padStart(32, '0')}${ext}`
}

/** Write `files`, by dataset path, under `root`. */
async function writeDataset(
  root: string,
  files: Record<string, string | Uint8Array | Annexed>,
): Promise<void> {
  for (const [path, file] of Object.entries(files)) {
    const fullPath = join(root, path)
    await Deno.mkdir(dirname(fullPath), { recursive: true })
    if (typeof file === 'string') {
      await Deno.writeTextFile(fullPath, file)
    } else if (file instanceof Uint8Array) {
      await Deno.writeFile(fullPath, file)
    } else if (file.annex === 'pointer') {
      await Deno.writeTextFile(fullPath, `/annex/objects/${file.key}\n`)
    } else {
      const up = '../'.repeat(path.replace(/^\//, '').split('/').length - 1)
      await Deno.symlink(`${up}.git/annex/objects/xx/yy/${file.key}/${file.key}`, fullPath)
    }
  }
}

async function withDataset(
  files: Record<string, string | Uint8Array | Annexed>,
  test: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir()
  try {
    await writeDataset(root, files)
    await test(root)
  } finally {
    await Deno.remove(root, { recursive: true })
  }
}

const gitPrune = new FileIgnoreRules(['.git', '.git/**'], false)

/** Validate the dataset at `root`, read with {@link readFileTree}. */
async function validateDir(root: string, allowUnlockedData = false): Promise<DatasetIssues> {
  for (const cache of [loadJSON.cache, loadTSV.cache, readBytes.cache, readText.cache]) {
    cache.clear()
  }
  const tree = await readFileTree(root, gitPrune, undefined, allowUnlockedData)
  const { issues } = await validate(tree, {
    datasetPath: root,
    debug: 'ERROR',
    blacklistModalities: [],
    datasetTypes: [],
  })
  return issues
}

/** The sorted codes of the errors at `location`. */
function codesAt(issues: DatasetIssues, location: string): string[] {
  return issues.get({ location, severity: 'error' }).map((issue) => issue.code).sort()
}

const description = '{"Name": "annex", "BIDSVersion": "1.10.0", "Authors": ["A"]}'
const pointer = (ext: string): Annexed => ({ annex: 'pointer', key: annexKey(nifti, ext) })

Deno.test({
  name: 'Annexed content that fails to fetch is reported once per file',
  ignore: !hasGit || isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const anat = '/sub-01/anat/sub-01_T1w'
  const sidecar = '{"Manufacturer": "x"}'
  const niiKey = annexKey(nifti, '.nii.gz')
  const jsonKey = annexKey(sidecar, '.json')
  await withRepo(
    (repo) =>
      writeDataset(repo, {
        'dataset_description.json': description,
        [`${anat}.nii.gz`]: { annex: 'link', key: niiKey },
        [`${anat}.json`]: { annex: 'link', key: jsonKey },
      }),
    async (repo) => {
      await addAnnexRemote(repo, {
        [niiKey]: `${anat.slice(1)}.nii.gz`,
        [jsonKey]: `${anat.slice(1)}.json`,
      })
      // Every fetch fails, without using the network
      using _ = annexFetchStub({})
      const issues = await validateDir(repo)
      assertEquals(codesAt(issues, `${anat}.nii.gz`), ['UNAVAILABLE_ANNEX_DATA'])
      assertEquals(codesAt(issues, `${anat}.json`), ['UNAVAILABLE_ANNEX_DATA'])
    },
  )
})

Deno.test('Unlocked annex files skip checks of their content', async (t) => {
  const func = '/sub-01/func/sub-01_task-x'

  await t.step('bold NIfTI with a complete sidecar', async () => {
    await withDataset({
      'dataset_description.json': description,
      [`${func}_bold.nii`]: pointer('.nii'),
      [`${func}_bold.json`]: '{"TaskName": "x", "RepetitionTime": 2}',
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, `${func}_bold.nii`), ['UNLOCKED_ANNEX_DATA'])
    })
  })

  await t.step('dataset_description.json', async () => {
    await withDataset({
      'dataset_description.json': pointer('.json'),
      'sub-01/anat/sub-01_T1w.nii': nifti,
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, '/dataset_description.json'), ['UNLOCKED_ANNEX_DATA'])
    })
  })

  await t.step('participants.tsv', async () => {
    await withDataset({
      'dataset_description.json': description,
      'participants.tsv': pointer('.tsv'),
      'sub-01/anat/sub-01_T1w.nii': nifti,
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, '/participants.tsv'), ['UNLOCKED_ANNEX_DATA'])
    })
  })

  await t.step('events.tsv', async () => {
    await withDataset({
      'dataset_description.json': description,
      [`${func}_bold.nii`]: nifti,
      [`${func}_bold.json`]: '{"TaskName": "x", "RepetitionTime": 2}',
      [`${func}_events.tsv`]: pointer('.tsv'),
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, `${func}_events.tsv`), ['UNLOCKED_ANNEX_DATA'])
    })
  })
})

Deno.test('Unlocked annex files keep checks of other files', async (t) => {
  await t.step('bold NIfTI whose sidecar lacks TaskName', async () => {
    const bold = '/sub-01/func/sub-01_task-x_bold'
    await withDataset({
      'dataset_description.json': description,
      [`${bold}.nii`]: pointer('.nii'),
      [`${bold}.json`]: '{"RepetitionTime": 2}',
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, `${bold}.nii`), ['SIDECAR_KEY_REQUIRED', 'UNLOCKED_ANNEX_DATA'])
    })
  })

  await t.step('DWI NIfTI without .bvec', async () => {
    const dwi = '/sub-01/dwi/sub-01_dwi'
    await withDataset({
      'dataset_description.json': description,
      [`${dwi}.nii`]: pointer('.nii'),
      [`${dwi}.bval`]: '0 1000\n',
    }, async (root) => {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, `${dwi}.nii`), ['DWI_MISSING_BVEC', 'UNLOCKED_ANNEX_DATA'])
    })
  })
})

Deno.test('Ignored unlocked annex files are not reported', async () => {
  await withDataset({
    'dataset_description.json': description,
    '.bidsignore': 'extra/\n',
    'sub-01/anat/sub-01_T1w.nii': nifti,
    'extra/notes.txt': pointer('.txt'),
  }, async (root) => {
    const issues = await validateDir(root)
    assertEquals(codesAt(issues, '/extra/notes.txt'), [])
  })
})

Deno.test('Unlocked sidecars are inherited with --allowUnlockedData', async () => {
  // Leading whitespace makes the content longer than its pointer, so that a read
  // cut at the pointer's size would lose the keys.
  const sidecar = ' '.repeat(64) + '{"TaskName": "x", "RepetitionTime": 2}'
  const key = annexKey(sidecar, '.json')
  const bold = '/sub-01/func/sub-01_task-x_bold.nii'
  await withDataset({
    'dataset_description.json': description,
    'task-x_bold.json': { annex: 'pointer', key },
    [bold]: nifti,
  }, async (root) => {
    await writeAnnexObject(join(root, '.git'), key, sidecar)
    const issues = await validateDir(root, true)
    assertEquals(codesAt(issues, '/task-x_bold.json'), [])
    assertEquals(issues.get({ location: bold, code: 'SIDECAR_KEY_REQUIRED' }), [])
  })
})

Deno.test({
  name: 'Unreadable local annex objects are reported as FILE_READ',
  // chmod does not stop root from reading
  ignore: isWindows || Deno.uid() === 0,
}, async () => {
  const anat = '/sub-01/anat/sub-01_T1w.nii'
  const key = annexKey(nifti, '.nii')
  await withDataset({
    'dataset_description.json': description,
    [anat]: { annex: 'link', key },
  }, async (root) => {
    await writeAnnexObject(join(root, '.git'), key, nifti)
    const [h0, h1] = await hashDirMixed(key)
    const path = join(root, '.git', 'annex', 'objects', h0, h1, key, key)
    await Deno.chmod(path, 0o000)
    try {
      const issues = await validateDir(root)
      assertEquals(codesAt(issues, anat), ['FILE_READ'])
    } finally {
      await Deno.chmod(path, 0o644)
    }
  })
})
