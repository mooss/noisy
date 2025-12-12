# Noisy

Generate and explore 3d terrain in your browser with noise algorithms.
Try it [now](https://mooss.github.io/noisy).

## Features

- **Real-time feedback** - See terrain change as you adjust parameters
- **Shareable creations** - Save and load state via URL or JSON drag-and-drop
- **Infinite terrain** - Move across the infinite terrain thanks to dynamic chunks loading

## Controls

- *WASD* to move the avatar around.
- *Mouse wheel* to zoom.
- *Left click + mouse movement* to pan around the map.
- *Right click + mouse movement* to rotate the camera.

## Examples (click to open scene)

<table>
  <tr>
    <td>
      <a title="Mountains and hills" href="https://mooss.github.io/noisy/elderberry/scenes/basic-mountains">
        <img src="https://mooss.github.io/noisy/elderberry/scenes/basic-mountains.jpeg"/>
      </a>
    </td>
    <td>
      <a title="Glacier voxels" href="https://mooss.github.io/noisy/elderberry/scenes/basic-glacier-voxels">
        <img src="https://mooss.github.io/noisy/elderberry/scenes/basic-glacier-voxels.jpeg"/>
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <a title="Ice cobbles" href="https://mooss.github.io/noisy/elderberry/scenes/ice-cobbles">
        <img src="https://mooss.github.io/noisy/elderberry/scenes/ice-cobbles.png" style="width:100%; height:100%;"/>
      </a>
    </td>
    <td>
      <a title="Magma stained glass" href="https://mooss.github.io/noisy/elderberry/scenes/magma-stained-glass">
        <img src="https://mooss.github.io/noisy/elderberry/scenes/magma-stained-glass.png"/>
      </a>
    </td>
  </tr>
</table>

## Resources

If you are curious about procedural generation, here are a few resources to explore the topic.

[Red Blob Games](https://www.redblobgames.com) is a fantastic source of inspiration that provides great explanations and interactive examples.
A few particularly interesting posts:
 - [Making maps with noise functions](https://www.redblobgames.com/maps/terrain-from-noise/)
 - [Voronoi maps tutorial](https://www.redblobgames.com/x/2022-voronoi-maps-tutorial/)
 - [Mapgen4](https://www.redblobgames.com/maps/mapgen4/)

ProcGen Space has [a page](https://procgen.space/resources) with a lot of links to procedural generation resources that can be filtered with tags.

The [SimonDev](https://www.youtube.com/@simondev758) YouTube channel has a [3d World Generation playlist](https://www.youtube.com/watch?v=hHGshzIXFWY&list=PLRL3Z3lpLmH3PNGZuDNf2WXnLTHpN9hXy) exploring procedural generation techniques in JavaScript.
It covers a surprising amount of ground in a few 6 to 10 minutes videos (from heightmap generation to level of details and biome generation and a lot of other things in-between).

## Run locally

```bash
cd web
make setup
make serve
```

## Build and deploy

It builds and embed the project in a Go binary that will serve it and open it in the default browser.
```bash
make setup
make dist
./build/noisy-serve
```

## License

 - Source code: MIT License - see [LICENSE](LICENSE) for details.
 - Logo and brand assets: All rights reserved (see res/branding/LICENSE-LOGO).
