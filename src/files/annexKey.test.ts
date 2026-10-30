import { assertEquals } from '@std/assert'
import { annexIssue, parseAnnexPointer } from './annexKey.ts'

const key = 'MD5E-s16--a35f6370ff3128ab75c29b1754d09bf7.nii.gz'
const pointer = `/annex/objects/${key}`

Deno.test('parseAnnexPointer', async (t) => {
  const encode = (text: string) => new TextEncoder().encode(text)
  // See https://git-annex.branchable.com/internals/pointer_file/
  const pointers: Record<string, string> = {
    'newline': `${pointer}\n`,
    'CRLF': `${pointer}\r\n`,
    'no trailing newline': pointer,
    'extra annex lines': `${pointer}\n/annex/extra\n`,
    'relative path': `../.git/annex/objects/xx/yy/${key}/${key}\n`,
  }
  for (const [name, text] of Object.entries(pointers)) {
    await t.step(`parses ${name}`, () => {
      assertEquals(parseAnnexPointer(encode(text)), { key, size: 16 })
    })
  }
  const notPointers: Record<string, string> = {
    'appended content': `${pointer}\nnot a pointer\n`,
    'unterminated extra line': `${pointer}\n/annex/extra`,
    'oversized': `${pointer}\n` + '/annex/padding\n'.repeat(2200),
    'prose mentioning annex': 'see /annex/objects/ for details\n',
    'bare key': `${key}\n`,
  }
  for (const [name, text] of Object.entries(notPointers)) {
    await t.step(`rejects ${name}`, () => {
      assertEquals(parseAnnexPointer(encode(text)), null)
    })
  }
})

Deno.test('annexIssue', () => {
  assertEquals(annexIssue('UNLOCKED_ANNEX_DATA', key), {
    code: 'UNLOCKED_ANNEX_DATA',
    issueMessage: `git-annex key: ${key}`,
  })
})
