import hedValidator from '../deps/hed-validator/index.js'

const hedArgs = {
  eventData: [],
  sidecarData: [],
  datasetDescription: '',
  dir: '',
}

// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]))
}

function columnsToContent(columns): tsvContent {
  const cols = []
  for (let header in columns) {
    cols.push(columns[header])
  }
  const rows = transpose(cols)
  return {
    headers: Object.keys(columns),
    rows,
  }
}

function detectHed(tsvData, sidecarData) {
  return (
    sidecarData.some((sidecarFileData) => {
      return Object.values(sidecarFileData.sidecarData).some(sidecarValueHasHed)
    }) ||
    tsvData.some((tsvFileData) => {
      return tsvFileData.parsedTsv.headers.indexOf('HED') !== -1
    })
  )
} 
  
function sidecarValueHasHed(sidecarValue) {
  return ( 
    sidecarValue !== null &&
    typeof sidecarValue === 'object' &&
    sidecarValue.HED !== undefined
  )
}

export async function hedAccumulator(schema, context) {
  if (context.file.name == 'dataset_description.json') {
    hedArgs.datasetDescription = new hedValidator.validator.BidsJsonFile(
      '/dataset_description.json',
      await context.json,
      context.file,
    )
    hedArgs.dir = context.file._datasetAbsPath
  }
  if (context.suffix == 'events' && context.extension == '.tsv') {
    const tsvContent = columnsToContent(context.columns)

    const eventFileArgs = [
      context.path,
      [],
      context.sidecar,
      tsvContent,
      context.file,
    ]
    hedArgs.eventData.push(
      new hedValidator.validator.BidsEventFile(...eventFileArgs),
    )
  }

  if (context.extension == '.json') {
    const sidecarFileArgs = [context.path, await context.json, context.file]
    hedArgs.sidecarData.push(
      new hedValidator.validator.BidsSidecar(...sidecarFileArgs),
    )
  }
}

export async function hedValidate(schema, dsContext, issues) {
  let hedDs = new hedValidator.validator.BidsDataset(...Object.values(hedArgs))
  await hedValidator.validator
    .validateBidsDataset(hedDs)
    .then((hedValidationIssues) => {
      console.log(hedValidationIssues)
    })
  return Promise.resolve()
}

