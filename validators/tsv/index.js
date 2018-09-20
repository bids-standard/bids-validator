/* eslint-disable no-unused-vars */
const TSV = require('./tsv')
const checkPhenotype = require('./checkPhenotype')
const validateTsvColumns = require('./validateTsvColumns')
const validate = require('./validate')
const checkAge89 = require('./checkAge89')
const checkAcqTimeFormat = require('./checkAcqTimeFormat')

module.exports = {
  TSV: TSV,
  checkPhenotype: checkPhenotype,
  validateTsvColumns: validateTsvColumns,
  validate: validate,
  checkAge89: checkAge89,
  checkAcqTimeFormat: checkAcqTimeFormat,
}
