export function streamFromUint8Array(arr: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(arr)
      controller.close()
    },
  })
}

export function streamFromString(str: string): ReadableStream<Uint8Array> {
  return streamFromUint8Array(new TextEncoder().encode(str))
}
