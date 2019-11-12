import './prototype'
import array from './array'
import config from './config'
import files from './files'
import bids_files from './bids_files'
import issues from './issues'
import json from './json'
import modalities from './modalities'
import options from './options'
import type from './type'
import collectSummary from './summary/collectSummary'
import limit from './promise_limiter'

export default {
  array: array,
  config: config,
  files: files,
  bids_files: bids_files,
  issues: issues,
  json: json,
  modalities: modalities,
  options: options,
  type: type,
  collectSummary: collectSummary,
  limit,
}
