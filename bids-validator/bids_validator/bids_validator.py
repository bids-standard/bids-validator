"""Validation class for BIDS projects."""

import re
import os
import json


class BIDSValidator():
    """An object for BIDS (Brain Imaging Data Structure) verification in a data.

    The main method of this class is `is_bids()`. You should use it for
    checking whether a file path compatible with BIDS.

    Parameters
    ----------
    index_associated : bool, default: True
        Specifies if an associated data should be checked. If it is true then
        any file paths in directories `code/`, `derivatives/`, `sourcedata/`
        and `stimuli/` will pass the validation, else they won't.

    Examples
    --------
    >>> from bids.grabbids import BIDSValidator
    >>> validator = BIDSValidator()
    >>> filepaths = ["/sub-01/anat/sub-01_rec-CSD_T1w.nii.gz",
    >>> "/sub-01/anat/sub-01_acq-23_rec-CSD_T1w.exe", #wrong extension
    >>> "/participants.tsv"]
    >>> for filepath in filepaths:
    >>>     print( validator.is_bids(filepath) )
    True
    False
    True
    """

    def __init__(self, index_associated=True):
        self.dir_rules=os.path.join(os.path.dirname(__file__)) + "/rules/"
        self.index_associated = index_associated

    def is_bids(self, path):
        """Checks if a file path appropriate for BIDS.

        Main method of the validator. uses other class methods for checking
        different aspects of the file path.

        Parameters
        ----------
            path: string
                A path of a file you want to check.

        Examples
        --------
        >>> from bids.grabbids import BIDSValidator
        >>> validator = BIDSValidator()
        >>> validator.is_bids("/sub-01/ses-test/anat/sub-01_ses-test_rec-CSD_run-23_T1w.nii.gz")
        True
        >>> validator.is_bids("/sub-01/ses-test/sub-01_run-01_dwi.bvec") # missed session in the filename
        False
        """

        conditions = []

        conditions.append(self.is_top_level(path))
        conditions.append(self.is_associated_data(path))
        conditions.append(self.is_session_level(path))
        conditions.append(self.is_subject_level(path))
        conditions.append(self.is_phenotypic(path))
        conditions.append(self.is_file(path))

        return (any(conditions))


    def is_top_level(self, path):
        ''' Check if the file has appropriate name for a top-level file. '''

        with open(self.dir_rules + 'fixed_top_level_names.json', 'r') as f:
            fixed_top_level_json = json.load(f)
            fixed_top_level_names = fixed_top_level_json['fixed_top_level_names']

        regexps = self.get_regular_expressions(self.dir_rules
                    + 'top_level_rules.json')

        conditions = [False if re.compile(x).search(path) is None else True for x
                      in regexps]

        conditions.append(path in fixed_top_level_names)

        return (any(conditions))

    def is_associated_data(self, path):
        ''' Check if file is appropriate associated data. '''
        if not self.index_associated:
            return False

        regexps = self.get_regular_expressions(self.dir_rules
                    + 'associated_data_rules.json')

        conditions = [(re.compile(x).search(path) is not None) for x in regexps]

        return any(conditions)

    def is_session_level(self, path):
        ''' Check if the file has appropriate name for a session level. '''
        regexps = self.get_regular_expressions(self.dir_rules
                    + 'session_level_rules.json')

        conditions = [self.conditional_match(x, path) for x in regexps]

        return (any(conditions))

    def is_subject_level(self, path):
        ''' Check if the file has appropriate name for a subject level. '''
        regexps = self.get_regular_expressions(self.dir_rules
                    + 'subject_level_rules.json')

        conditions = [(re.compile(x).search(path) is not None) for x in regexps]

        return (any(conditions))



    def is_phenotypic(self, path):
        ''' Check if file is phenotypic data. '''
        regexps = self.get_regular_expressions(self.dir_rules
                    + 'phenotypic_rules.json')

        conditions = [(re.compile(x).search(path) is not None) for x in regexps]

        return (any(conditions))

    def is_file(self, path):
        ''' Check if file is phenotypic data. '''
        regexps = self.get_regular_expressions(self.dir_rules
                    + 'file_level_rules.json')

        conditions = [(re.compile(x).search(path) is not None) for x in regexps]

        return (any(conditions))

    def get_regular_expressions(self, fileName):

        regexps = []

        with open(fileName, 'r') as f:
            rules = json.load(f)

        for key in list(rules.keys()):
            rule = rules[key]

            regexp = rule["regexp"]

            if "tokens" in rule:
                tokens = rule["tokens"]

                for token in list(tokens):
                    regexp = regexp.replace(token, "|".join(tokens[token]))

            regexps.append(regexp)

        return regexps


    def get_path_values(self, path):
        ''' Takes a file path and returns values found for the following path
        keys:
            sub-
            ses-
        '''
        values = {}

        regexps = self.get_regular_expressions(self.dir_rules + 'path.json')

        # capture subject
        for paths in ['sub', 'ses']:
            match = re.compile(regexps[paths]).findall(path)
            values[paths] = match[1] if match & match[1] else None

        return values

    def conditional_match(self, expression, path):
        match = re.compile(expression).findall(path)
        match = match[0] if len(match) >= 1 else False
        # adapted from JS code and JS does not support conditional groups
        if (match):
            if ((match[1] == match[2][1:]) | (not match[1])):
                return True
            else:
                return False
        else:
            return False
