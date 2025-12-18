# Universal Editor (UE) Models

This directory contains the component model definitions for Universal Editor support. Each block has its own JSON file that is merged into the root-level `component-*.json` files during the build process.

## Directory Structure

```
ue/models/
├── blocks/                    # Individual block definitions
│   ├── accordion.json
│   ├── cards.json
│   ├── carousel.json
│   ├── columns.json
│   ├── fragment.json
│   ├── highlight.json
│   ├── icon-list.json
│   ├── notched-image.json
│   ├── quote.json
│   ├── story.json
│   ├── table.json
│   ├── tile.json
│   └── video.json
├── component-definition.json  # Base file that references all definitions
├── component-filters.json     # Base file that references all filters
├── component-models.json      # Base file that references all models
├── image.json                 # Default content: Image
├── page.json                  # Page metadata model
├── section.json               # Section definition and filters
└── text.json                  # Default content: Text
```

## Block JSON File Structure

Each block JSON file should contain three sections:

```json
{
  "definitions": [
    // Component definitions for the block (shows in UE component picker)
  ],
  "models": [
    // Field models for the block (shows in UE properties panel)
  ],
  "filters": [
    // Filter definitions for container blocks (what can be added inside)
  ]
}
```

## Adding a New Block

1. Create a new JSON file in `ue/models/blocks/` named `{blockname}.json`
2. Add the `definitions`, `models`, and `filters` arrays
3. Add the block ID to the section filter list in `section.json`
4. Run `npm run build:json` to regenerate the root-level files
5. The pre-commit hook will automatically rebuild if you forget

## Build Process

The `merge-json-cli` tool merges individual JSON files into the root-level files:

- `ue/models/component-definition.json` → `component-definition.json`
- `ue/models/component-models.json` → `component-models.json`
- `ue/models/component-filters.json` → `component-filters.json`

The merge uses the `"..."` spread syntax to reference other files:
- `"...": "./blocks/*.json#/definitions"` - includes all definitions from block files
- `"...": "./section.json#/filters"` - includes filters from section.json

## Pre-commit Hook

A husky pre-commit hook automatically rebuilds the root-level JSON files when any file in `ue/models/` is modified and staged:

```bash
# Manual rebuild
npm run build:json
```

## Field Types Reference

Common field types for component models:

| Component | Description |
|-----------|-------------|
| `text` | Single-line text input |
| `richtext` | Rich text editor |
| `reference` | Asset/content reference (images, etc.) |
| `aem-content` | AEM content path picker |
| `select` | Dropdown selection |
| `multiselect` | Multiple selection |
| `boolean` | Toggle/checkbox |
| `number` | Numeric input |

For more details, see the [Universal Editor Field Types documentation](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types).

## Block Options

Use `classes` or `classes_*` field names for block options that become CSS classes:

```json
{
  "component": "select",
  "name": "classes",
  "label": "Style",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Dark", "value": "dark" }
  ]
}
```

Multiple option fields can use the `classes_` prefix:
- `classes` - primary option
- `classes_alignment` - secondary option (e.g., left/right)
- `classes_size` - tertiary option (e.g., small/large)

