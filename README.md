# BIDS-Validator

## Use

### In the Browser

The BIDS Validator currently works in the browser with [browserify](http://browserify.org/). You can add it to a browserify project by cloning the validator and requiring it with browserify syntax ```var validate = require('bids-validator');```. It can then be used like so ```validate.BIDS(filelist, function (errors) {console.log(errors);});```

### On the Server

The BIDS validator works like most npm packages. You can install it by running ```npm install bids-validator```. 

### Through Command Line

Currently if you have the node js installed and have the bids-validator you can validate you BIDS package through command line by running ```node path/to/bids-validator/index.js path/to/BIDS/data/folder```. If there are any errors it should return them to the console.

## Development

To develop locally, clone the project and run ```npm install``` from the project root. This will install external dependencies.

### Testing

To start the test suite run ```npm test``` from the project root.
