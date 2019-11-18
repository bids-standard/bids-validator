const { spawn } = require('child_process')

const runProcess = async (command, args) =>
  new Promise((resolve, reject) => {
    const output = []
    const process = spawn(command, args)
    process.stdout.on('data', output.push)
    process.stderr.on('data', data => reject(data.toString('utf8')))
    process.on('close', (code, signal) => resolve({ code, signal, output }))
  })

const add = async (url, path) => {
  const { code, output } = await runProcess('git', [
    'submodule',
    'add',
    '-f',
    url,
    path,
  ])
  console.log({code, output})
  return { code, output }
}

const status = async () => {
  const { code, output } = await runProcess('git', ['submodule', 'status'])
  console.log({code, output})
}

module.exports = {
  add,
  status,
}
// const zip = new AdmZip('bids-validator/tests/data/examples.zip')
// zip.extractAllTo('bids-validator/tests/data/', true)
