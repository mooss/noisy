# CHANGELOG

## Alpha 1 "Acorn" – initial public release

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

### UI & widgets
- **Collapsible GUI**: left/right sidebars holding widgets, thin tab bar to show/hide.
- **Parameter widgets**: boolean, number, range, select and deck widgets all wired to callbacks.
- **FPS and stats graphs**: FPS counter and optional live charts to show terrain height distribution.

### Storage & sharing
- **Self encoders**: object able to recursively encode themselves for later decoding with a registry.
- **State registry**: registry of codecs that can decode a tree of state objects.
- **Save and load state via URL**: encode all parameters (noise, rendering, etc.) to a short, URL-safe Base64 string for easy bookmarking or sharing.
- **Save and load state via JSON**: encode all parameters to a JSON file, drag-and-drop JSON to load it.
