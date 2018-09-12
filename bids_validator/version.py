from __future__ import absolute_import, division, print_function
import os

CLASSIFIERS = ["Development Status :: 3 - Alpha",
               "Environment :: Console",
               "Intended Audience :: Science/Research",
               "License :: OSI Approved :: MIT License",
               "Operating System :: OS Independent",
               "Programming Language :: Python",
               "Topic :: Scientific/Engineering"]

NAME = "bids-validator"
MAINTAINER = "BIDS Developers"
MAINTAINER_EMAIL = "bids-discussion@googlegroups.com"
DESCRIPTION = "Python package for validation of BIDS projects."
URL = "https://github.com/INCF/bids-validator"
DOWNLOAD_URL = ""
LICENSE = "MIT"
AUTHOR = "PyBIDS developers"
AUTHOR_EMAIL = "bids-discussion@googlegroups.com"
PLATFORMS = "OS Independent"
# No data for now
REQUIRES = []


def package_files(directory):
    # from https://stackoverflow.com/questions/27664504/how-to-add-package-data-recursively-in-python-setup-py
    paths = []
    for (path, directories, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('..', path, filename))
    return paths


PACKAGE_DATA = {
    'bids_validator': package_files('bids_validator/rules')
}
