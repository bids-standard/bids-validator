var async  = require('async');

/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function TSV (contents, callback) {
    var rows = contents.split('\n');
    async.each(rows, function (row, cb) {
        var columnsInRow = row.split('\t');
        async.each(columnsInRow, function (column, cb1) {
	        var patt = new RegExp("[ ]{2,}");
	        if (patt.test(column)) {
	        	console.log(contents);
	        }
	        cb1();
        }, function () {cb();});
    }, function () {
        callback();
    });
};