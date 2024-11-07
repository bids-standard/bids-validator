# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'BIDS Validator'
copyright = '2024, BIDS Contributors'
author = 'BIDS Contributors'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    # 'sphinx_js',
    'myst_parser',
    'sphinx_copybutton',
    'sphinx_design',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_book_theme'
html_static_path = ['_static']

html_theme_options = {
    "logo": {
        "text": "The BIDS Validator",
        "image_light": "_static/BIDS_logo_black.svg",
        "image_dark": "_static/BIDS_logo_white.svg",
    },
    "repository_url": "https://github.com/bids-standard/bids-validator",
    "path_to_docs": "docs",
    "use_source_button": True,
    "use_edit_page_button": True,
    "use_repository_button": True,
    "use_issues_button": True,
}

# -- Customization
# js_language = 'typescript'
# js_source_path = '../src/**/*.ts'
# primary_domain = 'js'

myst_enable_extensions = [
    "attrs_inline",
    "colon_fence",
]
