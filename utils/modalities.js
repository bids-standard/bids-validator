module.exports = {
  /**
   * Group
   *
   * Takes an array of modalities and looks for
   * groupings defined in 'modalityGroups' and
   * replaces any perfectly matched groupings with
   * the grouping object key.
   */
  group: function(modalities) {
    var modalityGroups = [
      [['magnitude1', 'magnitude2', 'phase1', 'phase2'], 'fieldmap'],
      [['magnitude1', 'magnitude2', 'phasediff'], 'fieldmap'],
      [['magnitude1', 'phasediff'], 'fieldmap'],
      [['magnitude', 'fieldmap'], 'fieldmap'],
      [['epi'], 'fieldmap'],
    ]

    for (
      var groupTouple_i = 0;
      groupTouple_i < modalityGroups.length;
      groupTouple_i++
    ) {
      var groupSet = modalityGroups[groupTouple_i][0]
      var groupName = modalityGroups[groupTouple_i][1]
      var match = true
      for (var i = 0; i < groupSet.length; i++) {
        if (modalities.indexOf(groupSet[i]) === -1) {
          match = false
        }
      }
      if (match) {
        modalities.push(groupName)
        for (var j = 0; j < groupSet.length; j++) {
          modalities.splice(modalities.indexOf(groupSet[j]), 1)
        }
      }
    }

    return modalities
  },

  isCorrectModality: (path, options) => {
    let isCorrectModality = false
    // MRI
    if (
      path[0].includes('.nii') &&
      ['anat', 'func', 'dwi'].indexOf(path[1]) != -1
    ) {
      isCorrectModality = true
    } else if (path[0].includes('.json')) {
      const testPath = path[1]
      switch (testPath) {
        case 'meg':
          // MEG
          isCorrectModality = true
          break
        case 'eeg':
          // EEG
          isCorrectModality = !!options.bep006
          break
        case 'ieeg':
          // iEEG
          isCorrectModality = !!options.bep010
          break
        default:
          break
      }
    }
    return isCorrectModality
  },
}
