/**
 * Thrown when a text file is decoded as UTF-8 but contains UTF-16 characters
 */
export class UnicodeDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnicodeDecode'
  }
}

const _decode = TextDecoder.prototype.decode

TextDecoder.prototype.decode = function (input, options) {
  try {
    return _decode.call(this, input, options)
  } catch (error) {
    throw { code: 'INVALID_FILE_ENCODING', message: error }
  }
}

/**
 * A transformer that ensures the input stream is valid UTF-8 and throws
 * a UnicodeDecodeError if UTF-16 BOM is detected
 */
export class UTF8StreamTransformer implements Transformer<Uint8Array, string> {
  private decoder: TextDecoder
  private firstChunk: boolean

  constructor(options = { fatal: false }) {
    this.decoder = new TextDecoder('utf-8', options)
    this.firstChunk = true
  }

  transform(chunk: Uint8Array, controller: TransformStreamDefaultController<string>) {
    // Check first chunk for UTF-16 BOM
    if (this.firstChunk) {
      let decoded = this.decoder.decode(chunk, { stream: true })
      if (decoded.startsWith('\uFFFD')) {
        throw new UnicodeDecodeError('This file appears to be UTF-16')
      }
      this.firstChunk = false
      controller.enqueue(decoded)
    } else {
      controller.enqueue(this.decoder.decode(chunk, { stream: true }))
    }
  }

  flush(controller: TransformStreamDefaultController<string>) {
    const final = this.decoder.decode()
    if (final) {
      controller.enqueue(final)
    }
  }
}

/**
 * Creates a TransformStream that validates and decodes UTF-8 text
 */
export function createUTF8Stream(options = { fatal: false }) {
  return new TransformStream(new UTF8StreamTransformer(options))
}
