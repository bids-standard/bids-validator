import assert from 'assert'
import headerFields from '../validators/headerFields'

describe('headerFields', () => {
  it('should throw an error if _magnitude1 or _magnitude2 files do not have exactly 3 dimensions.', () => {
    const headers = [
      // each of these headers has one too many dimensions on the 'dim' field.
      [
        {
          name: 'sub-01_magnitude1.nii',
          relativePath: 'sub-01_magnitude1.nii',
        },
        {
          dim: [5, 1, 1, 1, 1],
          pixdim: [5, 1, 1, 1, 1],
          xyzt_units: [5, 1, 1, 1, 1],
        },
      ],
      [
        {
          name: 'sub-01_magnitude2.nii',
          relativePath: 'sub-01_magnitude2.nii',
        },
        {
          dim: [5, 1, 1, 1, 1],
          pixdim: [5, 1, 1, 1, 1],
          xyzt_units: [5, 1, 1, 1, 1],
        },
      ],
      // each of these headers has one too few dimensions on the 'dim' field.
      [
        {
          name: 'sub-02_magnitude1.nii',
          relativePath: 'sub-02_magnitude1.nii',
        },
        {
          dim: [3, 1, 1],
          pixdim: [4, 1, 1, 1],
          xyzt_units: [4, 1, 1, 1],
        },
      ],
      [
        {
          name: 'sub-02_magnitude2.nii',
          relativePath: 'sub-02_magnitude2.nii',
        },
        {
          dim: [3, 1, 1],
          pixdim: [4, 1, 1, 1],
          xyzt_units: [4, 1, 1, 1],
        },
      ],
    ]
    const issues = headerFields(headers)
    assert(
      issues.length == 4 &&
        issues[0].code == '94' &&
        issues[1].code == '94' &&
        issues[2].code == '94' &&
        issues[3].code == '94',
    )
  })

  it('_magnitude1 or _magnitude2 files should have 3 dimensions.', () => {
    const headers = [
      [
        {
          name: 'sub-01_magnitude1.nii',
          relativePath: 'sub-01_magnitude1.nii',
        },
        {
          dim: [3, 1, 1, 1],
          pixdim: [3, 1, 1, 1],
          xyzt_units: [3, 1, 1, 1],
        },
      ],
      [
        {
          name: 'sub-01_magnitude2.nii',
          relativePath: 'sub-01_magnitude2.nii',
        },
        {
          dim: [3, 1, 1, 1],
          pixdim: [3, 1, 1, 1],
          xyzt_units: [3, 1, 1, 1],
        },
      ],
    ]
    const issues = headerFields(headers)
    assert.deepEqual(issues, [])
  })

  it('should throw an error if _T1w files has the wrong dimensions.', () => {
    // each of these headers has one too many dimensions on the 'dim' field.
    // the first entry is the total count, and the following three entries are spatial.
    const headers = [
      [
        {
          name: 'sub-01_T1w.nii',
          relativePath: 'sub-01_T1w.nii',
        },
        {
          dim: [5, 1, 1, 1, 1],
          pixdim: [5, 1, 1, 1, 1],
          xyzt_units: [5, 1, 1, 1, 1],
        },
      ],
      [
        {
          name: 'sub-02_T1w.nii',
          relativePath: 'sub-02_T1w.nii',
        },
        {
          dim: [3, 1, 1],
          pixdim: [4, 1, 1, 1],
          xyzt_units: [4, 1, 1, 1],
        },
      ],
    ]
    const issues = headerFields(headers)
    assert(
      issues.length == 2 && issues[0].code == '95' && issues[1].code == '95',
    )
  })

  it('_T1w files should have exactly 3 dimensions.', () => {
    const headers = [
      [
        {
          name: 'sub-01_T1w.nii',
          relativePath: 'sub-01_T1w.nii',
        },
        {
          dim: [3, 1, 1, 1],
          pixdim: [3, 1, 1, 1],
          xyzt_units: [4, 1, 1, 1],
        },
      ],
    ]
    const issues = headerFields(headers)
    assert.deepEqual(issues, [])
  })
})
