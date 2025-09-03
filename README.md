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

<a title="Open scene in browser" href="https://mooss.github.io/noisy/bean/?q=N4IghgDiBcoMY1GAjjcAvEAaEAFRIAojAIwBsAnAHQCsZAHBQOz1MAMjATJzgGIwBaEvQAsVEZzZk2AZnr1ONDjKY4A4jBoVOVNiJkia-mos6iAvjjABPAsWghbfNE5AaHAdxDnLIAEYEYGhgAE7evmAAzgQIsCAASmgAktjg_A4ApqlgAKpocACWIXAANlk4ECEZAG4FAPYArpEAygXoWQ62vgFxQQ5gAC7hVgDWMQQFaOXgAMJoXjj4cfYg1anpq6nubFRynDKcZEeHZHIsnD44PUjBJcPgAOrjvQBawWBBVgCKaABCIQUAOYACwGAAI4HUAHYDApQjIw7L2JAAKwIADkYDsyBE1nFMf0AGb3MC_LFUCj0bqBYIANXugII13AwQAKt4cLEkGAOqBmX1wM0OSAuSAAFIEADSTJp_TACF8orAAA15iSCXzZeAAPLCpXS_qMqwpfrA7JgZn8tB1PUERlxK0OIaKghmhzEy4gKBxAAmU1SqAcAA9UmEHGMcFC0A1hdE4pMHABbVJohx3HB-zLhHyegCyaGlOAAIjLeu9Ji7egBBGA6EhWACaaHZVjAbs1ZadtribpAHt8JYdWo-fsrSC8Was-bl2RDDhrxdLN36AAlu6AJXEhkPOyAbWOQPaO8uQM7Oa60P2KgRMyA1zhAyBMDgwyAIyAow4Y7446AEyBkxwVMQHTEBbyyHMcDJHcT33c84iPfwtTJA9dQcH4cDmedUl7K8vRvNA1gfNBnxAV97w_UgqBxHBfxAf9AJAYDQPA7McAAGSXFl-m_eCkGTGDuL3ddDy4gUzxFC9oE4ChPW9UBbyeYiHBSF80HfT8QF4kA6IYlM0BY_1IPAMBiUEgU4MkhCxL-ES0JADCQCwkAFxAN0DjkgiHHpZSn1DdTUk0t4fwmNBGOY1JWOM1MkHcEA8isTcQCbKxBxAVUc18acQBQzK8tbRCwESfpJisJZwACKxOP6KMfCAA.">
  <img src="https://mooss.github.io/noisy/bean/scenes/continental-ridges.jpeg" alt="Screen capture of procedurally-generated landscape">
</a>

Click the image to load this particular scene.

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
