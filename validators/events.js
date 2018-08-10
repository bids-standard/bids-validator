/* eslint-disable no-unused-vars */
var Issue = require('../utils').issues.Issue;

var checkStimuli = function (stimuli, issues) {
    const stimuliFromEvents = stimuli.events;
    const stimuliFromDirectory = stimuli.directory;
    if (stimuliFromDirectory) {
        const unusedStimuli = stimuliFromDirectory.filter(function(stimuli) {
            return stimuliFromEvents.indexOf(stimuli.relativePath) < 0;
        });
        for (let key in unusedStimuli) {
            const stimulus = unusedStimuli[key];
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