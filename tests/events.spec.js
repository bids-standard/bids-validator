const assert   = require('assert');
const validate = require('../index');

describe('Events', function(){
    const headers = [[{path: 'sub01_task-test_bold.nii.gz', relativePath: 'sub01_task-test_bold.nii.gz'}, {dim: [4, 0, 0, 0, 10]}]];

    it('all files in the /stimuli folder should be included in an _events.tsv file', function () {
        const issues = [];

        // stimuli.events will have all of the
        // files included in the stim_file column of every _events.tsv file.
        // stimuli.directory will have all of the
        // files included in the /stimuli directory.
        const stimuli = {
            events: ['/stimuli/images/red-square.jpg'],
            directory: [{relativePath: '/stimuli/images/blue-square.jpg'}],
        };
        validate.Events.validateEvents([], stimuli, [], {}, issues);
        assert(issues.length === 1 && issues[0].code === 77);
    });

    it('should not throw issues if all files in the /stimuli folder are included in an _events.tsv file', function () {
        const issues = [];
        const stimuli = {
            events: ['/stimuli/images/red-square.jpg'],
            directory: [{relativePath: '/stimuli/images/red-square.jpg'}],
        };
        validate.Events.validateEvents([], stimuli, [], {}, issues);
        assert(issues.length === 0);
    });

    it('should throw an issue if the onset of the last event in _events.tsv is more than TR * number of volumes in corresponding nifti header', function () {
        const issues = [];
        const events = [{
            file: {path: 'sub01_task-test_events.tsv'},
            path: 'sub01_task-test_events.tsv',
            contents: '12\tsomething\tsomething\n'
        }];
        const jsonDictionary = {
            'sub01_task-test_bold.json': {
                RepetitionTime: 1
            }
        };

        validate.Events.validateEvents(events, [], headers, jsonDictionary, issues);
        assert(issues.length === 1 && issues[0].code === 85);
    });

    it('should throw an issue if the onset of the last event in _events.tsv is less than .5 * TR * number of volumes in corresponding nifti header', function () {
        const issues = [];
        const events = [{
            file: {path: 'sub01_task-test_events.tsv'},
            path: 'sub01_task-test_events.tsv',
            contents: '2\tsomething\tsomething\n'
        }];
        const jsonDictionary = {
            'sub01_task-test_bold.json': {
                RepetitionTime: 1
            }
        };

        validate.Events.validateEvents(events, [], headers, jsonDictionary, issues);
        assert(issues.length === 1 && issues[0].code === 86);
    });

    it('should not throw any issues if the onset of the last event in _events.tsv is a reasonable value', function () {
        const issues = [];
        const events = [{
            file: {path: 'sub01_task-test_events.tsv'},
            path: 'sub01_task-test_events.tsv',
            contents: '7\tsomething\tsomething\n'
        }];
        const jsonDictionary = {
            'sub01_task-test_bold.json': {
                RepetitionTime: 1
            }
        };

        validate.Events.validateEvents(events, [], headers, jsonDictionary, issues);
        assert.deepEqual(issues, []);
    });
});