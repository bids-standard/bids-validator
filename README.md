# BIDS-Validator

## Use

### In the Browser

The BIDS Validator currently works in the browser with [browserify](http://browserify.org/). You can add it to a browserify project by cloning the validator and requiring it with browserify synstax ```var validate = require('BIDS-Validator');```. It can then be used like so ```validate.BIDS(filelist, function (errors) {console.log(errors);});```

### On the Server

The BIDS validator works like most npm packages. It is not yet in the npm registry but will be soon. When it is you can install it by running ```npm install BIDS-Validator```. 

### Through Command Line

Currently if you have the node js install and have the BIDS-Validator you can validate you BIDS package through command line by running ```node path/to/BIDS-Validator/index.js path/to/Bids/data/folder```. If there are any errors it should return them to the console.

## Development

To develop locally, clone the project and run ```npm install``` from the project root. This will install external dependencies.

### Testing

To start the test suite run ```npm test``` from the project root.
