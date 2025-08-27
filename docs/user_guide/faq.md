# Frequently Asked Questions

This page is for questions about the Javascript validator that may not be
well addressed elsewhere in the documentation.

If you have a question, please [open an issue][new-issue].
The answer may end up on this page!

## Q: What does the validator actually check?

The BIDS Validator aspires to check that a dataset meets the requirements of the BIDS Standard.
The primary way it does this is by interpreting the [BIDS Schema][schema-description].

The general categories of rules include:

- Filename rules: These rules indicate valid combinations of [entities][], [suffixes][definitions]
  [datatypes][definitions] and [extensions][definitions].
  Every file in a dataset must match a filename rule.
- Sidecar and JSON rules: These rules indicate whether fields are REQUIRED, RECOMMENDED
  or OPTIONAL in a JSON file.
  REQUIRED fields produce errors on absence, while RECOMMENDED fields produce warnings on absence.
  If the field is defined, then it also has a type (for example, numeric or textual);
  type mismatches produce errors.
- Tabular data rules: These rules indicate what columns are REQUIRED, RECOMMENDED or OPTIONAL
  in a TSV file, and behave similarly to sidecar rules.
  Additionally, tabular file rules may indicate that columns must appear in a certain order or
  have unique values, and that additional columns are permitted or forbidden.
  If JSON sidecar files provide definitions for columns,
  the values in those columns are validated against those definitions.
- Checks: These rules are conditional assertions, with the form of selectors and checks.
  Selectors are expressions that determine whether the rule applies to the file or dataset,
  and checks are expressions about the file or dataset that must evaluate to `true`.

## Q: Why doesn't the validator warn/error about inconsistencies in some TSV columns?

A specific question we've received is why the validator does not ensure that a
column like `sex` in `participants.tsv` will permit both `f` and `F`,
rather than enforce consistency.

The reason for this is that `sex` (like `age`) is not rigorously defined by the BIDS Standard,
but is provided as an example with a default definition.
Default definitions are loose and often accept a wide range of values that would be
understandable by humans while still allowing some amount of machine validation.
As of BIDS 1.10.0, the definition of `sex` in the schema is:

```json
{
  "sex": {
    "LongName": "sex",
    "Description": "String value indicating phenotypical sex.",
    "Levels": {
      "F": "Female",
      "FEMALE": "Female",
      "Female": "Female",
      "f": "Female",
      "female": "Female",
      "M": "Male",
      "MALE": "Male",
      "Male": "Male",
      "m": "Male",
      "male": "Male",
      "O": "Other",
      "OTHER": "Other",
      "Other": "Other",
      "o": "Other",
      "other": "Other"
    }
  }
}
```

Data curators are encouraged to refine this definition in their `participants.json` sidecar file,
for example, if you use the SNOMEDCT ontology:

```json
{
  "sex": {
    "LongName": "sex",
    "Description": "Finding related to biological sex",
    "TermURL": "http://purl.bioontology.org/ontology/SNOMEDCT/429019009",
    "Levels": {
      "F": {
        "Description": "Female",
        "TermURL": "http://purl.bioontology.org/ontology/SNOMEDCT/248152002",
      },
      "M": {
        "Description": "Male",
        "TermURL": "http://purl.bioontology.org/ontology/SNOMEDCT/248153007",
      },
      "I": {
        "Description": "Intersex",
        "TermURL": "http://purl.bioontology.org/ontology/SNOMEDCT/32570691000036108",
      },
      "X": {
        "Description": "Indeterminate sex",
        "TermURL": "http://purl.bioontology.org/ontology/SNOMEDCT/32570681000036106",
      }
    }
  }
}
```

If provided, the validator will check that all values in the column are `F`, `M`, `I`, `X`,
or `n/a` (which is permitted in all columns, according to the BIDS Standard).


[new-issue]: https://github.com/bids-standard/bids-validator/issues/new
[schema-description]: https://bidsschematools.readthedocs.io/en/latest/description.html
[entities]: https://bids-specification.readthedocs.io/en/stable/common-principles.html#entities
[definitions]: https://bids-specification.readthedocs.io/en/stable/common-principles.html#definitions
