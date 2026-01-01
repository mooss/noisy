import { VERSION } from '../../config/constants.js';
import { CheckBar } from './components/widget.js';
import { Window } from './components/window.js';
import { MenuBar } from './panels/panel.js';
import { VerticalStack } from './panels/vertical-stack.js';



const DONT_SHOW_WELCOME_STORAGE_KEY = VERSION.storageKey('dont-show-welcome');
const welcomeMessage = `
Welcome to Noisy, a procedural generation sandbox.<br/>
<br/>
The goal of this project is to create and navigate interesting procedurally-generated terrain.<br/>
It can also create textures.<br/>
You can create your own terrain by tweaking the parameters available in the control panels.

<h3>Controls</h3>
<ul>
  <li><strong>WASD</strong> to move</li>
  <li><strong>Mouse wheel</strong> to zoom</li>
  <li><strong>Left click + mouse</strong> to pan around the map</li>
  <li><strong>Right click + mouse</strong> to rotate the camera</li>
</ul>

<h3>Overview of the UI</h3>
<ul>
  <li><strong>Menu Bar</strong>
    <ul>
      <li><strong>?</strong> - Show this welcome screen</li>
      <li><strong>Save</strong> - Save the terrain as a shareable URL, a JSON save file, a screenshot, a texture or an STL file</li>
      <li><strong>Load</strong> - Load pre-defined scenes</li>
    </ul>
  </li>

  <li><strong>Chunks</strong> - Control how much terrain is rendered around the avatar</li>
  <li><strong>Render</strong> - Adjust how the terrain is rendered</li>
  <li><strong>Terrain Generation</strong> - Mix different noise types to create varied landscapes and textures</li>
</ul>`;

/**
 * Manages the overall UI layout and welcome experience.
 */
export class UIManager {
    private topMenu: MenuBar | null = null;
    private leftPanel: VerticalStack | null = null;
    private welcomeWindow: Window | null = null;

    /**
     * Registers the main layout components.
     */
    registerLayout(topMenu: MenuBar, guiStack: VerticalStack): void {
        this.topMenu = topMenu;
        this.leftPanel = guiStack;
    }

    /**
     * Recalculates the vertical bounds of {@link leftPanel} so that it sits exactly between the
     * bottom of {@link topMenu} and the top of the footer element.
     */
    adjustStackBounds(): void {
        if (!this.topMenu || !this.leftPanel) return;

        const menu = this.topMenu._elt;
        const footer = document.getElementById('footer');
        if (!footer) return;

        const menuRect = menu.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const top = menuRect.bottom;
        const bottom = window.innerHeight - footerRect.top;

        this.leftPanel._elt.style.top = `${top}px`;
        this.leftPanel._elt.style.bottom = `${bottom}px`;
        this.leftPanel._elt.style.maxHeight = 'none';
    }

    /**
     * Displays the welcome window, taking into account the user's preference to not show it on
     * startup.
     */
    showWelcome(): void {
        if (this.welcomeWindow) { // Already created, must be shown on user request.
            this.welcomeWindow.show();
            return;
        }
        this.welcomeWindow = new Window(`Noisy ${VERSION.string()}`, welcomeMessage);

        const check = new CheckBar(
            this.welcomeWindow.container,
            (checked: boolean) => {
                if (checked) localStorage.setItem(DONT_SHOW_WELCOME_STORAGE_KEY, 'true');
                this.welcomeWindow?.hide();
                check.hide();
            },
            "Don't show again",
            'Close'
        );

        if (localStorage.getItem(DONT_SHOW_WELCOME_STORAGE_KEY) === 'true') {
            this.welcomeWindow.hide();
            check.hide();
        }
    }
}
