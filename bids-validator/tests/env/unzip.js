const { spawn } = require('child_process')

const unzip = zipFilePath => ({
  to: async decompressedFilePath =>
    new Promise((resolve, reject) => {
      const process = spawn('unzip', [
        '-o',
        zipFilePath,
        '-d',
        decompressedFilePath,
      ])
      process.stdout.on('data', console.log)
      process.stderr.on('data', reject)
      process.on('close', resolve)
    }),
})

module.exports = unzip
// const zip = new AdmZip('bids-validator/tests/data/examples.zip')
// zip.extractAllTo('bids-validator/tests/data/', true)
