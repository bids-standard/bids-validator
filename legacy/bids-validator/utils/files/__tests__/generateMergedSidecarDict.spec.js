/*global globalThis*/
import generateMergedSidecarDict from '../generateMergedSidecarDict.js'

describe('generateMergedSidecarDict.js', () => {
  describe('Object pollution test', () => {
    beforeAll(() => {
      // Simulate code that injects globalThis into every object
      Object.defineProperty(Object.prototype, 'global', {
        get: function () {
          return globalThis
        },
        configurable: true,
      })
    })

    afterAll(() => {
      // Clean up the pollution
      delete Object.prototype.global
    })

    it('trivial check', () => {
      expect(generateMergedSidecarDict([], {})).toStrictEqual({})
    })

    it('merges objects with global property', () => {
      const potentialSidecars = ['/sidecar1.json', '/sidecar2.json']
      const jsonContents = {
        '/sidecar1.json': {
          RegularMetadata1: 'value1',
          global: {
            globalMetadata: 'value1',
          },
        },
        '/sidecar2.json': {
          RegularMetadata2: 'value2',
        },
      }
      expect(
        generateMergedSidecarDict(potentialSidecars, jsonContents),
      ).toStrictEqual({
        RegularMetadata1: 'value1',
        RegularMetadata2: 'value2',
        global: {
          globalMetadata: 'value1',
        },
      })
    })
  })
})
