import type { IssueDefinitionRecord } from '../types/issues.ts'

export const bidsIssues: IssueDefinitionRecord = {
  INVALID_JSON_ENCODING: {
    severity: 'error',
    reason: 'JSON files must be valid UTF-8 encoded text.',
  },
  JSON_INVALID: {
    severity: 'error',
    reason: 'Not a valid JSON file.',
  },
  MISSING_DATASET_DESCRIPTION: {
    severity: 'error',
    reason: 'A dataset_description.json file is required in the root of the dataset',
  },
  INVALID_ENTITY_LABEL: {
    severity: 'error',
    reason: "entity label doesn't match format found for files with this suffix",
  },
  ENTITY_WITH_NO_LABEL: {
    severity: 'error',
    reason: 'Found an entity with no label.',
  },
  MISSING_REQUIRED_ENTITY: {
    severity: 'error',
    reason: 'Missing required entity for files with this suffix.',
  },
  ENTITY_NOT_IN_RULE: {
    severity: 'error',
    reason: 'Entity not listed as required or optional for files with this suffix',
  },
  DATATYPE_MISMATCH: {
    severity: 'error',
    reason: 'The datatype directory does not match datatype of found suffix and extension',
  },
  ALL_FILENAME_RULES_HAVE_ISSUES: {
    severity: 'error',
    reason:
      'Multiple filename rules were found as potential matches. All of them had at least one issue during filename validation.',
  },
  EXTENSION_MISMATCH: {
    severity: 'error',
    reason: 'Extension used by file does not match allowed extensions for its suffix',
  },
  INVALID_LOCATION: {
    severity: 'error',
    reason: 'The file has a valid name, but is located in an invalid directory.',
  },
  FILENAME_MISMATCH: {
    severity: 'error',
    reason:
      'The filename is not formatted correctly. This could result from entity duplication or reordering.',
  },
  JSON_KEY_REQUIRED: {
    severity: 'error',
    reason: 'A JSON flle is missing a key listed as required.',
  },
  JSON_KEY_RECOMMENDED: {
    severity: 'warning',
    reason: 'A JSON file is missing a key listed as recommended.',
  },
  SIDECAR_KEY_REQUIRED: {
    severity: 'error',
    reason: "A data file's JSON sidecar is missing a key listed as required.",
  },
  SIDECAR_KEY_RECOMMENDED: {
    severity: 'warning',
    reason: "A data file's JSON sidecar is missing a key listed as recommended.",
  },
  JSON_SCHEMA_VALIDATION_ERROR: {
    severity: 'error',
    reason: 'Invalid JSON sidecar file. The sidecar is not formatted according the schema.',
  },
  TSV_ERROR: {
    severity: 'error',
    reason: 'generic place holder for errors from tsv files',
  },
  TSV_COLUMN_HEADER_DUPLICATE: {
    severity: 'error',
    reason:
      'Two elements in the first row of a TSV are the same. Each column header must be unique.',
  },
  TSV_EQUAL_ROWS: {
    severity: 'error',
    reason: 'All rows must have the same number of columns as there are headers.',
  },
  TSV_EMPTY_LINE: {
    severity: 'error',
    reason: 'An empty line was found in the TSV file.',
  },
  TSV_COLUMN_MISSING: {
    severity: 'error',
    reason: 'A required column is missing',
  },
  TSV_COLUMN_ORDER_INCORRECT: {
    severity: 'error',
    reason: 'Some TSV columns are in the incorrect order',
  },
  TSV_ADDITIONAL_COLUMNS_NOT_ALLOWED: {
    severity: 'error',
    reason: 'A TSV file has extra columns which are not allowed for its file type',
  },
  TSV_ADDITIONAL_COLUMNS_MUST_DEFINE: {
    severity: 'error',
    reason:
      'Additional TSV columns must be defined in the associated JSON sidecar for this file type',
  },
  TSV_ADDITIONAL_COLUMNS_UNDEFINED: {
    severity: 'warning',
    reason: 'A TSV file has extra columns which are not defined in its associated JSON sidecar',
  },
  TSV_INDEX_VALUE_NOT_UNIQUE: {
    severity: 'error',
    reason:
      'An index column(s) was specified for the tsv file and not all of the values for it are unique.',
  },
  TSV_VALUE_INCORRECT_TYPE: {
    severity: 'error',
    reason:
      'A value in a column did not match the acceptable type for that column headers specified format.',
  },
  TSV_VALUE_INCORRECT_TYPE_NONREQUIRED: {
    severity: 'warning',
    reason:
      'A value in a column did not match the acceptable type for that column headers specified format.',
  },
  TSV_COLUMN_TYPE_REDEFINED: {
    severity: 'warning',
    reason:
      'A column required in a TSV file has been redefined in a sidecar file. This redefinition is being ignored.',
  },
  MULTIPLE_INHERITABLE_FILES: {
    severity: 'error',
    reason: 'Multiple files in a directory were found to be valid candidates for inheritance.',
  },
  NIFTI_HEADER_UNREADABLE: {
    severity: 'error',
    reason:
      'We were unable to parse header data from this NIfTI file. Please ensure it is not corrupted or mislabeled.',
  },
  CHECK_ERROR: {
    severity: 'error',
    reason: 'generic place holder for errors from failed `checks` evaluated from schema.',
  },
  NOT_INCLUDED: {
    severity: 'error',
    reason:
      'Files with such naming scheme are not part of BIDS specification. This error is most commonly ' +
      'caused by typos in file names that make them not BIDS compatible. Please consult the specification and ' +
      'make sure your files are named correctly. If this is not a file naming issue (for example when including ' +
      'files not yet covered by the BIDS specification) you should include a ".bidsignore" file in your dataset (see' +
      ' https://github.com/bids-standard/bids-validator#bidsignore for details). Please ' +
      'note that derived (processed) data should be placed in /derivatives folder and source data (such as DICOMS ' +
      'or behavioural logs in proprietary formats) should be placed in the /sourcedata folder.',
  },
  EMPTY_FILE: {
    severity: 'error',
    reason: 'Empty files not allowed.',
  },
  UNUSED_STIMULUS: {
    severity: 'warning',
    reason:
      'There are files in the /stimuli directory that are not utilized in any _events.tsv file.',
  },
  SIDECAR_WITHOUT_DATAFILE: {
    severity: 'error',
    reason: 'A json sidecar file was found without a corresponding data file',
  },
  BLACKLISTED_MODALITY: {
    severity: 'error',
    reason: 'The modality in this file is blacklisted through validator configuration.',
  },
  CITATION_CFF_VALIDATION_ERROR: {
    severity: 'error',
    reason: "The file does not pass validation using the citation.cff standard's schema." +
      'https://github.com/citation-file-format/citation-file-format/blob/main/schema-guide.md',
  },
  FILE_READ: {
    severity: 'error',
    reason: 'We were unable to read this file.',
  },
  HED_ERROR: {
    severity: 'error',
    reason: 'The validation on this HED string returned an error.',
  },
  HED_WARNING: {
    severity: 'warning',
    reason: 'The validation on this HED string returned a warning.',
  },
}

export const nonSchemaIssues = { ...bidsIssues }
