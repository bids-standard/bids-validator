"""Perform a simple test of the bids_validator module."""
import os
import os.path as op

import pytest

from bids_validator import BIDSValidator

DATA = [
    (op.join(os.sep, 'sub-01', 'anat', 'sub-01_rec-CSD_T1w.nii.gz'), True),
    (op.join(os.sep, 'sub-01', 'anat', 'sub-01_acq-23_rec-CSD_T1w.exe'), False),  # noqa: E501 wrong extension
    (op.join(os.sep, 'home', 'username', 'my_data', 'participants.tsv'), False),  # noqa: E501 not relative to root
    (op.join(os.sep, 'participants.tsv'), True),
]

VALIDATOR = BIDSValidator()


@pytest.mark.parametrize('data', DATA)
def test_BIDSValidator(data):
    """Test basic functionality of BIDSValidator class."""
    fpath, result = data
    assert VALIDATOR.is_bids(fpath) == result
