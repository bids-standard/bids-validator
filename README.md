# BIDS-Validator

## Use

### In the Browser

The BIDS Validator currently works in the browser with [browserify](http://browserify.org/). You can add it to a browserify project by cloning the validator and requiring it with browserify syntax ```var validate = require('bids-validator');```. It can then be used like so ```validate.BIDS(filelist, function (errors) {console.log(errors);});```

### On the Server

The BIDS validator works like most npm packages. You can install it by running ```npm install bids-validator```. 

### Through Command Line

If you install the bids validator globally by using ```npm install -g bids-validator``` you will be able to use it as a command line tool. Once installed you should be able to run ```bids-validator /path/to/your/bids/directory``` and see any validation issues logged to the terminal.

## Development

To develop locally, clone the project and run ```npm install``` from the project root. This will install external dependencies.

### Testing

To start the test suite run ```npm test``` from the project root.
