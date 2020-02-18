const utils = require('../../utils')
const Issue = utils.issues.Issue

/**
 * NIFTI
 *
 * Takes a NifTi header, a file path and a callback
 * as arguments. And calls back with any issues
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI(
  header,
  file,
  jsonContentsDict,
  bContentsDict,
  fileList,
  events,
  callback,
) {
  const path = file.relativePath
  const issues = []
  const potentialSidecars = utils.files.potentialLocations(
    path.replace('.gz', '').replace('.nii', '.json'),
  )
  const potentialEvents = utils.files.potentialLocations(
    path.replace('.gz', '').replace('bold.nii', 'events.tsv'),
  )
  const mergedDictionary = utils.files.generateMergedSidecarDict(
    potentialSidecars,
    jsonContentsDict,
  )
  const sidecarMessage =
    'It can be included one of the following locations: ' +
    potentialSidecars.join(', ')
  const eventsMessage =
    'It can be included one of the following locations: ' +
    potentialEvents.join(', ')

  if (path.includes('_asl.nii')) {
    if (!mergedDictionary.hasOwnProperty('LabelingType')) {
      issues.push(
        new Issue({
          file: file,
          code: 104,
          reason:
            "You should define 'LabelingType' for this file. If you don't provide this information CBF quantification will not be possible. " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('PulseSequenceType')) {
      issues.push(
        new Issue({
          file: file,
          code: 131,
          reason:
            "You should define 'PulseSequenceType' for this file. If you don't provide this information CBF quantification will not be possible. " +
            sidecarMessage,
        }),
      )
    }
    if (
      mergedDictionary.hasOwnProperty('LabelingType') &&
      mergedDictionary['LabelingType'].constructor === String
    ) {
      const LabelingTypeString = mergedDictionary['LabelingType']
      if (LabelingTypeString == 'PCASL' || LabelingTypeString == 'CASL') {
        if (!mergedDictionary.hasOwnProperty('AverageLabelingGradient')) {
          issues.push(
            new Issue({
              file: file,
              code: 115,
              reason:
                "You should define 'AverageLabelingGradient' for this file." +
                sidecarMessage,
            }),
          )
        }
      }
      if (LabelingTypeString == 'PCASL') {
        if (!mergedDictionary.hasOwnProperty('FlipAngleOfB1LabelingPulses')) {
          issues.push(
            new Issue({
              file: file,
              code: 116,
              reason:
                "You should define 'FlipAngleOfB1LabelingPulses' for this file." +
                sidecarMessage,
            }),
          )
        }
        if (!mergedDictionary.hasOwnProperty('PCASLType')) {
          issues.push(
            new Issue({
              file: file,
              code: 122,
              reason:
                "You should define 'PCASLType' for this file." + sidecarMessage,
            }),
          )
        }
      }
      if (LabelingTypeString == 'PASL') {
        if (!mergedDictionary.hasOwnProperty('LabelingSlabThickness')) {
          issues.push(
            new Issue({
              file: file,
              code: 117,
              reason:
                "You should define 'LabelingSlabThickness' for this file." +
                sidecarMessage,
            }),
          )
        }
        if (!mergedDictionary.hasOwnProperty('BolusCutOffFlag')) {
          issues.push(
            new Issue({
              file: file,
              code: 123,
              reason:
                "You should define 'BolusCutOffFlag' for this file." +
                sidecarMessage,
            }),
          )
        }
        if (
          mergedDictionary.hasOwnProperty('BolusCutOffFlag') &&
          mergedDictionary['BolusCutOffFlag'].constructor === Boolean
        ) {
          const BolusCutOffFlagBoolean = mergedDictionary['BolusCutOffFlag']
          if (
            BolusCutOffFlagBoolean &&
            !mergedDictionary.hasOwnProperty('BolusCutOffTimingSequence')
          ) {
            issues.push(
              new Issue({
                file: file,
                code: 124,
                reason:
                  "You should define 'BolusCutOffTimingSequence' for this file." +
                  sidecarMessage,
              }),
            )
          }
          if (
            BolusCutOffFlagBoolean &&
            !mergedDictionary.hasOwnProperty('BolusCutOffDelayTime')
          ) {
            issues.push(
              new Issue({
                file: file,
                code: 125,
                reason:
                  "You should define 'BolusCutOffDelayTime' for this file." +
                  sidecarMessage,
              }),
            )
          }
          if (
            BolusCutOffFlagBoolean &&
            !mergedDictionary.hasOwnProperty('BolusCutOffTechnique')
          ) {
            issues.push(
              new Issue({
                file: file,
                code: 126,
                reason:
                  "You should define 'BolusCutOffTechnique' for this file." +
                  sidecarMessage,
              }),
            )
          }
        }
      }
    }
    if (!mergedDictionary.hasOwnProperty('SliceSelectiveLabelingGradient')) {
      issues.push(
        new Issue({
          file: file,
          code: 127,
          reason:
            "You should define 'SliceSelectiveLabelingGradient' for this file." +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('LabelingDuration')) {
      issues.push(
        new Issue({
          file: file,
          code: 105,
          reason:
            "You should define 'LabelingDuration' for this file. If you don't provide this information CBF quantification will not be possible. " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('InitialPostLabelDelay')) {
      issues.push(
        new Issue({
          file: file,
          code: 106,
          reason:
            "You should define 'InitialPostLabelDelay' for this file. If you don't provide this information CBF quantification will not be possible. " +
            sidecarMessage,
        }),
      )
    }
    
    if (!mergedDictionary.hasOwnProperty('BackgroundSuppression')) {
      issues.push(
        new Issue({
          file: file,
          code: 107,
          reason:
            "You should define 'BackgroundSuppression' for this file. If you don't provide this information CBF quantification will be biased. " +
            sidecarMessage,
        }),
      )
    }
    if (
      mergedDictionary.hasOwnProperty('BackgroundSuppression') &&
      !mergedDictionary.hasOwnProperty('BackgroundSuppressionPulseTime')
    ) {
      issues.push(
        new Issue({
          file: file,
          code: 120,
          reason:
            "You should define 'BackgroundSuppressionPulseTime' for this file. " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('VascularCrushing')) {
      issues.push(
        new Issue({
          file: file,
          code: 108,
          reason:
            "You should define 'VascularCrushing' for this file. If you don't provide this information CBF quantification will be biased. " +
            sidecarMessage,
        }),
      )
    }
    if (
      mergedDictionary.hasOwnProperty('VascularCrushing') &&
      !mergedDictionary.hasOwnProperty['VascularCrushingVenc']
    ) {
      issues.push(
        new Issue({
          file: file,
          code: 121,
          reason:
            "You should define 'VascularCrushingVenc' for this file. " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('ASLContext')) {
      issues.push(
        new Issue({
          file: file,
          code: 109,
          reason:
            "You should define 'ASLContext' for this file. If you don't provide this information CBF quantification is not possible since the order of Control/Label is not defined. " +
            sidecarMessage,
        }),
      )
    }
    // check if ASLContext lenght is compatible with 4th dimension of nifti file
    if (
      header &&
      mergedDictionary.hasOwnProperty('ASLContext') &&
      mergedDictionary['ASLContext'].constructor === String
    ) {
      var ASLContextString = mergedDictionary['ASLContext']
      var ASLContextStringVolumes = 0
      const kDim = header.dim[4]
      var ASLContextString_error_message=false
      try {
        ASLContextString=ASLContextString.split('Control').join('1')
        ASLContextString=ASLContextString.split('Label').join('1')
        ASLContextString=ASLContextString.split('M0Scan').join('1')
        ASLContextString=ASLContextString.split('M0').join('1')
        //ASLContextString=ASLContextString.split('_').join('+')
        //ASLContextString=ASLContextString.split('x').join('*')
        // we need to add check for other undesiderated characters
        ASLContextStringVolumes = eval(ASLContextString)
      }
      catch (error) {
        ASLContextString_error_message=true
        console.error(error)
      }
      if (ASLContextStringVolumes !== kDim || ASLContextString_error_message) {
        issues.push(
          new Issue({
            file: file,
            code: 110,
            evidence:
              'ASLContext string is ' + mergedDictionary['ASLContext'] +
              'and provided ' + ASLContextStringVolumes + 
              ' volumes however the number of volumes in the asl corresponding nifti header is (4th dimension) ' +
              kDim +
              '. Please check also the sintax of the ASLContext field.',
          }),
        )
      }
    }
    if (!mergedDictionary.hasOwnProperty('MRSoftwareVersion')) {
      issues.push(
        new Issue({
          file: file,
          code: 111,
          reason:
            "You should define 'MRSoftwareVersion' for this file.  " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('LabelingSlabLocation')) {
      issues.push(
        new Issue({
          file: file,
          code: 112,
          reason:
            "You should define 'LabelingSlabLocation' for this file.  " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('LabelingOrientation')) {
      issues.push(
        new Issue({
          file: file,
          code: 113,
          reason:
            "You should define 'LabelingOrientation' for this file.  " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('LabelingDistance')) {
      issues.push(
        new Issue({
          file: file,
          code: 114,
          reason:
            "You should define 'LabelingDistance' for this file.  " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('AcquisitionResolution')) {
      issues.push(
        new Issue({
          file: file,
          code: 118,
          reason:
            "You should define 'AcquisitionResolution' for this file.  " +
            sidecarMessage,
        }),
      )
    } else {
      var AcquisitionResolution = mergedDictionary['AcquisitionResolution']
      if (AcquisitionResolution.length != 3) {
        issues.push(
          new Issue({
            file: file,
            code: 118,
            reason:
              "The 'AcquisitionResolution' field length is not 3. AcquisitionResolution must be defined as a vector of length 3.  " +
              sidecarMessage,
          }),
        )
      }
    }
    if (!mergedDictionary.hasOwnProperty('AcquisitionDuration')) {
      issues.push(
        new Issue({
          file: file,
          code: 119,
          reason:
            "You should define 'AcquisitionDuration' for this file.  " +
            sidecarMessage,
        }),
      )
    }
    if (!mergedDictionary.hasOwnProperty('M0')) {
      issues.push(
        new Issue({
          file: file,
          code: 129,
          reason: "You should define 'M0' for this file.  " + sidecarMessage,
        }),
      )
    } else if (
      mergedDictionary.hasOwnProperty('M0') &&
      mergedDictionary['M0'].constructor === String
    ) {
      const M0String = mergedDictionary['M0']
      if (M0String != 'Control') {
        checkIfIntendedExists(M0String, fileList, issues, file)
        checkIfValidFiletype(M0String, issues, file)
      }
    } else if (
      mergedDictionary.hasOwnProperty('M0') &&
      mergedDictionary['M0'].constructor === Boolean
    ) {
      if ( mergedDictionary['M0'] &&
        mergedDictionary.hasOwnProperty('ASLContext') &&
        mergedDictionary['ASLContext'].constructor === String
      ) {
          const ASLContextString = mergedDictionary['ASLContext']
          if (!ASLContextString.includes('M0')) {
            issues.push(
              new Issue({
                file: file,
                code: 130,
                reason: "ASLContext " + mergedDictionary['ASLContext'] + " does not contain any M0 (M0Scan) that is required, since you specified True in the M0 field.  " + sidecarMessage,
              }),
            )
          }
        }
      }
    }
  if (path.includes('_dwi.nii')) {
    const potentialBvecs = utils.files.potentialLocations(
      path.replace('.gz', '').replace('.nii', '.bvec'),
    )
    const potentialBvals = utils.files.potentialLocations(
      path.replace('.gz', '').replace('.nii', '.bval'),
    )
    const bvec = utils.files.getBFileContent(potentialBvecs, bContentsDict)
    const bval = utils.files.getBFileContent(potentialBvals, bContentsDict)
    const bvecMessage =
      'It can be included in one of the following locations: ' +
      potentialBvecs.join(', ')
    const bvalMessage =
      'It can be included in one of the following locations: ' +
      potentialBvals.join(', ')

    if (!bvec) {
      issues.push(
        new Issue({
          code: 32,
          file: file,
          reason:
            '_dwi scans should have a corresponding .bvec file. ' + bvecMessage,
        }),
      )
    }
    if (!bval) {
      issues.push(
        new Issue({
          code: 33,
          file: file,
          reason:
            '_dwi scans should have a corresponding .bval file. ' + bvalMessage,
        }),
      )
    }

    if (bval && bvec && header) {
      /*
        bvec length ==3 is checked at bvec.spec.js hence following if loop doesnot have else block
        */
      if (bvec.replace(/^\s+|\s+$/g, '').split('\n').length === 3) {
        const volumes = [
          bvec
            .split('\n')[0]
            .replace(/^\s+|\s+$/g, '')
            .split(' ').length, // bvec row 1 length
          bvec
            .split('\n')[1]
            .replace(/^\s+|\s+$/g, '')
            .split(' ').length, // bvec row 2 length
          bvec
            .split('\n')[2]
            .replace(/^\s+|\s+$/g, '')
            .split(' ').length, // bvec row 3 length
          bval.replace(/^\s+|\s+$/g, '').split(' ').length, // bval row length
          header.dim[4], // header 4th dimension
        ]

        if (
          !volumes.every(function(v) {
            return v === volumes[0]
          })
        ) {
          issues.push(
            new Issue({
              code: 29,
              file: file,
            }),
          )
        }
      }
    }
  }

  if (missingEvents(path, potentialEvents, events)) {
    issues.push(
      new Issue({
        code: 25,
        file: file,
        reason:
          'Task scans should have a corresponding events.tsv file. ' +
          eventsMessage,
      }),
    )
  }

  let repetitionTime, repetitionUnit
  if (header) {
    // Define repetition time from header and coerce to seconds.
    repetitionTime = header.pixdim[4]
    repetitionUnit =
      header.xyzt_units && header.xyzt_units[3] ? header.xyzt_units[3] : null
    if (repetitionUnit === 'ms') {
      repetitionTime = repetitionTime / 1000
      repetitionUnit = 's'
    }
    if (repetitionUnit === 'us') {
      repetitionTime = repetitionTime / 1000000
      repetitionUnit = 's'
    }
  }

  if (!mergedDictionary.invalid) {
    // task scan checks
    if (
      path.includes('_task-') &&
      !path.includes('_defacemask.nii') &&
      !path.includes('_sbref.nii')
    ) {
      if (!mergedDictionary.hasOwnProperty('TaskName')) {
        issues.push(
          new Issue({
            file: file,
            code: 50,
            reason:
              "You have to define 'TaskName' for this file. " + sidecarMessage,
          }),
        )
      }
    }

    // field map checks
    if (
      path.includes('_bold.nii') ||
      path.includes('_sbref.nii') ||
      path.includes('_dwi.nii') ||
      path.includes('_asl.nii') ||
      path.includes('_M0Scan.nii')
    ) {
      if (!mergedDictionary.hasOwnProperty('EchoTime')) {
        issues.push(
          new Issue({
            file: file,
            code: 6,
            reason:
              "You should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible. " +
              sidecarMessage,
          }),
        )
      }
      if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
        issues.push(
          new Issue({
            file: file,
            code: 7,
            reason:
              "You should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible. " +
              sidecarMessage,
          }),
        )
      }
      if (!mergedDictionary.hasOwnProperty('EffectiveEchoSpacing')) {
        issues.push(
          new Issue({
            file: file,
            code: 8,
            reason:
              "You should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible. " +
              sidecarMessage,
          }),
        )
      }
    }
    if (path.includes('_dwi.nii')) {
      if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
        issues.push(
          new Issue({
            file: file,
            code: 9,
            reason:
              "You should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible. " +
              sidecarMessage,
          }),
        )
      }
    }

    // we don't need slice timing or repetition time for SBref
    if (path.includes('_bold.nii') || path.includes('_asl.nii')) {
      if (!mergedDictionary.hasOwnProperty('RepetitionTime')) {
        issues.push(
          new Issue({
            file: file,
            code: 10,
            reason:
              "You have to define 'RepetitionTime' for this file. " +
              sidecarMessage,
          }),
        )
      } else if (
        header &&
        mergedDictionary.EffectiveEchoSpacing &&
        mergedDictionary.PhaseEncodingDirection
      ) {
        var axes = { i: 1, j: 2, k: 3 }
        if (
          mergedDictionary.EffectiveEchoSpacing *
            header.dim[axes[mergedDictionary.PhaseEncodingDirection[0]]] >
          mergedDictionary.RepetitionTime
        ) {
          issues.push(
            new Issue({
              file: file,
              code: 76,
              reason:
                "Abnormally high value of 'EffectiveEchoSpacing' (" +
                mergedDictionary.EffectiveEchoSpacing +
                ' seconds).',
            }),
          )
        }
      }

      if (typeof repetitionTime === 'undefined' && header) {
        issues.push(
          new Issue({
            file: file,
            code: 75,
          }),
        )
      } else if (mergedDictionary.RepetitionTime && header) {
        if (repetitionUnit !== 's') {
          issues.push(
            new Issue({
              file: file,
              code: 11,
            }),
          )
        } else {
          const niftiTR = Number(repetitionTime.toFixed(3))
          const jsonTR = Number(mergedDictionary.RepetitionTime.toFixed(3))
          if (niftiTR !== jsonTR) {
            issues.push(
              new Issue({
                file: file,
                code: 12,
                reason:
                  'Repetition time defined in the JSON (' +
                  jsonTR +
                  ' sec.) did not match the one defined in the NIFTI header (' +
                  niftiTR +
                  ' sec.)',
              }),
            )
          }
        }
      }

      // check that slice timing is defined
      if (!mergedDictionary.hasOwnProperty('SliceTiming')) {
        issues.push(
          new Issue({
            file: file,
            code: 13,
            reason:
              "You should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible. " +
              sidecarMessage,
          }),
        )
      }

      // check that slice timing has the proper length
      if (
        header &&
        mergedDictionary.hasOwnProperty('SliceTiming') &&
        mergedDictionary['SliceTiming'].constructor === Array
      ) {
        const sliceTimingArray = mergedDictionary['SliceTiming']
        const kDim = header.dim[3]
        if (sliceTimingArray.length !== kDim) {
          issues.push(
            new Issue({
              file: file,
              code: 87,
              evidence:
                'SliceTiming array is of length ' +
                sliceTimingArray.length +
                " and the value of the 'k' dimension is " +
                kDim +
                ' for the corresponding nifti header.',
            }),
          )
        }
      }

      // check that slice timing values are greater than repetition time
      if (
        mergedDictionary.hasOwnProperty('SliceTiming') &&
        mergedDictionary['SliceTiming'].constructor === Array
      ) {
        const SliceTimingArray = mergedDictionary['SliceTiming']
        const valuesGreaterThanRepetitionTime = sliceTimingGreaterThanRepetitionTime(
          SliceTimingArray,
          mergedDictionary['RepetitionTime'],
        )
        if (valuesGreaterThanRepetitionTime.length > 0) {
          issues.push(
            new Issue({
              file: file,
              code: 66,
              evidence: valuesGreaterThanRepetitionTime,
            }),
          )
        }
      }
    } else if (path.includes('_phasediff.nii')) {
      if (
        !mergedDictionary.hasOwnProperty('EchoTime1') ||
        !mergedDictionary.hasOwnProperty('EchoTime2')
      ) {
        issues.push(
          new Issue({
            file: file,
            code: 15,
            reason:
              "You have to define 'EchoTime1' and 'EchoTime2' for this file. " +
              sidecarMessage,
          }),
        )
      }
      if (
        mergedDictionary.hasOwnProperty('EchoTime1') &&
        mergedDictionary.hasOwnProperty('EchoTime2')
      ) {
        const echoTimeDifference =
          mergedDictionary['EchoTime2'] - mergedDictionary['EchoTime1']
        if (echoTimeDifference < 0.0001 || echoTimeDifference > 0.01) {
          issues.push(
            new Issue({
              file: file,
              code: 83,
              reason:
                'The value of (EchoTime2 - EchoTime1) should be within the range of 0.0001 - 0.01. ' +
                sidecarMessage,
            }),
          )
        }
      }
    } else if (path.includes('_phase1.nii') || path.includes('_phase2.nii')) {
      if (!mergedDictionary.hasOwnProperty('EchoTime')) {
        issues.push(
          new Issue({
            file: file,
            code: 16,
            reason:
              "You have to define 'EchoTime' for this file. " + sidecarMessage,
          }),
        )
      }
    } else if (path.includes('_fieldmap.nii')) {
      if (!mergedDictionary.hasOwnProperty('Units')) {
        issues.push(
          new Issue({
            file: file,
            code: 17,
            reason:
              "You have to define 'Units' for this file. " + sidecarMessage,
          }),
        )
      }
    } else if (path.includes('_epi.nii')) {
      if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
        issues.push(
          new Issue({
            file: file,
            code: 18,
            reason:
              "You have to define 'PhaseEncodingDirection' for this file. " +
              sidecarMessage,
          }),
        )
      }
      if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
        issues.push(
          new Issue({
            file: file,
            code: 19,
            reason:
              "You have to define 'TotalReadoutTime' for this file. " +
              sidecarMessage,
          }),
        )
      }
    }

    if (
      utils.type.file.isFieldMapMainNii(path) &&
      mergedDictionary.hasOwnProperty('IntendedFor')
    ) {
      const intendedFor =
        typeof mergedDictionary['IntendedFor'] == 'string'
          ? [mergedDictionary['IntendedFor']]
          : mergedDictionary['IntendedFor']

      for (let key = 0; key < intendedFor.length; key++) {
        const intendedForFile = intendedFor[key]
        checkIfIntendedExists(intendedForFile, fileList, issues, file)
        checkIfValidFiletype(intendedForFile, issues, file)
      }
    }
    if (path.includes('_M0Scan.nii')) {
      if (mergedDictionary.hasOwnProperty('IntendedFor')) {
        const intendedFor =
          typeof mergedDictionary['IntendedFor'] == 'string'
            ? [mergedDictionary['IntendedFor']]
            : mergedDictionary['IntendedFor']
        for (let key = 0; key < intendedFor.length; key++) {
          const intendedForFile = intendedFor[key]
          checkIfIntendedExists(intendedForFile, fileList, issues, file)
          checkIfValidFiletype(intendedForFile, issues, file)
        }
      } else {
        issues.push(
          new Issue({
            file: file,
            code: 128,
            reason:
              "You have to define 'IntendedFor' for this file. " +
              sidecarMessage,
          }),
        )
      }
    }
  }
  callback(issues)
}

