interface StyleColors {
    background: string;
    border: string;
    input: string;
    inputBg: string;
    label: string;
    param: string;
    text: string;
}

// Adds transparency to a hex colors with 6 components (#789abc).
function transparent(color: string, alpha: number) {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


export interface CssProperties {
    [k: string]: string | number | CssProperties;
}

function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function cssPropertiesToString(props: CssProperties): string {
    return Object.entries(props)
        .filter(([k, v]) => typeof v !== 'object' || k.startsWith('&'))
        .map(([k, v]) => {
            if (typeof v === 'object') return '';
            return `${camelToKebab(k)}:${v};`;
        })
        .join('');
}

function injectFacetCss(className: string, props: CssProperties, prefix: string) {
    const fullClass = prefix ? `${prefix}-${className}` : className;
    let css = `.${fullClass}{${cssPropertiesToString(props)}}`;

    // Handle pseudo-classes (e.g. &:hover, &:active).
    for (const [k, v] of Object.entries(props)) {
        if (k.startsWith('&') && typeof v === 'object') {
            const pseudo = k.slice(1); // e.g. ':hover', ':active.
            css += `\n.${fullClass}${pseudo}{${cssPropertiesToString(v as CssProperties)}}`;
        }
    }

    // Do not inject twice.
    if (!document.getElementById(`facet-style-${fullClass}`)) {
        const style = document.createElement('style');
        style.id = `facet-style-${fullClass}`;
        style.textContent = css;
        document.head.appendChild(style);
    }
}

export class SingleFacet {
    constructor(public name: string, public properties: CssProperties, prefix?: string) {
        if (prefix !== undefined) this.name = prefix + '-' + this.name;
        injectFacetCss(this.name, this.properties, undefined);
    }
}

export type MultiCssProperties = CssProperties[] & { merged(): CssProperties };

export class Facet {
    facets: SingleFacet[] = []; // Public to make sure it is cloneable.

    constructor(className?: string, properties?: CssProperties, public prefix?: string) {
        if (className != null && properties != null) this.add(className, properties);
    }

    add(className: string, properties: CssProperties) {
        this.facets.push(new SingleFacet(className, properties, this.prefix));
    }

    /** Build a new Facet based on this one but with additional properties. */
    derive(className: string, properties: CssProperties, prefix?: string): Facet {
        const res = new Facet();
        // The additional facet must be added last to override the others.
        return res.merge(this, new Facet(className, properties, prefix));
    }

    merge(...facets: Facet[]): this {
        for (let facet of facets) this.facets.push(...facet.facets);
        return this;
    }

    get classes(): string[] { return this.facets.map((f) => f.name) }
    get properties(): MultiCssProperties {
        const res = this.facets.map((f) => f.properties) as MultiCssProperties;
        res.merged = () => Object.assign({}, ...res);
        return res;
    }
}

export class Appearance {
    button: Facet;
    buttonBar: Facet;

    cardButton: Facet;
    cardHighlight: Facet;
    cardLowlight: Facet;

    checkbox: Facet;
    checkboxIndicator: string;

    checkBar: Facet;
    checkBarCheckbox: Facet;

    collapsibleBar: Facet;

    deck: Facet;
    deckArrowLeft: Facet;
    deckArrowRight: Facet;
    deckHeaderBar: Facet;
    deckHeaderContainer: Facet;

    folder: (nested: boolean) => Facet;
    folderContent: (nested: boolean) => Facet;
    folderSummary: (nested: boolean) => Facet;

    graphBox: Facet;
    graphCanvas: Facet;
    graphLabel: Facet;

    gui: Facet;
    input: Facet;

    label: Facet;
    labelText: Facet;

    numberInput: Facet;
    paramValueContainer: Facet;

    rangeControlContainer: Facet;
    rangeInput: Facet;
    rangeThumb: string;
    rangeValueSpan: Facet;

    selectInput: Facet;
    title: Facet;
    tooltip: Facet;

    verticalContainer: Facet;
    verticalChild: Facet;

    window: Facet;
    windowHeader: Facet;
    windowTitle: Facet;
    windowCloseButton: Facet;
    windowContent: Facet;

    colors: StyleColors = {
        background: '#000000',
        border: '#aaaaaa',
        input: '#ffffff',
        inputBg: '#000000',
        label: '#dddddd',
        param: '#dddddd',
        text: '#eeeeee',
    };

    border(color = this.colors.border) { return `2px solid ${color}` }

    constructor(private prefix: string) {
        const base = {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            boxSizing: 'border-box',
        };

        this.button = this.mk('button', {
            ...base,
            fontWeight: 500,
            backgroundColor: 'transparent',
            border: this.border(),
            color: this.colors.label,
            cursor: 'pointer',
            transition: 'all 0.1s',
            fontVariantCaps: 'small-caps',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: this.colors.input,
            },
            '&:active': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
        });
        this.buttonBar = this.mk('button-bar', {
            display: 'flex',
            gap: '2px',
            margin: '1px 0 0 2px',
            flexWrap: 'wrap',
            paddingTop: '2px'
        });

        this.cardButton = this.mk('card-button', {
            ...base,
            fontWeight: 500,
            padding: '0 2px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: this.colors.label,
            background: 'transparent',
            whiteSpace: 'nowrap',
            '&:hover': {
                borderColor: this.colors.input,
            },
        });
        this.cardHighlight = this.mk('card-highlight', {
            backgroundColor: this.colors.inputBg,
            border: this.border(this.colors.param),
        });
        this.cardLowlight = this.mk('card-lowlight', {
            backgroundColor: 'transparent',
            border: this.border(),
        });

        this.checkbox = this.mk('checkbox', {
            ...base,
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '12px',
            height: '12px',
            backgroundColor: 'transparent',
            border: this.border(this.colors.input),
            position: 'relative',
            cursor: 'pointer',
        });
        this.checkboxIndicator = `input[type="checkbox"]:checked { background-color: ${this.colors.input}; }`;

        this.checkBar = this.mk('dismiss-bar', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2px 4px',
            backgroundColor: this.colors.inputBg,
            borderTop: this.border(),
            marginTop: 'auto',
        });
        this.checkBarCheckbox = this.checkbox.derive('dismiss-bar-checkbox', {
            marginRight: '3px',
        });

        this.collapsibleBar = this.mk('collapsible-bar', {
            height: '8px',
            margin: '2px 2px 2px 2px',
            cursor: 'pointer',
            backgroundColor: this.colors.border,
            userSelect: 'none',
        });

        this.deck = this.mk('deck', {
            marginTop: '2px',
            flexDirection: 'column',
        });
        this.deckArrowLeft = this.mk('deck-arrow-left', {
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '15px',
            background: `linear-gradient(90deg, ${this.colors.background} 0%, transparent 100%)`,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        });
        this.deckArrowRight = this.mk('deck-arrow-right', {
            position: 'absolute',
            right: '0',
            top: '0',
            bottom: '0',
            width: '15px',
            background: `linear-gradient(270deg, ${this.colors.background} 0%, transparent 100%)`,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        });
        this.deckHeaderBar = this.mk('deck-header-bar', {
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            marginBottom: '1px',
        });
        this.deckHeaderContainer = this.mk('deck-header-container', {
            position: 'relative',
            overflow: 'hidden',
        });

        this.folder = (nested: boolean) => this.mk(`folder-${nested ? 'nested' : 'toplevel'}`, {
            // The border-image with linear-gradient trick hides a few pixels on the left of the
            // nested folder.
            // This makes the nesting more visible and the interface more readable.
            borderImage: nested ? `linear-gradient(to right, transparent 12px, ${this.colors.border} 0) 1 stretch` : '',
            borderTop: this.border(),
            marginTop: '4px',
            padding: '0',
            paddingLeft: nested ? '6px' : '0',
        });
        this.folderContent = (nested: boolean) => this.mk(`folder-content-${nested ? 'nested' : 'toplevel'}`, {
            borderLeft: nested ? this.border() : 'none',
            paddingLeft: nested ? '3px' : '1px',
            marginLeft: '2px',
        });
        this.folderSummary = (nested: boolean) => this.mk(`folder-summary-${nested ? 'nested' : 'toplevel'}`, {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '1px 0',
            marginLeft: nested ? '-6px' : '4px',
            paddingLeft: nested ? '6px' : '0',
        });

        this.graphBox = this.mk('graph-box', {
            flexDirection: 'column',
            alignItems: 'flex-start',
        });
        this.graphCanvas = this.mk('graph-canvas', {
            width: '100%',
            height: '100px',
            backgroundColor: this.colors.inputBg,
        });
        this.graphLabel = this.mk('graph-label', {
            marginBottom: '1px',
            cursor: 'pointer',
        });

        this.gui = this.mk('gui', {
            ...base,
            position: 'absolute',
            display: 'block',
            top: '0',
            left: '0',
            zIndex: '1000',
            width: '245px',
            maxHeight: '90vh',
            backgroundColor: transparent(this.colors.background, .85),
            color: this.colors.text,
            borderRadius: '0px',
            overflowY: 'auto',
            border: this.border(),
        });
        this.input = this.mk('input', {
            ...base,
            color: this.colors.param,
            marginLeft: '2px',
            boxSizing: 'border-box',
        });

        this.label = this.mk('label', {
            display: 'flex',
            alignItems: 'center',
            padding: '1px 0',
            position: 'relative',
            marginLeft: '2px',
        });
        this.labelText = this.mk('label-text', {
            flex: '1',
            marginRight: '3px',
            color: this.colors.label,
        });

        this.numberInput = this.mk('number-input', {
            ...base,
            width: '100%',
            background: 'transparent',
            border: this.border(),
            paddingLeft: 0,
            marginRight: '2px',
            paddingRight: 0,
            color: this.colors.param,
            height: '18px',
            boxSizing: 'border-box',
        });
        this.paramValueContainer = this.mk('param-value-container', {
            width: '120px',
            display: 'flex',
            color: this.colors.param,
        });

        this.rangeControlContainer = this.mk('range-control-container', {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        });
        this.rangeInput = this.mk('range-input', {
            width: '100%',
            height: '12px',
            appearance: 'none',
            background: this.colors.inputBg,
            border: this.border(),
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
            borderRadius: '0px',
        });
        this.rangeThumb = `input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 2px;
    height: 12px;
    background: ${this.colors.input};
    cursor: pointer;
}
input[type="range"]::-moz-range-thumb {
    width: 2px;
    height: 12px;
    background: ${this.colors.input};
    cursor: pointer;
    border: none;
    border-radius: 0;
}`;
        this.rangeValueSpan = this.mk('range-value-span', {
            width: '40px',
            marginLeft: '3px',
        });

        this.selectInput = this.mk('select-input', {
            ...base,
            width: '100%',
            height: '18px',
            background: 'transparent',
            border: this.border(),
            marginRight: '2px',
            color: this.colors.param,
            // padding: '1px 10px 5px 4px',
            fontSize: '10px',
        });
        this.title = this.mk('title', {
            ...base,
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '14px',
            padding: '1px 0',
            marginBottom: '-3px',
            color: this.colors.text,
        });
        this.tooltip = this.mk('tooltip', {
            backgroundColor: transparent(this.colors.background, .95),
            color: this.colors.text,
            border: this.border(),
            borderRadius: '0px',
            padding: '2px',
            fontSize: '10px',
            maxWidth: '200px',
            marginTop: '2px',

            // Without this, tooltip behaviour is inconsistent and sometimes the tooltip persist
            // when leaving the label and hovering it.
            pointerEvents: 'none',

            // Don't put the tooltip inside the containing element, which would squash the other
            // contained elements.
            position: 'absolute',

            // Display the tooltip below the element.
            top: '100%',

            // Collapse on whitespace and always break on newlines.
            whiteSpace: 'pre-line',

            // Ensures that the tooltip is in front and that the transparency hides what is behind.
            zIndex: '1001',
        });

        this.verticalContainer = this.mk('vertical-stack', {
            position: 'fixed',
            display: 'flex',
            flexDirection: 'column',

            // Required for the scroll bar.
            overflowY: 'auto',
            maxHeight: '100vh',
        });
        this.verticalChild = this.mk('vertical-container', {
            position: 'relative', // Make child appear within the container.

            // Remove scroll bar of child element.
            overflow: 'visible',
            maxHeight: 'none',
        });

        this.window = this.mk('window', {
            position: 'absolute',
            zIndex: '2000',
            backgroundColor: transparent(this.colors.background, .95),
            border: this.border(),
            borderRadius: '0px',
            minWidth: '300px',
            maxWidth: '600px',
        });
        this.windowHeader = this.mk('window-header', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1px 4px',
            backgroundColor: this.colors.inputBg,
            borderBottom: this.border(),
            cursor: 'move',
        });
        this.windowTitle = this.mk('window-title', {
            color: this.colors.text,
            fontWeight: 'normal',
        });
        this.windowCloseButton = this.mk('window-close-button', {
            background: 'transparent',
            border: 'none',
            color: this.colors.label,
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0',
            marginTop: '-1px',
            '&:hover': {
                color: this.colors.input,
            },
        });
        this.windowContent = this.mk('window-content', {
            padding: '4px 6px',
            color: this.colors.text,
        });
    }

    private mk(name: string, properties: CssProperties): Facet {
        return new Facet(name, properties, this.prefix);
    }
}

// Placeholder appearance until implementing a proper way to pass an appearance around in GUI code.
export const Blawhi = new Appearance('blawhi');

////////////////////
// Utility facets //

export const POSITION_TOP_RIGHT = new Facet('position-right', { top: 0, right: 0 });
export const POSITION_TOP_LEFT = new Facet('position-left', { left: 0, top: 0 });
