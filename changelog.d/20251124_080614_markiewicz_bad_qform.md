### Fixed

- NIfTI files with bad qform matrices, resulting from non-normalized quaternions,
  would previously raise a NIFTI_HEADER_UNREADABLE error. Now only the axis codes
  are disabled, preventing orientation checks, but not raising errors.