function missingEvents(path, potentialEvents, events) {
  let hasEvent = false,
    isRest = false

  // check if is a rest file
  const pathParts = path.split('/')
  const filenameParts = pathParts[pathParts.length - 1].split('_')
  for (let i = 0; i < filenameParts.length; i++) {
    const part = filenameParts[i]
    if (part.toLowerCase().indexOf('task') === 0 && part.indexOf('rest') > -1) {
      isRest = true
    }
  }

  // check for event file
  for (let j = 0; j < potentialEvents.length; j++) {
    const event = potentialEvents[j]
    if (events.find(e => e.path == event)) {
      hasEvent = true
    }
  }

  return !isRest && path.includes('_bold.nii') && !hasEvent
}

/**
 * Function to check each SliceTime from SliceTiming Array
 *
 */

function sliceTimingGreaterThanRepetitionTime(array, repetitionTime) {
  const invalid_timesArray = []
  for (let t = 0; t < array.length; t++) {
    if (array[t] > repetitionTime) {
      invalid_timesArray.push(array[t])
    }
  }
  return invalid_timesArray
}

function checkIfIntendedExists(intendedForFile, fileList, issues, file) {
  const intendedForFileFull =
    '/' + file.relativePath.split('/')[1] + '/' + intendedForFile
  let onTheList = false

  for (let key2 in fileList) {
    if (key2) {
      const filePath = fileList[key2].relativePath
      if (filePath === intendedForFileFull) {
        onTheList = true
      }
    }
  }
  if (!onTheList) {
    issues.push(
      new Issue({
        file: file,
        code: 37,
        reason:
          "'IntendedFor' property of this fieldmap  ('" +
          file.relativePath +
          "') does not point to an existing file('" +
          intendedForFile +
          "'). Please mind that this value should not include subject level directory " +
          "('/" +
          file.relativePath.split('/')[1] +
          "/').",
        evidence: intendedForFile,
      }),
    )
  }
}

function checkIfValidFiletype(intendedForFile, issues, file) {
  const validFiletype = new RegExp('.nii(.gz)?$')
  const isValidFiletype = validFiletype.test(intendedForFile)
  if (!isValidFiletype) {
    issues.push(
      new Issue({
        file: file,
        code: 37,
        reason: `Invalid filetype: IntendedFor should point to the .nii[.gz] files.`,
        evidence: intendedForFile,
      }),
    )
  }
}
