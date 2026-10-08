/**
 * Tests for the issue deduplication and React key logic in the Files component.
 *
 * Background: the Files component builds a Map keyed by `${location}${issueMessage ?? ""}`
 * to deduplicate issues. When iterating to render <li> elements, the React `key` prop
 * must come from this composite map key — NOT from `location` alone — because two issues
 * at the same file path can carry different issueMessages.
 *
 * See: commit c9bbceac ("FIX: web validator build and runtime bugs")
 */
import { assertEquals } from "@std/assert";

// Helper that replicates the Files component deduplication logic
function buildUniqueMap(
  issues: Array<{ location: string; issueMessage?: string }>,
) {
  return new Map(
    issues.map(({ location, issueMessage }) => [
      `${location}${issueMessage ?? ""}`,
      { location, issueMessage },
    ]),
  );
}

Deno.test("Files dedup: issues with different messages at the same path are both retained", () => {
  const issues = [
    { location: "/sub-01/anat/sub-01_T1w.nii.gz", issueMessage: "missing field 'foo'" },
    { location: "/sub-01/anat/sub-01_T1w.nii.gz", issueMessage: "missing field 'bar'" },
    { location: "/sub-01/anat/sub-01_T1w.nii.gz", issueMessage: "missing field 'foo'" }, // exact duplicate — should collapse
  ];

  const unique = buildUniqueMap(issues);

  // The exact duplicate collapses; the two distinct messages are both kept
  assertEquals(unique.size, 2);
});

Deno.test("Files dedup: map keys (used as React keys) are unique", () => {
  const issues = [
    { location: "/sub-01/anat/sub-01_T1w.nii.gz", issueMessage: "missing field 'foo'" },
    { location: "/sub-01/anat/sub-01_T1w.nii.gz", issueMessage: "missing field 'bar'" },
  ];

  const unique = buildUniqueMap(issues);

  // New approach: React keys come from map entries — guaranteed unique
  const newKeys = [...unique.entries()].map(([key]) => key);
  const uniqueNewKeys = new Set(newKeys);
  assertEquals(newKeys.length, uniqueNewKeys.size, "entry keys must all be unique");

  // Old (buggy) approach: React keys came from location alone — duplicates!
  const oldKeys = [...unique.values()].map(({ location }) => location);
  const uniqueOldKeys = new Set(oldKeys);
  assertEquals(
    oldKeys.length > uniqueOldKeys.size,
    true,
    "location-only keys produce duplicates when multiple messages exist for the same path",
  );
});

Deno.test("Files dedup: no issueMessage — location alone is the key, no spurious duplicates", () => {
  const issues = [
    { location: "/sub-01/anat/sub-01_T1w.nii.gz" },
    { location: "/sub-02/anat/sub-02_T1w.nii.gz" },
  ];

  const unique = buildUniqueMap(issues);

  assertEquals(unique.size, 2);

  const keys = [...unique.entries()].map(([key]) => key);
  assertEquals(keys.length, new Set(keys).size);
});
