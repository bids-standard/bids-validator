const assert = require('assert')
const validate = require('../index')

describe('Events', function() {
  const headers = [
    [
      {
        path: '/sub01/sub01_task-test_bold.nii.gz',
        relativePath: '/sub01/sub01_task-test_bold.nii.gz',
      },
      { dim: [4, 0, 0, 0, 10] },
    ],
  ]

  it('all files in the /stimuli folder should be included in an _events.tsv file', function() {
    // stimuli.events will have all of the
    // files included in the stim_file column of every _events.tsv file.
    // stimuli.directory will have all of the
    // files included in the /stimuli directory.
    const stimuli = {
      events: ['/stimuli/images/red-square.jpg'],
      directory: [{ relativePath: '/stimuli/images/blue-square.jpg' }],
    }
    const issues = validate.Events.validateEvents([], stimuli, [], {})
    assert(issues.length === 1 && issues[0].code === 77)
  })

  it('should not throw issues if all files in the /stimuli folder are included in an _events.tsv file', function() {
    const stimuli = {
      events: ['/stimuli/images/red-square.jpg'],
      directory: [{ relativePath: '/stimuli/images/red-square.jpg' }],
    }
    const issues = validate.Events.validateEvents([], stimuli, [], {})
    assert(issues.length === 0)
  })

  it('should throw an issue if the onset of the last event in _events.tsv is more than TR * number of volumes in corresponding nifti header', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: '12\tsomething\tsomething\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert(issues.length === 1 && issues[0].code === 85)
  })

  it('should throw an issue if the onset of the last event in _events.tsv is less than .5 * TR * number of volumes in corresponding nifti header', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: '2\tsomething\tsomething\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert(issues.length === 1 && issues[0].code === 86)
  })

  it('should not throw any issues if the onset of the last event in _events.tsv is a reasonable value', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: '7\tsomething\tsomething\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepEqual(issues, [])
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of duplicate tags', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus,Event/Category/Experimental stimulus\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 108)
  })

  it('should not throw any issues if the HED column in a single row contains valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should not throw any issues if the HED column in a single row contains valid HED data in multiple levels', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tItem/Object/Vehicle/Train,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should not throw any issues if the HED column in multiple rows contains valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus\n' +
          '8\tsomething\tEvent/Category/Experimental stimulus\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should throw an issue if the HED columns in a single row, including sidecars, contain invalid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus\tfirst\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 108)
  })

  it('should not throw any issues if the HED columns in a single row, including sidecars, contain valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus\tsecond\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should not throw any issues if the HED columns in multiple rows, including sidecars, contain valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus\tsecond\n' +
          '7\tsomething\t/Action/Reach/To touch\tfirst\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should throw an issue if a single sidecar HED column in a single row contains invalid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\tmycodes\n' + '7\tsomething\tfirst\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first:
              'Event/Category/Experimental stimulus,Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 108)
  })

  it('should not throw any issues if a single sidecar HED column in a single row contains valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\tmycodes\n' + '7\tsomething\tsecond\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first:
              'Event/Category/Experimental stimulus,Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should not throw any issues if a single sidecar HED column in multiple rows contains valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tmycodes\n' +
          '7\tsomething\tsecond\n' +
          '8\tsomething\tsecond',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first:
              'Event/Category/Experimental stimulus,Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should throw an issue if any sidecar HED columns in a single row contain invalid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tmycodes\ttestingCodes\n' +
          '7\tsomething\tfirst\tone\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
        testingCodes: {
          HED: {
            one: 'Event/Category/Experimental stimulus',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 108)
  })

  it('should not throw an issue if all sidecar HED columns in a single row contain valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tmycodes\ttestingCodes\n' +
          '7\tsomething\tfirst\ttwo\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
        testingCodes: {
          HED: {
            one: 'Event/Category/Experimental stimulus',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should not throw an issue if all sidecar HED columns in multiple rows contain valid HED data', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tmycodes\ttestingCodes\n' +
          '7\tsomething\tfirst\ttwo\n' +
          '8\tsomething\tsecond\tone\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
        testingCodes: {
          HED: {
            one: 'Event/Category/Experimental stimulus',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.deepStrictEqual(issues, [])
  })

  it('should throw an issue if a sidecar HED column in a single row contains a non-existent key', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\tmycodes\n' + '7\tsomething\tthird\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Experimental stimulus',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 110)
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of an illegal character', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus]\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 104)
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of mismatched parentheses', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\t(Event/Category/Experimental stimulus\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 105)
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of a missing comma after a tag', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\t/Action/Reach/To touch(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm),/Attribute/Location/Screen/Top/70 px\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 106)
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of improper capitalization', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\tHED\n' + '7\tsomething\tEvent/something\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 107)
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of too many tildes in a single group', function() {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Category/Experimental stimulus,(Participant/ID 1 ~ Participant/Effect/Visual ~ Item/Object/Vehicle/Car, Item/ID/RedCar, Attribute/Visual/Color/Red ~ Attribute/Object control/Perturb)\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    const issues = validate.Events.validateEvents(
      events,
      [],
      headers,
      jsonDictionary,
    )
    assert.strictEqual(issues.length, 1)
    assert.strictEqual(issues[0].code, 109)
  })
})
