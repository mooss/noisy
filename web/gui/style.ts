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

    constructor(className: string, properties: CssProperties, public prefix?: string) {
        this.add(className, properties);
    }

    add(className: string, properties: CssProperties) {
        this.facets.push(new SingleFacet(className, properties, this.prefix));
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
    rangeValueSpan: Facet;

    selectInput: Facet;
    title: Facet;

    colors: StyleColors = {
        background: '#1a202c',
        border: '#4a5568',
        input: '#63b3ed',
        inputBg: '#2d3748',
        label: '#68d391',
        param: '#f6ad55',
        text: '#e2e8f0',
    };

    constructor(private prefix: string) {
        const base = {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            boxSizing: 'border-box',
        };

        this.button = this.mk('button', {
            ...base,
            backgroundColor: 'transparent',
            border: `1px solid ${this.colors.border}`,
            color: this.colors.label,
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '2px',
            transition: 'all 0.1s',
            fontVariantCaps: 'small-caps',
            '&:hover': {
                backgroundColor: 'rgba(100, 149, 237, 0.13)',
                borderColor: this.colors.input,
            },
            '&:active': {
                backgroundColor: 'rgba(100, 149, 237, 0.26)',
            },
        });
        this.buttonBar = this.mk('button-bar', {
            display: 'flex',
            gap: '2px',
            marginTop: '2px',
            flexWrap: 'wrap',
            padding: '2px'
        });

        this.cardButton = this.mk('card-button', {
            ...base,
            padding: '0 3px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: this.colors.label,
            background: 'transparent',
            whiteSpace: 'nowrap',
            border: '1px solid transparent',
            '&:hover': {
                borderColor: this.colors.input,
            },
        });
        this.cardHighlight = this.mk('card-highlight', {
            backgroundColor: this.colors.inputBg,
            border: `1px solid ${this.colors.param}`,
        });
        this.cardLowlight = this.mk('card-lowlight', {
            backgroundColor: 'transparent',
            border: `1px solid ${this.colors.border}`,
        });

        this.checkbox = this.mk('checkbox', {
            ...base,
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '12px',
            height: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${this.colors.input}`,
            position: 'relative',
            cursor: 'pointer',
        });
        this.checkboxIndicator = `input[type="checkbox"]:checked { background-color: ${this.colors.input}; }`;

        this.collapsibleBar = this.mk('collapsible-bar', {
            height: '6px',
            width: '100%',
            cursor: 'pointer',
            backgroundColor: this.colors.border,
            margin: '2px 0',
            userSelect: 'none',
        });

        this.deck = this.mk('deck', {
            marginTop: '4px',
            flexDirection: 'column',
        });
        this.deckArrowLeft = this.mk('deck-arrow-left', {
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '20px',
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
            width: '20px',
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
        });
        this.deckHeaderContainer = this.mk('deck-header-container', {
            position: 'relative',
            overflow: 'hidden',
        });

        this.folder = (nested: boolean) => this.mk(`folder-${nested ? 'nested' : 'toplevel'}`, {
            marginTop: '2px',
            padding: '0',
            paddingLeft: nested ? '8px' : '0',
        });
        this.folderContent = (nested: boolean) => this.mk(`folder-content-${nested ? 'nested' : 'toplevel'}`, {
            borderLeft: nested ? `1px solid ${this.colors.border}` : 'none',
            paddingLeft: nested ? '8px' : '0',
        });
        this.folderSummary = (nested: boolean) => this.mk(`folder-summary-${nested ? 'nested' : 'toplevel'}`, {
            cursor: 'pointer',
            fontWeight: 500,
            padding: '2px 0',
            marginLeft: nested ? '-8px' : '0',
            paddingLeft: nested ? '8px' : '0',
        });

        this.graphBox = this.mk('graph-box', {
            flexDirection: 'column',
            alignItems: 'flex-start',
        });
        this.graphCanvas = this.mk('graph-canvas', {
            width: '100%',
            height: '60px',
            backgroundColor: this.colors.inputBg,
        });
        this.graphLabel = this.mk('graph-label', {
            marginBottom: '2px',
            cursor: 'pointer',
        });

        this.gui = this.mk('gui', {
            ...base,
            position: 'absolute',
            top: '4px',
            left: '4px',
            zIndex: '1000',
            width: '230px',
            maxHeight: '90vh',
            padding: '3px',
            backgroundColor: transparent(this.colors.background, .9),
            color: this.colors.text,
            borderRadius: '3px',
            overflowY: 'auto',
            border: `1px solid ${this.colors.border}`,
        });
        this.input = this.mk('input', {
            ...base,
            color: this.colors.param,
            padding: '0',
            boxSizing: 'border-box',
        });

        this.label = this.mk('label', {
            display: 'flex',
            alignItems: 'center',
            padding: '2px 0',
        });
        this.labelText = this.mk('label-text', {
            flex: '1',
            marginRight: '4px',
            color: this.colors.label,
            height: '16px',
        });

        this.numberInput = this.mk('number-input', {
            ...base,
            width: '100%',
            background: 'transparent',
            border: `1px solid ${this.colors.border}`,
            paddingLeft: '2px',
            color: this.colors.param,
            height: '16px',
            boxSizing: 'border-box',
        });
        this.paramValueContainer = this.mk('param-value-container', {
            width: '100px',
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
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
            borderRadius: '2px',
        });
        this.rangeValueSpan = this.mk('range-value-span', {
            width: '30px',
            marginLeft: '4px',
        });

        this.selectInput = this.mk('select-input', {
            ...base,
            width: '100%',
            background: 'transparent',
            border: `1px solid ${this.colors.border}`,
            paddingLeft: '2px',
            boxSizing: 'border-box',
            color: this.colors.param,
            fontSize: '11px',
        });
        this.title = this.mk('title', {
            ...base,
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '12px',
            padding: '2px 0',
            marginBottom: '2px',
            color: this.colors.text,
        });
    }

    private mk(name: string, properties: CssProperties): Facet {
        return new Facet(name, properties, this.prefix);
    }
}

// Placeholder appearance until implementing a proper way to pass an appearance around in GUI code.
export const Gardener = new Appearance('gard');
