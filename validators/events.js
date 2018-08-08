/* eslint-disable no-unused-vars */
var Issue = require('../utils').issues.Issue;

var checkStimuli = function (stimuli, issues) {
    var stimuliFromEvents = stimuli.events;
    var stimuliFromDirectory = stimuli.directory;
    // console.log('stimuliFromEvents:', stimuliFromEvents);
    // console.log('event stimuli.length:', stimuliFromEvents.length);
    // console.log('stimuliFromDirectory:', stimuliFromDirectory);
    if (stimuliFromDirectory) {
        var unusedStimuli = stimuliFromDirectory.filter(function(stimuli) {
            // console.log('stimuli.name:', stimuli.file.name);
            return stimuliFromEvents.indexOf(stimuli.relativePath) < 0;
        });
        for (var key in unusedStimuli) {
            var stimulus = unusedStimuli[key];
            // console.log('unused stimulus:', stimulus);
            issues.push(new Issue({
                code: 77,
                file: stimulus,
            }));
        }
    }
    return;
};

module.exports = {
    checkStimuli: checkStimuli,
};