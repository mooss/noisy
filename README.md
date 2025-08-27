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

<a title="Open scene in browser" href="https://mooss.github.io/noisy/acorn/?q=N4IghmIFygxtoDi0QBEQBpwFsUFNNwBnFWASwCdYAbArABwrwDcyB7AVyIGUyAvAlACMAJgAcAXywAjBOBRhZEqSADqc-DBABzfITBkUACUIAtBbpWytkKCABqIZVjAAXDXLAB3Bc30UUAE19ajkAVTkAMWgABgA6ADYVMAAzKJQARSdkgAsUAGEnGU8FDmysNK1rUFtwAA8ikE0agGtYuJiAZhcAQTlq-TswNkbmkG45PqqSuwBHUblK0AHavpUxkbs_LDy7ADtCHztQ5xAArQATFAAhQhI7AE9CdzsAK0J6FAaVMq1dO1wWEMdjaWCudgIyhUfH6MxA83Wi1hNhQMMRWk2IG2IF2IAOWCOIBOKnOoHBIFuWHuICeWBeIHeDC-jV-oH-IEBIGBIFBIHJkNOAFFkTUFFd0aAABoiwbwhZaJYgFYoNZYDYobG4_EgQnErCkvkoADSdxQ6DpKEZIE-dm-WFZOhQnO5vP52WST2mKLm8tAiuVdjRarkmM1GsO0BESRJcnJABlTY9npaPigAAosuTs50oV16KFAzwHOwAKX0NpAAHl9O87AA5d3JQQgYVQ5IwmzzOwAJX0mhAABVskA.">
  <img src="https://raw.githubusercontent.com/mooss/mooss.github.io/refs/heads/main/noisy/readme-screencap.png" alt="Screen capture of procedurally-generated landscape">
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
