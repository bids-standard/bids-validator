var assert   = require('assert');
var validate = require('../index');

describe('Events', function(){
    it('all files in the /stimuli folder should be included in an _events.tsv file', function () {
        var issues = [];

        // stimuli.events will have all of the
        // files included in the stim_file column of every _events.tsv file.
        // stimuli.directory will have all of the
        // files included in the /stimuli directory.
        var stimuli = {
            events: ['/stimuli/images/red-square.jpg'],
            directory: [{relativePath: '/stimuli/images/blue-square.jpg'}],
        };
        validate.Events.checkStimuli(stimuli, issues);
        assert(issues.length === 1 && issues[0].code === 77);
    });

    it('should not throw issues if all files in the /stimuli folder are included in an _events.tsv file', function () {
        var issues = [];
        var stimuli = {
            events: ['/stimuli/images/red-square.jpg'],
            directory: [{relativePath: '/stimuli/images/red-square.jpg'}],
        };
        validate.Events.checkStimuli(stimuli, issues);
        assert(issues.length === 0);
    });
});