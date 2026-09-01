import { assertEquals } from '@std/assert'
import { pathsToTree } from '../../files/filetree.test.ts'
import type { FileTree } from '../../types/filetree.ts'
import { hasStimuliCatalog } from './stimuliCatalog.ts'

function stimTree(paths: string[]): FileTree | undefined {
  return pathsToTree(paths).get('stimuli') as FileTree | undefined
}

Deno.test('hasStimuliCatalog', async (t) => {
  await t.step('false for a legacy free-form stimuli directory', () => {
    assertEquals(hasStimuliCatalog(stimTree(['/stimuli/left_hand.png'])), false)
  })
  await t.step('false for a missing stimuli directory', () => {
    assertEquals(hasStimuliCatalog(undefined), false)
  })
  await t.step('true for a root catalog', () => {
    assertEquals(
      hasStimuliCatalog(stimTree(['/stimuli/stimuli.tsv', '/stimuli/stim-a_image.png'])),
      true,
    )
  })
  await t.step('true for a subdirectory catalog without a root catalog', () => {
    assertEquals(
      hasStimuliCatalog(
        stimTree(['/stimuli/faces/stimuli.tsv', '/stimuli/faces/stim-a_image.png']),
      ),
      true,
    )
  })
})
