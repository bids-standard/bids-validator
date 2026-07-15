export async function* bufferAsyncIterator<T>(
  asyncIterator: AsyncIterable<T>,
  bufferSize: number = 5,
): AsyncGenerator<T, void, undefined> {
  const iterator = asyncIterator[Symbol.asyncIterator]()
  const promises: Promise<IteratorResult<T>>[] = []

  // Initialize buffer
  for (let i = 0; i < bufferSize; i++) {
    promises.push(iterator.next())
  }

  while (promises.length > 0) {
    const result = await promises.shift()!

    if (!result.done) {
      yield result.value
      // Keep buffer full
      promises.push(iterator.next())
    }
  }
}

type CleanupFunction = () => void

export async function* cleanupAsyncIterator<T extends object>(
  asyncIterator: AsyncIterable<T | CleanupFunction>,
): AsyncGenerator<T, void, undefined> {
  for await (const item of asyncIterator) {
    if (typeof item === 'function') {
      item()
    } else {
      yield item
    }
  }
}

export async function* queuedAsyncIterator<T extends object>(
  asyncIterator: AsyncIterable<T | CleanupFunction>,
  bufferSize: number = 5,
): AsyncGenerator<T, void, undefined> {
  yield* cleanupAsyncIterator(bufferAsyncIterator(asyncIterator, bufferSize))
}
