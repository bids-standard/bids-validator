const Issue = require('../../utils').issues.Issue

const componentEnum = [
  'x',
  'y',
  'z',
  'quat_x',
  'quat_y',
  'quat_z',
  'quat_w',
  'n/a',
]

export const checkMotionComponent = function (rows, file, issues) {
  const header = rows[0]
  const componentIndex = header.indexOf('component')
  if (componentIndex != 1) {
    issues.push(
      new Issue({
        file: file,
        evidence: header.join(','),
        line: 0,
        reason: `Component found on column ${componentIndex + 1}.`,
        code: 235,
      }),
    )
  }

  for (let a = 1; a < rows.length; a++) {
    const line = rows[a]
    const component = line[componentIndex]
    if (!componentEnum.includes(component)) {
      issues.push(
        new Issue({
          file: file,
          evidence: line.join(','),
          line: a + 1,
          reason: `Found value ${component}`,
          code: 236,
        }),
      )
    }
  }
}

export default checkMotionComponent
