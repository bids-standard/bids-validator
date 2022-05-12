import { assert, assertEquals } from '../deps/asserts.ts'
import { BIDSFile } from '../files/filetree.ts'
import { readEntities } from './entities.ts'

Deno.test('test readEntities', async t => {
  const testFile = {
    name: 'task-rhymejudgment_bold.json',
    path: '/task-rhymejudgment_bold.json',
    size: null as unknown as Promise<number>,
    ignored: false,
    stream: null as unknown as Promise<ReadableStream<Uint8Array>>
  }
  const context = readEntities(testFile)
  assert(context.suffix === 'bold', "failed to match suffix")
  assert(context.extension === '.json', "failed to match extension")
  assert(context.entities.task === 'rhymejudgment', "failed to match extension")
})

