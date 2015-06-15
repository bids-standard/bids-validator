// import validations 
var validate = require('./validate');

// export validations for use in other applications
module.exports = validate;

// import and init command line interface
require('./cli')();

