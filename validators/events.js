/* eslint-disable no-unused-vars */
var Issue = require('../utils').issues.Issue;

const Events = function(stimuli, issues) {
    // check that all stimuli files present in /stimuli are included in an _events.tsv file
    checkStimuli(stimuli, issues);
    
    return;
};

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
    Events: Events,
};