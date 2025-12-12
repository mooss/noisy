# CHANGELOG

## Alpha 5 "elderberry" – Presets, STL export, textures and UI overhaul

**Commit** `1706f241a7978fb034aa954f18cac1eed9a2a74f`.

This release introduces a preset system, STL model export, a new logo, and a major UI redesign.
It also adds new noise features, textures, and includes various usability enhancements.

### Core engine & world model
- **Union noise**: replaces summed noise with a generic combination noise supporting sum, min, and max operations for octaves.
- **Cursive and cursed noise**: new noise function implemented with union noise.

### Rendering pipeline
- **Flat shading toggle**: adds an option to switch between flat and smooth shading.
- **Textures**: applies textures to the surface geometry with bump mapping support.
- **Slope-based terrain coloration**: shift the color palette depending on the slope angle.
- **Exponentiation and steepness noise transformation**: a new processing step to scale noise values, making more dramatic terrain features.
- **Pixel geometry style**: a new geometry style that displays height as individual pixels.

### UI
- **UI redesign**: adopts a minimalist black and white theme, docks panels to the left.
- **Menu system**: adds a top menu bar to handle more operations and declutter the side panels.
- **Preset system**: adds a menu to load and save terrain configurations, with several built-in presets (e.g., continental mix, texture lab).
- **Default preset**: The "Continental mix" preset is now used by default, with the old default moved to the "Advanced mode" preset.
- **Rendering deck**: groups UI rendering options under a deck of cards for better organization.
- **Updated welcome message**: refreshes the introductory text.
- **Footer integration**: ensures the GUI does not display over the site footer and integrates logos (Noisy, GitHub, X).
- **Disable avatar and camera UI**: removes the mostly useless avatar and camera control panel.
- **New logo**: a custom-designed hexacube logo, with proper licensing clarification.
- **Changed noise values**: sets the min, max and default noise values to be bit more sensible.

### Storage & sharing
- **STL export**: exports the terrain as a solid 3D model (STL format) for 3D printing, with proper height scaling.
- **Texture export**: adds a button to download the terrain as a texture image, with color shifting applied.
- **State encoding improvements**: uses implicit aliasing for more compact and flexible state representation.
- **Removed sampling parameters**: replaces them with the default parameters which have proven to work well.

### Bug fixes
- **Centered pixel and box geometry**: shifts height sampling to the center of cells instead of the corner.
- **Value rounding in range widget**: rounds to the nearest step to prevent floating-point display issues.

### Implementation details
- **Refactored noise pipeline**: construction split into small, reusable functions and moved to the main scope for better UI integration.
- **Code structure**: moves terrain-related code to its own directory and GUI panels to a dedicated subdirectory.
- **Terrain rendering class**: moves terrain rendering logic into its own dedicated class.
- **Noise algorithm organization**: splits noise algorithms into one file per algorithm.
- **Chunk pooling**: implements a pool to reuse chunk meshes and reduce allocations.
- **Material painter system**: introduces a reusable painter to create and cache materials.
- **Shader organization**: writes shaders within an Org file for better documentation and maintenance.
- **Reusable utilities**: adds `Reusable` and `Recycler` classes to simplify recycling logic.
- **Linter setup**: adds a basic code linter.
- **Remove noisy terracing**: removes the confusing and quite ugly noisy terracing post-processing step.
- **Clean up chunk loading**: replaces the arcane chunk-loading machinery with something more bearable.

## Alpha 4 "dandelion" - Mesh creation performance and tiling

**Commit** `9a2ddc5bf71d300bd9e72bde86d7b12f4672eb0a`.

This release focuses on performance improvements to mesh creation, adds new tiling modes for creating seamless textures and expands the color palette collection.

### Core engine & world model
Mesh creation performance:
- **Mesh caching**: setup the architecture to reuse mesh-related resources (not yet properly used, still requires a rework of chunk management).
- **Asynchronous terrain updates**: terrain (re)generation is now non-blocking, making the UI much more responsive.
- **GPU color interpolation**: colors are now interpolated on the GPU instead of pre-computed on the CPU.
- **Box mesh optimization**: manually create a mesh using the minimal amount of faces instead of using THREE.js boxes.
- **Surface mesh optimization**: remove method calls, pre-allocate buffers, bypass operations and change index type (see [performance analysis README](web/scripts/performance-analysis/README.md)).

Tiling processing steps have been added to transform raw noise into a repeating texture:
- **Quad tiling**: interpolates between four points to create a seamless texture that preserves the noise pattern without mirroring.
- **Sine tiling**: uses the sine function to transform coordinates, creating a mirrored texture with circular artifacts.
- **Mirrored tiling**: mirrors the x and y coordinates, with optional repetition on each axis.

Other:
- **Voxel terracing**: terracing mode that adapts to the resolution to create voxels.

### Rendering pipeline
- **Added 9 color palettes**: solar flux, neon light, alpine meadow, orchid bloom, savanna, praclarush, glacier, woodland camo, and jungle camo.
- **Removed 1 color palette**: coffee & milk.

### UI
- **Welcome screen button**: a question mark button that will display the welcome dialog even if it has been dismissed.
- **Continental mix reactivity**: the low, high and mid sliders update the terrain on input instead of waiting for the slider to be released.

### Storage & sharing
- **Improved state encoding**: remove unnecessary nesting and cleanup messy encodings.
- **Aliasing codec**: the state codec now supports aliases/references meaning that any part of the state can get information from any other part (it should also make the encoding cycle-proof).

### Implementation details
- **Select widget redesign**: replaced the convoluted select widget with the specialized map and array widgets.
- **Restructuring**: reorganized the code structure to something more acceptable.
- **Benchmarking and profiling utilities**: added a performance analysis script and a mesh generation benchmark.
- **Spiral chunk loading**: using a spiral pattern ensures that the first chunks loaded are closer to the avatar.
- **Cleanup of the `Terrain` class**: splitted into a few more understandable classes but still extremely ugly.

## Alpha 3 "coriander" – Tooltips, welcome dialog & smooth shading

**Commit** `718a1b1fdf1a30ff7d9de4b99fbc75bc34d3eeb9`.

This release adds user-facing documentation in the UI in the form of tooltips for most elements of the control panels and a welcome dialog presenting the project and how to use it.
It also fixes normal computation at the edge of chunks, thus allowing to hide seams between chunks and to re-enable smooth shading.

### Core engine & world model
- **Default terrace steps set to 0**: the terrain looks better without terraces now that flat shading is disabled.

### Rendering pipeline
- **Fixed normal at the edges**: the normals now take vertices from neighboring chunks into account, removing seams that appeared between chunks.
- **Smooth shading re-enabled**: flat shading was only enabled to hide the seams between chunks.
- **Paradise palette**: bright colors; water -> sand -> grass -> forest -> hills.
- **Minimum vertical unit**: prevents shading artifacts when the terrain height multiplier is set to zero.

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
