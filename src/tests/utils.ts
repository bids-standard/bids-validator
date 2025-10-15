export function streamFromUint8Array<T extends ArrayBufferLike>(
  arr: Uint8Array<T>,
): ReadableStream<Uint8Array<T>> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(arr)
      controller.close()
    },
  })
}

export function streamFromString(str: string): ReadableStream<Uint8Array<ArrayBuffer>> {
  return streamFromUint8Array(new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>)
}
