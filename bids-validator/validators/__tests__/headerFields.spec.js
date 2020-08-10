import { assert } from 'chai'
import { collect39Issues } from '../headerFields'

describe('headerFields', () => {
  describe('collect39Issues()', () => {
    it('should return an empty array if there are no files in allIssues39Dict', () => {
      const allIssues39Dict = {}
      const issues = collect39Issues(allIssues39Dict)
      assert.isArray(issues)
      assert.lengthOf(issues, 0)
    })
    it('should return one issue per file in the allIssues39Dict', () => {
      const allIssues39Dict = {
        file_1: [
          {
            code: 39,
            reason: 'for some reason',
          },
          {
            code: 39,
            reason: 'for some other reason',
          },
        ],
      }
      const issues = collect39Issues(allIssues39Dict)
      assert.isArray(issues)
      assert.lengthOf(issues, 1)
    })
    it('should return one issue for each file with code 39 issues', () => {
      const allIssues39Dict = {
        file_1: [
          {
            code: 39,
            reason: 'reason1',
          },
        ],
        file_2: [
          {
            code: 39,
            reason: 'reason2',
          },
        ],
      }
      const issues = collect39Issues(allIssues39Dict)
      assert.lengthOf(issues, 2)
    })
    it('constructs a combined reason string from each issue.reason of a file', () => {
      const allIssues39Dict = {
        file_1: [
          {
            code: 39,
            reason: 'reason1',
          },
          {
            code: 39,
            reason: 'reason2',
          },
        ],
      }
      const issues = collect39Issues(allIssues39Dict)
      assert.lengthOf(issues, 1)
      assert(issues[0].reason == ' reason1 reason2')
    })
  })
})
