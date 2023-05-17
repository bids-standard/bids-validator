import { assert } from '../deps/asserts.ts'
import { readEntities } from './entities.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'
import { generateBIDSFilename } from '../tests/generate-filenames.ts'

Deno.test('test readEntities', (t) => {
  const testFile = {
    name: 'task-rhymejudgment_bold.json',
    path: '/task-rhymejudgment_bold.json',
    size: null as unknown as number,
    ignored: false,
    stream: null as unknown as ReadableStream<Uint8Array>,
    text: () => Promise.resolve(''),
    readBytes: nullReadBytes,
  }
  const context = readEntities(testFile.name)
  assert(context.suffix === 'bold', 'failed to match suffix')
  assert(context.extension === '.json', 'failed to match extension')
  assert(context.entities.task === 'rhymejudgment', 'failed to match extension')
})

Deno.test('test readEntities performance', (t) => {
  const generateStart = performance.now()
  const testFilenames = []
  for (let n = 0; n < 200000; n++) {
    testFilenames.push(generateBIDSFilename(Math.floor(Math.random() * 4)))
  }
  const generateEnd = performance.now()
  const normalizePerf = generateEnd - generateStart

  const start = performance.now()
  for (const each of testFilenames) {
    readEntities(each)
  }
  const end = performance.now()
  const readEntitiesTime = end - start

  const perfRatio = readEntitiesTime / normalizePerf + Number.EPSILON
  console.log(`readEntities() runtime ratio: ${perfRatio.toFixed(2)}`)
  assert(perfRatio < 2)
})
