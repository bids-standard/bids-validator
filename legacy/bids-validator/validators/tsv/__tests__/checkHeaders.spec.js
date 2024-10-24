import checkHeaders from '../checkHeaders'

describe('checkHeaders()', () => {
  it('generates issue on duplicate', () => {
    const issues = []
    const headers = ['hdr1', 'hdr2', 'hdr1']
    const mockFile = {}
    checkHeaders(headers, mockFile, issues)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe(231)
  })
  it('No issue for unique headers array', () => {
    const issues = []
    const headers = ['hdr1', 'hdr2', 'hdr3']
    const mockFile = {}
    checkHeaders(headers, mockFile, issues)
    expect(issues).toHaveLength(0)
  })
  it('generates issue on n/a', () => {
    const issues = []
    const headers = ['n/a']
    const mockFile = {}
    checkHeaders(headers, mockFile, issues)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe(232)
  })
  it('generates issue on empty header', () => {
    const issues = []
    const headers = ['normal', '   ', 'fine']
    const mockFile = {}
    checkHeaders(headers, mockFile, issues)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe(23)
  })
})
