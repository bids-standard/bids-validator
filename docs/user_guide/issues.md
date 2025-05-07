# Understanding issues

BIDS Validator issues are structured results that describe problems or potential
problems in the dataset.
Issues can either be warnings or errors.

Errors are emitted when a violation of the BIDS specification is detected,
or, in some cases, the validator is unable to read part of the dataset.
Errors must be resolved in order for a dataset to be considered valid.

Warnings are emitted when BIDS specification recommendations are not followed,
as well as cases where a common problem may be present, and user attention
is needed to verify the validity of the dataset.

## Issue model

Every issue has a code indicating the issue type, a location indicating
the file where the issue was detected, and a severity field that can
either be "warning" or "error".

| `code`                    | `location`                       | `severity` |
| ------------------------- | -------------------------------- | ---------- |
| `NIFTI_HEADER_UNREADABLE` | `/sub-01/anat/sub-01_T1w.nii.gz` | `error`    |
| `README_FILE_SMALL`       | `/README`                        | `warning`  |

In the web validator, these issues appear as:

![A NIFTI_HEADER_UNREADABLE error in the web validator. (Dark theme)
](../_static/example_error_dark.png){.only-dark align=center}
![A NIFTI_HEADER_UNREADABLE error in the web validator. (Light theme)
](../_static/example_error_light.png){.only-light align=center}

![A README_FILE_SMALL warning in the web validator. (Dark theme)
](../_static/example_warning_dark.png){.only-dark align=center}
![A README_FILE_SMALL warning in the web validator. (Light theme)
](../_static/example_warning_light.png){.only-light align=center}

In the command-line validator, these would be rendered as:

```console
	[WARNING] README_FILE_SMALL The recommended file '/README' is very small.
    Please consider expanding it with additional information about the dataset.

		/README

	[ERROR] NIFTI_HEADER_UNREADABLE We were unable to parse header data from this NIfTI file.
    Please ensure it is not corrupted or mislabeled.
		/sub-01/anat/sub-01_T1w.nii.gz
		/sub-02/anat/sub-02_T1w.nii.gz
```

### Subcodes

Some classes of issue can be found many times, even in the same file.
For example, invalid sidecar metadata,
such as using `"MagneticFieldStrength": "3T"` instead of `"MagneticFieldStrength": 3`,
triggers a `JSON_SCHEMA_VALIDATION_ERROR` because the value must be numeric rather
than textual.

Consider the following issues:

| `code`                         | `subcode`               | `location`                               | `severity` |
| ------------------------------ | ----------------------- | ---------------------------------------- | ---------- |
| `JSON_SCHEMA_VALIDATION_ERROR` | `MagneticFieldStrength` | `/T1w.json`                              | `error`    |
| `JSON_KEY_REQUIRED`            | `BIDSVersion`           | `/dataset_description.json`              | `error`    |
| `JSON_KEY_RECOMMENDED`         | `GeneratedBy`           | `/dataset_description.json`              | `warning`  |
| `SIDECAR_KEY_REQUIRED`         | `RepetitionTime`        | `/sub-01/func/sub-01_task-rest_bold.nii` | `error`    |
| `SIDECAR_KEY_RECOMMENDED`      | `EchoTime`              | `/sub-01/func/sub-01_task-rest_bold.nii` | `warning`  |

Each of these issue codes are general, and the subcode indicates the specific
JSON field that is missing or invalid.

Note that, when a value is absent or invalid in a specific file,
the location is the JSON file can be listed.
For example, the invalid `MagneticFieldStrength` may affect many `*_T1w.nii.gz` files,
but it can be found in a single file.
On the other hand, for missing sidecar keys, the [inheritance principle](../validation-model/index.md)
permits the data to be defined in multiple files.

### All fields

The validator defines the following fields for issues:

| Field          | Type       | Description                                                              |
| -------------- | ---------- | ------------------------------------------------------------------------ |
| `code`         | `string`   | The type of issue detected                                               |
| `subCode`      | `string`   | For some `code`s, additional information to narrow the issue type        |
| `severity`     | `string`   | `"error"`, `"warning"` or `"ignore"`                                     |
| `location`     | `string`   | A path to the file in the dataset where the error occurs.                |
| `issueMessage` | `string`   | A human-readable description of the issue.                               |
| `suggestion`   | `string`   | A suggestion for a plausible fix.                                        |
| `affects`      | `string[]` | A list of files affected by the error, if more than `location`.          |
| `rule`         | `string`   | The rule ID in the BIDS schema that failed to pass.                      |
| `line`         | `number`   | The line number (0-indexed) in `location` that triggered the issue.      |
| `character`    | `number`   | The character column (0-indexed) in `location` that triggered the issue. |

All fields except `code`, `severity` and `location` are optional and may be
absent from any issue.

## External validators

BIDS interoperates with other standards.
Where feasible, the BIDS Validator will call an external validator and
expose its issues as BIDS issues.

### Hierarchical Event Descriptors (HED)

The HED validator produces issues of the following form:

| Field          | Type       | Description                                                         |
| -------------- | ---------- | ------------------------------------------------------------------- |
| `code`         | `string`   | `HED_WARNING` or `HED_ERROR`                                        |
| `subCode`      | `string`   | The `"hedCode"` emitted by the HED validator.                       |
| `severity`     | `string`   | `"error"` or `"warning"`                                            |
| `location`     | `string`   | A path to the file in the dataset where the error occurs.           |
| `issueMessage` | `string`   | A human-readable description of the issue.                          |
| `line`         | `number`   | The line number (0-indexed) in `location` that triggered the issue. |
