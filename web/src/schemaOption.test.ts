import { assertEquals } from "@std/assert";
import { computeEffectiveSchema, isSchemaLoadError } from "./schemaOption.ts";

Deno.test("computeEffectiveSchema: empty inputs -> undefined", () => {
  assertEquals(computeEffectiveSchema("", null), undefined);
  assertEquals(computeEffectiveSchema("   ", null), undefined);
});

Deno.test("computeEffectiveSchema: text only -> trimmed string", () => {
  assertEquals(computeEffectiveSchema("stable", null), "stable");
  assertEquals(computeEffectiveSchema("  v1.10.0  ", null), "v1.10.0");
});

Deno.test("computeEffectiveSchema: file wins over text", () => {
  const blobUrl = "blob:fake";
  assertEquals(
    computeEffectiveSchema("stable", { blobUrl }),
    "blob:fake",
  );
});

Deno.test("computeEffectiveSchema: file only", () => {
  assertEquals(
    computeEffectiveSchema("", { blobUrl: "blob:abc" }),
    "blob:abc",
  );
});

Deno.test("isSchemaLoadError: matches loadSchema prefix", () => {
  assertEquals(
    isSchemaLoadError(new Error("Failed to load schema from foo: x")),
    true,
  );
  assertEquals(isSchemaLoadError(new Error("something else")), false);
  assertEquals(isSchemaLoadError("not an error"), false);
});
