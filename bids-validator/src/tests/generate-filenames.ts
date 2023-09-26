function randomString() {
  return Math.random().toString(36).substring(6)
}

function randomEntityString(prefix?: string): string {
  if (prefix) {
    return `${prefix}-${randomString()}`
  } else {
    return `${randomString()}-${randomString()}`
  }
}

/**
 * Generate random filenames not following entity ordering rules if length > 0
 */
export function generateBIDSFilename(length = 1, extension = '.json') {
  const subject = randomEntityString('sub')
  const session = randomEntityString('ses')
  const run = randomEntityString('run')
  const acquisition = randomEntityString('acq')
  const parts = [subject, session, run, acquisition]
  for (let n = 0; n < length; n++) {
    parts.push(randomEntityString())
  }
  return parts.join('_') + extension
}
