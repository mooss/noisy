interface StyleColors {
    border: string;
    input: string;
    inputBg: string;
    label: string;
    param: string;
    text: string;
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
        border: 'grey',
        input: 'steelblue',
        inputBg: '#2D3748',
        label: 'lightskyblue',
        param: 'gold',
        text: 'lightgray',
    };

    constructor(private prefix: string) {
        this.button = this.mk('button', {
            padding: '4px 8px',
            backgroundColor: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            color: this.colors.label,
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '10px',
            borderRadius: '2px',
            transition: 'all 0.2s',
            '&:hover': {
                backgroundColor: this.colors.input,
                color: this.colors.text,
                filter: 'brightness(1.2)',
                transform: 'scale(1.05)',
            },
            '&:active': {
                backgroundColor: this.colors.param,
                color: this.colors.inputBg,
                filter: 'brightness(0.8)',
                transform: 'scale(0.95)',
            },
        });
        this.buttonBar = this.mk('button-bar', {
            display: 'flex',
            gap: '4px',
            marginTop: '4px',
            flexWrap: 'wrap',
        });

        this.cardButton = this.mk('card-button', {
            padding: '0 4px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: this.colors.label,
            background: this.colors.inputBg,
            whiteSpace: 'nowrap',
        });
        this.cardHighlight = this.mk('card-highlight', {
            backgroundColor: this.colors.inputBg,
            border: `2px solid ${this.colors.param}`,
        });
        this.cardLowlight = this.mk('card-lowlight', {
            backgroundColor: '',
            border: `1px solid ${this.colors.input}`,
        });

        this.checkbox = this.mk('checkbox', {
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '14px',
            height: '14px',
            backgroundColor: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            position: 'relative',
            cursor: 'pointer',
        });
        const cbicss = Object.entries({
            content: '""',
            position: 'absolute',
            left: '4px',
            top: '1px',
            width: '4px',
            height: '7px',
            border: `solid ${this.colors.param}`,
            'border-width': '0 2px 2px 0',
            transform: 'rotate(45deg)'
        }).map(([key, value]) => `\n${key}:${value}`)
            .join(';');
        this.checkboxIndicator = `input[type="checkbox"]:checked::before{${cbicss}}`;

        this.collapsibleBar = this.mk('collapsible-bar', {
            height: '4px',
            width: '100%',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px 2px 0 0',
            marginBottom: '4px',
            userSelect: 'none',
        });

        this.deck = this.mk('deck', {
            marginTop: '6px',
            flexDirection: 'column',
        });
        const deckArrow = {
            position: 'absolute',
            width: '32px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        };
        this.deckArrowLeft = this.mk('deck-arrow-left', {
            ...deckArrow,
            left: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(90deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
        });
        this.deckArrowRight = this.mk('deck-arrow-right', {
            ...deckArrow,
            right: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(270deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
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

        const left = 6;
        const nestedstr = (nested: boolean) => nested ? 'nested' : 'toplevel';
        this.folder = (nested: boolean) => this.mk(`${nestedstr(nested)}-folder`, {
            marginTop: '4px',
            padding: '0',
            paddingLeft: nested ? `${left}px` : '0',
        });
        this.folderContent = (nested: boolean) => this.mk(`${nestedstr(nested)}-folder-content`, {
            borderLeft: nested ? `3px solid ${this.colors.border}` : 'none',
            paddingLeft: nested ? `${left}px` : '0',
        });
        this.folderSummary = (nested: boolean) => this.mk(`${nestedstr(nested)}-folder-summary`, {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
            marginLeft: nested ? `-${left}px` : '0',
            paddingLeft: nested ? `${left - 2}px` : '0',
        });

        this.graphBox = this.mk('graph-box', {
            flexDirection: 'column',
            alignItems: 'flex-start',
        });
        this.graphCanvas = this.mk('graph-canvas', {
            width: '100%',
            height: '80px',
            backgroundColor: this.colors.inputBg,
        });
        this.graphLabel = this.mk('graph-label', {
            marginBottom: '4px',
            cursor: 'pointer',
        });

        this.gui = this.mk('gui', {
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: '1000',
            width: '230px',
            maxHeight: '90vh',
            padding: '4px',
            backgroundColor: 'rgba(20, 25, 35, 0.85)',
            color: this.colors.text,
            fontSize: '12px',
            borderRadius: '4px',
            overflowY: 'auto',
        });
        this.input = this.mk('input', {
            color: this.colors.param,
            padding: '0',
            boxSizing: 'border-box',
            fontSize: '10px',
        });

        this.label = this.mk('label', {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0 0 0',
        });
        this.labelText = this.mk('label-text', {
            flex: '1',
            marginRight: '8px',
            color: this.colors.label,
        });

        this.numberInput = this.mk('number-input', {
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${this.colors.input}`,
            paddingLeft: '2px',
            color: this.colors.param,
            height: '16px',
            boxSizing: 'border-box',
        });
        this.paramValueContainer = this.mk('param-value-container', {
            width: '110px',
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
            height: '16px',
            appearance: 'none',
            background: this.colors.inputBg,
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
        });
        this.rangeValueSpan = this.mk('range-value-span', {
            width: '40px',
            marginLeft: '5px',
        });

        this.selectInput = this.mk('select-input', {
            width: '100%',
            background: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            height: '16px',
            paddingLeft: '2px',
            boxSizing: 'border-box',
            color: this.colors.param,
            padding: '0',
            fontSize: '10px',
        });
        this.title = this.mk('title', {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '4px 0',
            marginBottom: '4px',
            color: this.colors.text,
        });
    }

    private mk(name: string, properties: CssProperties): Facet {
        return new Facet(name, properties, this.prefix);
    }
}

// Placeholder appearance until finding a proper way to pass an appearance around in GUI code.
export const LemonCloak = new Appearance('lem');
