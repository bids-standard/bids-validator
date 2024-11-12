import { assert } from '@std/assert'
import { pathsToTree } from '../files/filetree.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { citationValidate } from './citation.ts'
import { BIDSContextDataset } from '../schema/context.ts'
import type { GenericSchema } from '../types/schema.ts'
import { loadSchema } from '../setup/loadSchema.ts'

Deno.test('citation validation', async (t) => {
  const schema = await loadSchema()
  await t.step('no errors on the good citation.cff', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    const dsContext = new BIDSContextDataset({ tree })
    const file = new BIDSFileDeno('tests/data/citation', 'good.cff')
    tree.files[0].text = () => file.text()
    await citationValidate({} as GenericSchema, dsContext)
    assert(dsContext.issues.size === 0)
  })
  await t.step('An error on the bad citation.cff', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    const dsContext = new BIDSContextDataset({ tree })
    const file = new BIDSFileDeno('tests/data/citation', 'bad.cff')
    tree.files[0].text = () => file.text()
    await citationValidate({} as GenericSchema, dsContext)
    assert(dsContext.issues.get({ code: 'CITATION_CFF_VALIDATION_ERROR' }).length === 1)
  })
})
