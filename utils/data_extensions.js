module.exports = new RegExp(
  [
    '^.*\\.(',
    'nii|nii\\.gz|', // MRI
    'fif|fif\\.gz|sqd|con|kdf|chn|trg|raw|raw\\.mhf|', // MEG
    'eeg|vhdr|vmrk|edf|cnt|bdf|set|fdt|dat|nwb|tdat|tidx|tmet', // EEG/iEEG
    ')$',
  ].join(''),
)
