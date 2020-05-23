"""Test BIDSValidator functionality.

git-annex and datalad are used to download a test data structure without the
actual file contents.

"""
import os
import datalad.api

from bids_validator import BIDSValidator


def test_is_bids():
    """Test that is_bids returns true for each file in a valid BIDS dataset."""
    # Download testing data as git annex dataset
    HOME = os.path.expanduser('~')
    dspath = os.path.join(HOME, 'eeg_matchingpennies_git_annex')
    url = 'https://github.com/sappelhoff/eeg_matchingpennies'
    datalad.api.install(dataset=dspath, source=url)

    def _exclude_this(fname):
        """Help to skip certain files from being validated."""
        exclude_keywords = ['git', 'datalad', 'sourcedata', 'bidsignore']
        for keyword in exclude_keywords:
            if keyword in fname:
                return True

        return False

    # Gather all files
    files = []
    for r, _, f in os.walk(dspath):
        for file in f:
            fname = os.path.join(r, file)
            if not _exclude_this(fname):
                files.append(fname)

    # Test all files
    validator = BIDSValidator()
    false_decisions = []
    for file in files:
        if not validator.is_bids(file):
            false_decisions.append(file)

    if len(false_decisions) > 0:
        raise AssertionError('False decisions for the following files: {}'
                             .format(false_decisions))

    # Sanity check: Does it raise for wrong files?
    assert not validator.is_bids('bogus')
