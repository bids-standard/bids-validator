const { promisify } = require('util')
const lockfile = require('lockfile')
const lockPromise = promisify(lockfile.lock)

const examples_lock = 'bids-validator/tests/examples.lockfile'
// Wait for up to five minutes for examples to finish
// downloading in another test worker
const examples_lock_opts = { wait: 300000 }

const isPromise = thing =>
  typeof thing === 'object' && typeof thing.then === 'function'

const withLock = async (cb, options = examples_lock_opts) => {
  await lockPromise(examples_lock, options)
  let returnValue = cb()
  if (isPromise(returnValue)) returnValue = await returnValue
  lockfile.unlockSync(examples_lock)
  return returnValue
}

module.exports = withLock
