// dependencies ------------------------------------------------------
import 'cross-fetch/polyfill'

import tsv from './tsv'
import json from './json'
import { NIFTI } from './nifti'
import { start as BIDS } from './bids'
import Events from './events'
import { bval } from './bval'
import { bvec } from './bvec'
import utils from '../utils'
import consoleFormat from '../utils/consoleFormat'

// public api --------------------------------------------------------

const validate = {
  BIDS: BIDS,
  JSON: json.json,
  TSV: tsv,
  NIFTI,
  Events: Events,
  bval: bval,
  bvec: bvec,
  reformat: utils.issues.reformat,
  utils: utils,
  consoleFormat,
}

// exports -----------------------------------------------------------

export default validate
