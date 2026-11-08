// Patches that change graphs by referencing their elements by id, see `applyPatch`.
export { applyPatch, type PatchResult } from "#/patch/apply.js";
export { outline } from "#/patch/outline.js";
export {
  type AtomPatch,
  type Outline,
  type ParticipantPatch,
  type Patch,
  patchSchema,
  type ResourceOutline,
  type ResourcePatch,
  type SchemeOutline,
  type SchemePatch,
} from "#/patch/schema.js";
