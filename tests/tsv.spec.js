var assert   = require('assert');
var validate = require('../index');

describe('TSV', function(){

    var file = {
        name: 'sub-08_ses-test_task-linebisection_events.tsv',
        relativePath: '/sub-08/ses-test/func/sub-08_ses-test_task-linebisection_events.tsv'
    };

    it('should not allow empty values saved as empty cells.', function () {
        var tsv = "1.0\t\t0.2\tresponse 1\t12.32";
        validate.TSV(file, tsv, false, function (errors) {
            assert(errors && errors.length > 0);
        });

    });

    it('should not allow missing values that are specified by something other than "n/a".', function () {
        var tsv = "1.0\tNA\t0.2\tresponse 1\t12.32";
        validate.TSV(file, tsv, false, function (errors) {
            assert(errors && errors.length > 0);
        });
    });

    it('should not allow different length rows', function () {
        var tsv = 'header-one\theader-two\theader-three\n' +
                  'value-one\tvalue-two\n' +
                  'value-one\tvalue-two\tvalue-three';
        validate.TSV(file, tsv, false, function (errors) {
            assert(errors && errors.length > 0);
        });
    });

    it('require events files to have "onset" and "duration" columns', function () {
        var tsv = 'header-one\theader-two\t4eader-three\n' +
                  'value-one\tvalue-two\tvalue-three';
        validate.TSV(file, tsv, true, function (errors) {
            assert(errors && errors.length > 0);
        });
    });

});