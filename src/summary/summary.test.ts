import { computeModalities, modalityPrettyLookup, Summary } from './summary.ts'
import { assertEquals, type assertObjectMatch } from '@std/assert'
import { checkAllErrors } from './summary.ts'
import { ValidationResult } from '../types/validation-result.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import type { Issue } from '../types/issues.ts'

Deno.test('Summary class and helper functions', async (t) => {
  await t.step('Constructor succeeds', () => {
    new Summary()
  })
  await t.step('computeModalities properly sorts modality counts', () => {
    const modalitiesIn = { eeg: 5, pet: 6, mri: 6, ieeg: 6 }
    const modalitiesOut = ['pet', 'ieeg', 'mri', 'eeg'].map(
      (x) => modalityPrettyLookup[x],
    )
    assertEquals(computeModalities(modalitiesIn), modalitiesOut)
  })
})

const json_mock_validation_result = {
  "issues": {
    "issues": [],
    "codeMessages": {}
  },
  "summary": {
    "sessions": [],
    "subjects": [
      "01"
    ],
    "subjectMetadata": [],
    "tasks": [],
    "modalities": [
      "MRI"
    ],
    "secondaryModalities": [
      "MRI_Structural"
    ],
    "totalFiles": 14,
    "size": 1513,
    "dataProcessed": false,
    "pet": {},
    "dataTypes": [
      "fmap",
      "anat"
    ],
    "schemaVersion": "1.1.3"
  },
  "derivativesSummary": {
    "/derivatives/mock/": {
      "issues": {
        "issues": [
          {
            "code": "EMPTY_FILE",
            "severity": "error",
            "location": "/README"
          },
        ]
      },
      "summary": {
        "sessions": [],
        "subjects": [
          "01"
        ],
        "subjectMetadata": [],
        "tasks": [],
        "modalities": [
          "MRI"
        ],
        "secondaryModalities": [
          "MRI_Structural"
        ],
        "totalFiles": 12,
        "size": 3715,
        "dataProcessed": true,
        "pet": {},
        "dataTypes": [
          "fmap",
          "anat"
        ],
        "schemaVersion": "1.1.3"
      }
    }
  }
}

const mockValidationResultBadDerivatives: ValidationResult = {
  issues: new DatasetIssues({ 
    issues: json_mock_validation_result.issues.issues as Issue[],
    codeMessages: new Map(Object.entries(json_mock_validation_result.issues.codeMessages)),
    }),
  summary: json_mock_validation_result.summary,
  derivativesSummary: {
    "/derivatives/mock/": {
      issues: new DatasetIssues({
        issues: json_mock_validation_result.derivativesSummary["/derivatives/mock/"].issues.issues as Issue[],
      }),
      summary: json_mock_validation_result.derivativesSummary["/derivatives/mock/"].summary,
    }
  }
}

const mockValidationResultBadRawData: ValidationResult = {
  issues: new DatasetIssues({ 
    issues: json_mock_validation_result.derivativesSummary["/derivatives/mock/"].issues.issues as Issue[],
    }),
  summary: json_mock_validation_result.summary,
}

Deno.test('checkAllErrors properly collects errors', () => {
  const errors = checkAllErrors(mockValidationResultBadDerivatives)
  assertEquals(errors.length, 1)
  assertEquals(errors[0].code, 'EMPTY_FILE')
  assertEquals(errors[0].severity, 'error')
  assertEquals(errors[0].location, '/README')
})

Deno.test('checkAllErrors properly collects errors from raw data', () => {
  const errors = checkAllErrors(mockValidationResultBadRawData)
  assertEquals(errors.length, 1)
  assertEquals(errors[0].code, 'EMPTY_FILE')
  assertEquals(errors[0].severity, 'error')
  assertEquals(errors[0].location, '/README')
})

const mockValidationResultNoErrors: ValidationResult = {
  issues: new DatasetIssues({
    issues: [],
    codeMessages: new Map(),
  }),
  summary: json_mock_validation_result.summary,
  derivativesSummary: {
    "/derivatives/mock/": {
      issues: new DatasetIssues({
        issues: [],
        codeMessages: new Map(),
      }),
      summary: json_mock_validation_result.derivativesSummary["/derivatives/mock/"].summary,
    }
  }
}

Deno.test('checkAllErrors returns empty array when no errors found', () => {
  const errors = checkAllErrors(mockValidationResultNoErrors)
  assertEquals(errors.length, 0)
})
