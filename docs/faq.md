# Frequently Asked Questions

This page is for questions about the Javascript validator that may not be
well addressed elsewhere in the documentation.

If you have a question, please [open an issue][new-issue].
The answer may end up on this page!

## Q: What does the validator actually check?

The BIDS Validator aspires to check that a dataset meets the requirements of the BIDS Standard.
The primary way it does this is by interpreting the [BIDS Schema][schema-description].

The general categories of rules include:

- Filename rules: These rules indicate valid combinations of [entities][], [suffixes][]
  [datatypes][] and [extensions][]. Every file in a dataset must match a filename rule.
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
