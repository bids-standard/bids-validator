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

  it('all files in the /stimuli folder should be included in an _events.tsv file', async done => {
    // stimuli.events will have all of the
    // files included in the stim_file column of every _events.tsv file.
    // stimuli.directory will have all of the
    // files included in the /stimuli directory.
    const stimuli = {
      events: ['/stimuli/images/red-square.jpg'],
      directory: [{ relativePath: '/stimuli/images/blue-square.jpg' }],
    }
    validate.Events.validateEvents([], stimuli, [], {}).then(issues => {
      assert(issues.length === 1 && issues[0].code === 77)
      done()
    })
  })

  it('should not throw issues if all files in the /stimuli folder are included in an _events.tsv file', async done => {
    const stimuli = {
      events: ['/stimuli/images/red-square.jpg'],
      directory: [{ relativePath: '/stimuli/images/red-square.jpg' }],
    }
    validate.Events.validateEvents([], stimuli, [], {}).then(issues => {
      assert(issues.length === 0)
      done()
    })
  })

  it('should throw an issue if the onset of the last event in _events.tsv is more than TR * number of volumes in corresponding nifti header', async done => {
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

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert(issues.length === 1 && issues[0].code === 85)
        done()
      },
    )
  })

  it('should throw an issue if the onset of the last event in _events.tsv is less than .5 * TR * number of volumes in corresponding nifti header', async done => {
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

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert(issues.length === 1 && issues[0].code === 86)
        done()
      },
    )
  })

  it('should not throw any issues if the onset of the last event in _events.tsv is a reasonable value', async done => {
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

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepEqual(issues, [])
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of duplicate tags', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 110)
        done()
      },
    )
  })

  it('should not throw any issues if the HED column in a single row contains valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should not throw any issues if the HED column in a single row contains valid HED data in multiple levels', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test,Item/Object/Vehicle/Train,(Item/Object/Vehicle/Train,Event/Category/Experimental stimulus)\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should not throw any issues if the HED column in multiple rows contains valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\n' +
          '8\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should throw an issue if the HED columns in a single row, including sidecars, contain invalid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\tfirst\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Miscellaneous/Test',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 110)
        done()
      },
    )
  })

  it('should not throw any issues if the HED columns in a single row, including sidecars, contain valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\tsecond\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first: 'Event/Category/Miscellaneous/Test',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should not throw any issues if the HED columns in multiple rows, including sidecars, contain valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\tmycodes\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\tsecond\n' +
          '7\tsomething\t/Action/Reach/To touch\tfirst\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        mycodes: {
          HED: {
            first:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should throw an issue if a single sidecar HED column in a single row contains invalid HED data', async done => {
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
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 110)
        done()
      },
    )
  })

  it('should not throw any issues if a single sidecar HED column in a single row contains valid HED data', async done => {
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
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should not throw any issues if a single sidecar HED column in multiple rows contains valid HED data', async done => {
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
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should throw an issue if any sidecar HED columns in a single row contain invalid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttestingCodes\tmyCodes\n' +
          '7\tsomething\tfirst\tone\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        testingCodes: {
          HED: {
            first:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
        myCodes: {
          HED: {
            one: 'Event/Category/Miscellaneous/Test',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 110)
        done()
      },
    )
  })

  it('should not throw an issue if all sidecar HED columns in a single row contain valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttestingCodes\tmyCodes\n' +
          '7\tsomething\tfirst\ttwo\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        testingCodes: {
          HED: {
            first:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
        myCodes: {
          HED: {
            one: 'Event/Category/Miscellaneous/Test',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should not throw an issue if all sidecar HED columns in multiple rows contain valid HED data', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttestingCodes\tmyCodes\n' +
          '7\tsomething\tfirst\ttwo\n' +
          '8\tsomething\tsecond\tone\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
        testingCodes: {
          HED: {
            first:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
            second:
              'Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test',
          },
        },
        myCodes: {
          HED: {
            one: '/Action/Reach/To touch',
            two: '/Action/Reach/To touch',
          },
        },
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.deepStrictEqual(issues, [])
        done()
      },
    )
  })

  it('should throw an issue if a sidecar HED column in a single row contains a non-existent key', async done => {
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

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 112)
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of an illegal character', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test]\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 106)
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of mismatched parentheses', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\t(Event/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 107)
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of a missing comma after a tag', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test,/Action/Reach/To touch,(/Attribute/Object side/Left,/Participant/Effect/Body part/Arm)/Attribute/Location/Screen/Top/70 px,/Attribute/Location/Screen/Left/23 px\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 108)
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of improper capitalization', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/label/test,Event/Category/Miscellaneous/Test,Event/Description/Test\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 109)
        done()
      },
    )
  })

  it('should throw an issue if the HED column in a single row contains invalid HED data in the form of too many tildes in a single group', async done => {
    const events = [
      {
        file: { path: '/sub01/sub01_task-test_events.tsv' },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\tHED\n' +
          '7\tsomething\tEvent/Label/Test,Event/Category/Miscellaneous/Test,Event/Description/Test,(Participant/ID/1 ~ Participant/Effect/Visual ~ Item/Object/Vehicle/Car, Item/ID/RedCar, Attribute/Visual/Color/Red ~ Attribute/Object control/Perturb)\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_bold.json': {
        RepetitionTime: 1,
      },
    }

    validate.Events.validateEvents(events, [], headers, jsonDictionary).then(
      issues => {
        assert.strictEqual(issues.length, 1)
        assert.strictEqual(issues[0].code, 111)
        done()
      },
    )
  })
})
