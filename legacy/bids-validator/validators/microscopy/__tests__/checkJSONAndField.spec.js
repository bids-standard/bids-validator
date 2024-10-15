import checkJSONAndField from '../checkJSONAndField'

describe('checkJSONAndField()', () => {
  const emptyJsonContentsDict = {
    'test.json': {},
  }
  it('returns no issues with empty arguments', () => {
    const issues = checkJSONAndField({}, {})
    expect(issues.length).toBe(0)
  })

  it('returns issue 225 with no json for ome files', () => {
    const files = {
      ome: [{ relativePath: 'test.ome.tif' }],
    }
    const issues = checkJSONAndField(files, emptyJsonContentsDict)
    expect(issues.length).toBe(1)
    expect(issues[0].code).toBe(225)
  })

  it('returns issue 225 with no json for tif files', () => {
    const files = {
      tif: [{ relativePath: 'test.tif' }],
    }
    const issues = checkJSONAndField(files, emptyJsonContentsDict)
    expect(issues.length).toBe(1)
    expect(issues[0].code).toBe(225)
  })

  it('returns issue 225 with no json for png files', () => {
    const files = {
      png: [{ relativePath: '/test.png' }],
    }
    const issues = checkJSONAndField(files, emptyJsonContentsDict)
    expect(issues.length).toBe(1)
    expect(issues[0].code).toBe(225)
  })

  it('returns warning 223 if chunk entity present but missing metadata', () => {
    const files = {
      ome: [{ relativePath: '/test_chunk-01.ome.tif' }],
    }
    const jsonContentsDict = {
      '/test_chunk-01.json': { testKey: 'testValue' },
    }
    const issues = checkJSONAndField(files, jsonContentsDict)
    expect(issues.length).toBe(1)
    expect(issues[0].code).toBe(223)
  })

  it('IntendedFor check detects non-existent file', () => {
    const files = {
      png: [
        {
          relativePath: '/sub-01/ses-01/micr/sub-01_ses-01_sample-A_photo.png',
        },
      ],
    }

    const jsonContentsDict = {
      '/sub-01/ses-01/micr/sub-01_ses-01_sample-A_photo.json': {
        IntendedFor: 'ses-01/micr/sub-01_ses-01_sample-A_SEM.png',
      },
    }

    const fileList = [
      { relativePath: '/sub-01/ses-01/micr/sub-01_ses-01_sample-B_SEM.png' },
    ]

    const issues = checkJSONAndField(files, jsonContentsDict, fileList)
    expect(issues.length).toBe(1)
    expect(issues[0].code).toBe(37)
  })

  it('intededfor check detects existing file', () => {
    const files = {
      png: [
        { relativePath: '/sub-01/ses-01/micr/sub-01_ses-01_sample-A_SEM.png' },
      ],
    }

    const jsonContentsDict = {
      '/sub-01/ses-01/micr/sub-01_ses-01_sample-A_SEM.json': {
        IntendedFor: 'ses-01/micr/sub-01_ses-01_sample-A_SEM.png',
      },
    }

    const fileList = [
      { relativePath: '/sub-01/ses-01/micr/sub-01_ses-01_sample-A_SEM.png' },
    ]

    const issues = checkJSONAndField(files, jsonContentsDict, fileList)
    expect(issues.length).toBe(0)
  })
})
