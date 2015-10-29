![](https://circleci.com/gh/INCF/bids-validator.svg?style=shield&circle-token=:circle-token)

# BIDS-Validator

## Use

### API

The BIDS Validator has one primary method that takes a directory as either a path to the directory (node) or the object given by selecting a directory with a file input (browser), an options object, and a callback.

Available options include:
* ignoreWarnings - (boolean - defaults to false)
* ignoreNiftiHeaders - (boolean - defaults to false)

For example:

```validate.BIDS(directory, {ignoreWarnings: true}, function (errors, warnings) {console.log(errors, warnings);});```

If you would like to test individual files you can use the file specific checks that we expose.
* validate.BIDS()
* validate.JSON()
* validate.TSV()
* validate.NIFTI()

### In the Browser

The BIDS Validator currently works in the browser with [browserify](http://browserify.org/). You can add it to a browserify project by cloning the validator and requiring it with browserify syntax ```var validate = require('bids-validator');```.

### On the Server

The BIDS validator works like most npm packages. You can install it by running ```npm install bids-validator```.

### Through Command Line

If you install the bids validator globally by using ```npm install -g bids-validator``` you will be able to use it as a command line tool. Once installed you should be able to run ```bids-validator /path/to/your/bids/directory``` and see any validation issues logged to the terminal. Run ```bids-validor``` without a directory path to see available options.

## Development

To develop locally, clone the project and run ```npm install``` from the project root. This will install external dependencies.

### Testing

To start the test suite run ```npm test``` from the project root.
