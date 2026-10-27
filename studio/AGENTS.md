# Sanity Studio Guidelines

## Schema Architecture & Single Responsibility
- **Shared Schemas:** Common schema members (e.g. `scholarlyPortableTextMembers`) reside in `schemaTypes/shared/`. Never duplicate rich text blocks, decorators, or annotations across document types.
- **Type Generation:** Every schema modification must be followed by `npm run typegen` to keep `studio/schema.json` and `web/sanity.types.ts` in sync.
- **Modularity:** Keep schema definitions under the 300 lines source ceiling. Extract complex arrays, objects, and annotations into dedicated schema modules.
- **Validation:** Enforce field-level validation rules (`rule.required()`, slug uniqueness, max character lengths) to protect data integrity.
