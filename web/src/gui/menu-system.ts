import { eventBus } from '../core/event-bus.js';
import { MenuBar } from './panels/panel.js';

export class MenuSystem {
    private menuBar: MenuBar;

    constructor(root: HTMLElement) {
        this.menuBar = new MenuBar(root);
        this.setupHelpMenu();
        this.setupSaveMenu();
        this.setupLoadMenu();
    }

    private setupHelpMenu(): void {
        const help = this.menuBar.entry('?');
        help.onClick(() => {
            eventBus.emit('ui:action', { action: 'show-welcome' });
        });
    }

    private setupSaveMenu(): void {
        const saves = this.menuBar.entry('Save');

        saves.entry('As URL in the Clipboard').onClick(() => {
            eventBus.emit('ui:action', { action: 'save-url-clipboard' });
        });

        saves.entry('As JSON').onClick(() => {
            eventBus.emit('ui:action', { action: 'save-json' });
        });

        saves.entry('As JPEG Screenshot').onClick(() => {
            eventBus.emit('ui:action', { action: 'save-screenshot-jpeg' });
        });

        saves.entry('As PNG Texture').onClick(() => {
            eventBus.emit('ui:action', { action: 'save-texture-png' });
        });

        saves.entry('As STL').onClick(() => {
            eventBus.emit('ui:action', { action: 'save-stl' });
        });
    }

    private setupLoadMenu(): void {
        const loads = this.menuBar.entry('Load');

        loads.entry('Continental mix').onClick(() => {
            eventBus.emit('ui:action', { action: 'load-scene', data: { type: 'continental-mix' } });
        });

        loads.entry('Texture lab').onClick(() => {
            eventBus.emit('ui:action', { action: 'load-scene', data: { 
                type: 'texture-lab',
                palette: 'Glacier',
                tiling: 'Quad'
            }});
        });

        loads.entry('Wallpaper').onClick(() => {
            eventBus.emit('ui:action', { action: 'load-scene', data: { 
                type: 'wallpaper',
                palette: 'Praclarush',
                tiling: 'Mirrored'
            }});
        });

        loads.entry('Advanced mode').onClick(() => {
            eventBus.emit('ui:action', { action: 'load-scene', data: { type: 'advanced-mode' } });
        });
    }

    getMenuBar(): MenuBar {
        return this.menuBar;
    }
}
