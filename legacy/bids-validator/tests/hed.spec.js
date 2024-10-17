import assert from 'assert'
import validateHed from '../validators/hed'

describe('HED', function () {
  const jsonFiles = [
    {
      relativePath: '/sub01/sub01_task-test_events.json',
      path: '/sub01/sub01_task-test_events.json',
    },
    {
      relativePath: '/dataset_description.json',
      path: '/dataset_description.json',
    },
  ]

  it('should not throw an issue if the HED data is valid', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\tsomething\tone\tSpeed/30 mph\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        myCodes: {
          HED: {
            one: 'Duration/5 s',
          },
        },
      },
      '/dataset_description.json': { HEDVersion: '8.0.0' },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.deepStrictEqual(issues, [])
    })
  })

  it('should not throw an issue if a value column is annotated', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\t3.0\tone\tSpeed/30 mph\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        myCodes: {
          test: {
            HED: {
              one: 'Label/#',
            },
          },
        },
      },
      '/dataset_description.json': { HEDVersion: '8.0.0' },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.deepStrictEqual(issues, [])
    })
  })

  it('should not throw an issue if a library schema is included', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\t3.0\tone\tSpeed/30 mph\n',
      },
    ]

    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        myCodes: {
          test: {
            HED: {
              one: 'ts:Sensory-presentation, Label/#',
            },
          },
        },
      },
      '/dataset_description.json': {
        HEDVersion: ['8.0.0', 'ts:testlib_1.0.2'],
      },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.deepStrictEqual(issues, [])
    })
  })

  it('should throw an issue if the HED data is invalid', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\tsomething\tone\tDuration/5 s\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        test: {
          HED: {
            one: 'Speed/5 ms',
          },
        },
      },
      '/dataset_description.json': { HEDVersion: '8.0.0' },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.strictEqual(issues.length, 1)
      assert.strictEqual(issues[0].code, 104)
    })
  })

  it('should not throw an issue if multiple library schemas are included', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\t3.0\tone\tSpeed/30 mph\n',
      },
    ]

    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        myCodes: {
          test: {
            HED: {
              one: 'ts:Sensory-presentation, Label/#, sc:Sleep-deprivation',
            },
          },
        },
      },
      '/dataset_description.json': {
        HEDVersion: ['8.0.0', 'ts:testlib_1.0.2', 'sc:score_1.0.0'],
      },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.deepStrictEqual(issues, [])
    })
  })

  it('should properly issue warnings when appropriate', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\tsomething\tone\tHuman/Driver\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        test: {
          HED: {
            one: 'Train/Maglev',
          },
        },
      },
      '/dataset_description.json': { HEDVersion: '8.0.0' },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.strictEqual(issues.length, 2)
      assert.strictEqual(issues[0].code, 105)
      assert.strictEqual(issues[1].code, 105)
    })
  })

  it('should properly issue errors if HED data is used in a sidecar without using HEDVersion', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\ttest\n' + '7\tsomething\tone\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        test: {
          HED: {
            one: 'Train',
          },
        },
      },
      '/dataset_description.json': {},
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.strictEqual(issues.length, 1)
      assert.strictEqual(issues[0].code, 109)
    })
  })

  it('should properly issue errors if HED data is used in a TSV file without using HEDVersion', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents: 'onset\tduration\tHED\n' + '7\tsomething\tHuman\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {},
      '/dataset_description.json': {},
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.strictEqual(issues.length, 1)
      assert.strictEqual(issues[0].code, 109)
    })
  })

  it('should throw an issue if HEDVersion is invalid', () => {
    const events = [
      {
        file: {
          path: '/sub01/sub01_task-test_events.tsv',
          relativePath: '/sub01/sub01_task-test_events.tsv',
        },
        path: '/sub01/sub01_task-test_events.tsv',
        contents:
          'onset\tduration\ttest\tHED\n' + '7\tsomething\tone\tSpeed/30 mph\n',
      },
    ]
    const jsonDictionary = {
      '/sub01/sub01_task-test_events.json': {
        myCodes: {
          HED: {
            one: 'Duration/5 s',
          },
        },
      },
      '/dataset_description.json': { HEDVersion: 'one:two:8.0.0' },
    }

    return validateHed(events, jsonDictionary, jsonFiles, '').then((issues) => {
      assert.strictEqual(issues.length, 1)
      assert.strictEqual(issues[0].code, 104)
    })
  })
})
