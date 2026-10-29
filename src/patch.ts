// Patches written by agents or programs, see `applyPatch`.
export { type PatchResult, applyPatch } from "#/patch/apply.js";
export { outline } from "#/patch/outline.js";
export { type ParsedPatch, parsePatch } from "#/patch/parse.js";
export {
  type AtomPatch,
  type JsonSchema,
  type Outline,
  type ParticipantPatch,
  type Patch,
  patchSchema,
  type ResourcePatch,
  type SchemePatch,
} from "#/patch/schema.js";
