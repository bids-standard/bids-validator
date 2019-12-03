"""BIDS validator common Python package."""
from ._version import get_versions
from .bids_validator import BIDSValidator
__version__ = get_versions()['version']
__all__ = ['BIDSValidator']
del get_versions

from ._version import get_versions
__version__ = get_versions()['version']
del get_versions
