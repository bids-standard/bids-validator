// An index of rules documents to export as modules
// The Python module expects these to be within its tree, but we can just import them from there
const associated_data_rules = require('../bids_validator/bids_validator/rules/associated_data_rules.json')
const file_level_rules = require('../bids_validator/bids_validator/rules/file_level_rules.json')
const fixed_top_level_names = require('../bids_validator/bids_validator/rules/fixed_top_level_names.json')
const path = require('../bids_validator/bids_validator/rules/path.json')
const phenotypic_rules = require('../bids_validator/bids_validator/rules/phenotypic_rules.json')
const session_level_rules = require('../bids_validator/bids_validator/rules/session_level_rules.json')
const subject_level_rules = require('../bids_validator/bids_validator/rules/subject_level_rules.json')
const top_level_rules = require('../bids_validator/bids_validator/rules/top_level_rules.json')

module.exports = {
  associated_data_rules: associated_data_rules,
  file_level_rules: file_level_rules,
  fixed_top_level_names: fixed_top_level_names,
  path: path,
  phenotypic_rules: phenotypic_rules,
  session_level_rules: session_level_rules,
  subject_level_rules: subject_level_rules,
  top_level_rules: top_level_rules,
}
