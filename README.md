# Noisy

Generate and explore 3d terrain in your browser with noise algorithms.
Try it [now](https://mooss.github.io/noisy/acorn).

## Features

- **Read-time feedback** - See terrain change as you adjust parameters
- **Shareable creations** - Save and load state via URL or JSON drag-and-drop
- **Infinite terrain** - Move across the infinite terrain thanks to dynamic chunks loading

## Controls

- *WASD* to move the avatar around.
- *Mouse wheel* to zoom.
- *Left click + mouse movement* to pan around the map.
- *Right click + mouse movement* to rotate the camera.

## Example

<table>
  <tr>
    <td>
      <a title="Continental ridges" href="https://mooss.github.io/noisy/bean/?q=N4IghgDiBcoMY1GAjjcAvEAaEAFRIAojAIwBsAnAHQCsZAHBQOz1MAMjATJyZzgGIwAtCXoAWKmM5sybAMz16nMWIqKcAcRg0KnKmzFyxNQzWXc5AXxxgAngWLQQ9gWhcgtTgO4hL1kABGBGBoYABOvv5gAM4ECLAgAEpoAJLY4IJOYCE2AKpoAMLpEGEApgBuAJYA9gCu0QDKleilbr44QQkhWQAukTYA1nEElWitNkXe6fgJjiDl6Znz6Z5sVAqccpxkO9tkCiycfh3BoQA2_eAA6sNdAFqh2elgAIpoAEJhlQDmABY9AAI4NUAHY9Sog0pg56OJAAKwIADkYGsyFEFglkVkAGaXMDvFFUNT-TpIUIANUu3wIpPAoQAKu0QPEkGBWglad1wA0mSyQAApAgAaRppyyYAQ_j5YAAGmgfMdwFjQJzQgB5XnBEVZak2NJZX7PMC01VOaqahLUjlikB9KUEQ1OXGKqAJAAmY3SqCcAA90hEnEMcCC0LUmbEEqMnABbdIIpwXHAepytPxp_wAWTQIpwABFRV1HqN7V0AIIwPQkGwATTQjJsYEdKptdpwfMdIGd_nz1sL4o9JaQPhTzyz4uefqc5bzBbJWQAEhbQIKEn1e3OQObByArc2-7alyAO12cK7QMmQIucN6QJgcAGQEGQCGnGH_BHQFGQLGcPGQImQAvVNFQJdc6TNQ9d0CG0CW3DUnDeHBJhAacjzQE8QDPQC0AWa80DvEAHyvZ9SCoNEcA_EAvx_EA_wAoDIn8AAZWdwPAN822CWMwK5LdOMtViuVbZkHQrCgXQIC8bjwpw0nvNAnxfEAOJASjqLjNB6M9NMG1xHi0D4kSBP0pxYP40B4JARCQGQ1DHS2CT3TQSkZNvf0FPSJSHnfEY0Bouj0gYnTaOCTwQHyGwVxAWsbB7EA5XTHAxxAWD0zShsoLAZIslGGwZnAIIbBYrIQz8IA...">
        <img src="https://mooss.github.io/noisy/bean/scenes/continental-ridges.jpeg" alt="Procedurally generated continental ridge landscape"/>
      </a>
    </td>
  </tr>
</table>
Click the image to open a scene.

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

MIT License - see [LICENSE](LICENSE) for details.
