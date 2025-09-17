# CHANGELOG

## Alpha 3 "coriander" – Tooltips, welcome dialog & smooth shading

This release adds user-facing documentation in the UI in the form of tooltips for most elements of the control panels and a welcome dialog presenting the project and how to use it.
It also fixes normal computation at the edge of chunks, thus allowing to hide seams between chunks and to re-enable smooth shading.

### Core engine & world model
- **Default terrace steps set to 0**: the terrain looks better without terraces now that flat shading is disabled.
- **Minimum vertical unit**: prevents shading artifacts when the terrain height multiplier is set to zero.

### Rendering pipeline
- **Fixed normal at the edges**: the normals now take vertices from neighboring chunks into account, removing seams that appeared between chunks.
- **Smooth shading re-enabled**: flat shading was only enabled to hide the seams between chunks.
- **Paradise palette**: bright colors; water -> sand -> grass -> forest -> hills.

### UI
- **Welcome dialog**: a dismissible welcome window is displayed with project presentation, controls and UI overview.
- **Tooltips**: algorithms, processing steps and most parameters now shows tooltips explaining what they do and how to use them.
- **Reduce folder nesting**: most "Noise" folders have been removed, reducing nesting and clutter.

### Storage & sharing
- **Maintained URL compatibility**: URLs encoded for "bean" still work for "coriander".
- **Persistent dismiss-state**: saves the choice to not show the welcome dialog again.

### Implementation details
- **Reference state encoding**: introduces `REFERENCE_STATE` used as dictionary for codec to keep URLs encoding stable when possible.
- **Clean-build Makefile target**: splits `dist` into `clean-build` then `dist` to enable a clean build without producing the Go binary.
- **Rename/reorganize**: `ui.ts` -> `ui/ui.ts`, `climbObjectOrArray` -> `climbTree` -> `cultivateTree`, remove redundant tree helpers.
- **Tooltip class**: GUI element implementing the tooltips.
- **Window widget**: draggable and closable floating windows with themed styling and header, used for the welcome dialog.
- **CheckBar widget**: new UI widget pairing a checkbox with a button, used in the welcome dialog.

## Alpha 2 "bean" – post-processing & positions persistence

**Commit** `076b5b20470ad26c994e38d3023c537e9e29b84c`.

The main improvements of this release are:
- Additional post-processing options (warping, noisy terracing and tiling).
- Persistence of avatar and camera positions.
- Two additional palettes and another removed.
- The ability to take a screenshot.

### Core engine & world model
- **Noise warping**: distort terrain features, hiding some artifacts.
- **Noisy terracing**: terracing mode where the number of terraces varies based on a noise function.
- **Noise tiling**: group neighboring points into flat irregular tiles.

### Rendering pipeline
- **Flat terrain**: the 'Height multiplier' slider can be set to zero for completely flat terrains.
- **Color palettes**: removed the 'Tectonic' palette and added a 'Rainbow' and a 'Coffe & milk' palettes.

### UI
- **Improved folder indentation**: adjusted the UI styling to make the first level of folders more readable.
- **Intuitive terracing control**: replaced the previous terracing 'interval' parameter with the more user-friendly 'steps' parameter.
- **Removed 'Tectonic' palette**: the 'Tectonic' color palette can no longer be selected.
- **Screenshot button**: download the current scene to a JPEG file.

### Storage & sharing
- **Persistent camera state**: the camera position and its focus point are saved in the game state.
- **Persistent avatar position**: the avatar coordinates are saved in the game state.

### Implementation details
- **Noise processing pipeline**: a system to chain multiple post-processing effects together, such as warping and terracing.
- **Enhanced state encoding**: array support for self encoders and centralize everything state-related in `web/state`.
- **Refactor of `tree` and `object` utilities**: consistent naming scheme and additional functions.
- **Additional tests**: tests for the `object` utilities and tweaked state tests.
- **UI naming consistency**: harmonized UI method and class names (e.g., `readOnly` → `static`, `buttonBar` → `buttons`).

## Alpha 1 "acorn" – initial public release

**Commit** `a019e99ec7670826a31ce9a27bf46f301abfa34d`.

This initial release features a sandbox to edit and explore procedurally generated terrain, with:
- A WASD-controllable avatar.
- Real-time terrain customization.
- The ability to share the worlds created.

### Core engine & world model
- **Chunk-based terrain**: the world is split in square chunks.
- **Height generation**: terrain is generated with noises (simplex, ridge or a mix of both) and a terracing post-processing.

### Rendering pipeline
- **Chunk mesh pipeline**: on-demand mesh generation with height-based coloring, supports flat or blocks (like minecraft) styles.
- **Lighting**: ambient and directional lighting updated in real time.
- **Palette system**: predefined color palettes (Bright, Fantasy, Sunset, etc.).

### Avatar & interaction
- **Red sphere avatar placeholder**: WASD keyboard control, follows terrain height at a fixed offset.
- **Camera**: camera can be free or follow the avatar at the same angle and distance, rotate holding right click, pan around the map holding left click.

### UI
- **Collapsible GUI**: left/right sidebars holding widgets, thin tab bar to show/hide.
- **Parameter widgets**: boolean, number, range, select and deck widgets all wired to callbacks.
- **FPS and stats graphs**: FPS counter and optional live charts to show terrain height distribution.

### Storage & sharing
- **Self encoders**: object able to recursively encode themselves for later decoding with a registry.
- **State registry**: registry of codecs that can decode a tree of state objects.
- **Save and load state via URL**: encode all parameters (noise, rendering, etc.) to a short, URL-safe Base64 string for easy bookmarking or sharing.
- **Save and load state via JSON**: encode all parameters to a JSON file, drag-and-drop JSON to load it.
