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

export class SingleFacet {
    constructor(public name: string, public properties: CssProperties) { }
}

export type MultiCssProperties = CssProperties[] & { merged(): CssProperties };

export class Facet {
    facets: SingleFacet[] = [];

    constructor(className: string, properties: CssProperties) {
        this.add(className, properties);
    }

    add(className: string, properties: CssProperties) {
        this.facets.push(new SingleFacet(className, properties));
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

    constructor() {
        this.cardButton = new Facet('card-button', {
            padding: '0 4px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: this.colors.label,
            background: this.colors.inputBg,
            whiteSpace: 'nowrap',
        });
        this.cardHighlight = new Facet('card-highlight', {
            backgroundColor: this.colors.inputBg,
            border: `2px solid ${this.colors.param}`,
        });
        this.cardLowlight = new Facet('card-lowlight', {
            backgroundColor: '',
            border: `1px solid ${this.colors.input}`,
        });

        this.checkbox = new Facet('checkbox', {
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

        this.collapsibleBar = new Facet('collapsible-bar', {
            height: '4px',
            width: '100%',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px 2px 0 0',
            marginBottom: '4px',
            userSelect: 'none',
        });

        this.deck = new Facet('deck', {
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
        });
        const deckArrow = {
            position: 'absolute',
            width: '32px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        };
        this.deckArrowLeft = new Facet('deck-arrow-left', {
            ...deckArrow,
            left: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(90deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
        });
        this.deckArrowRight = new Facet('deck-arrow-right', {
            ...deckArrow,
            right: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(270deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
        });
        this.deckHeaderBar = new Facet('deck-header-bar', {
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
        });
        this.deckHeaderContainer = new Facet('deck-header-container', {
            position: 'relative',
            backgroundColor: this.colors.inputBg,
            overflow: 'hidden',
        });

        const left = 6;
        this.folder = (nested: boolean) => new Facet('folder', {
            marginTop: '4px',
            padding: '0',
            paddingLeft: nested ? `${left}px` : '0',
        });
        this.folderContent = (nested: boolean) => new Facet('folder-content', {
            borderLeft: nested ? `3px solid ${this.colors.border}` : 'none',
            paddingLeft: nested ? `${left}px` : '0',
        });
        this.folderSummary = (nested: boolean) => new Facet('folder-summary', {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
            marginLeft: nested ? `-${left}px` : '0',
            paddingLeft: nested ? `${left - 2}px` : '0',
        });

        this.graphBox = new Facet('graph-box', {
            flexDirection: 'column',
            alignItems: 'flex-start',
        });
        this.graphCanvas = new Facet('graph-canvas', {
            width: '100%',
            height: '80px',
            backgroundColor: this.colors.inputBg,
        });
        this.graphLabel = new Facet('graph-label', {
            marginBottom: '4px',
            cursor: 'pointer',
        });

        this.gui = new Facet('gui', {
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
        this.input = new Facet('input', {
            color: this.colors.param,
            padding: '0',
            boxSizing: 'border-box',
            fontSize: '10px',
        });

        this.label = new Facet('label', {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0 0 0',
        });
        this.labelText = new Facet('label-text', {
            flex: '1',
            marginRight: '8px',
            color: this.colors.label,
        });

        this.numberInput = new Facet('number-input', {
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${this.colors.input}`,
            paddingLeft: '2px',
            color: this.colors.param,
            height: '16px',
            boxSizing: 'border-box',
        });
        this.paramValueContainer = new Facet('param-value-container', {
            width: '110px',
            display: 'flex',
            color: this.colors.param,
        });

        this.rangeControlContainer = new Facet('range-control-container', {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        });
        this.rangeInput = new Facet('range-input', {
            width: '100%',
            height: '16px',
            appearance: 'none',
            background: this.colors.inputBg,
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
        });
        this.rangeValueSpan = new Facet('range-value-span', {
            width: '40px',
            marginLeft: '5px',
        });

        this.selectInput = new Facet('select-input', {
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
        this.title = new Facet('title', {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '4px 0',
            marginBottom: '4px',
            color: this.colors.text,
        });
    }
}

export class Style {
    static colors: StyleColors = {
        border: 'grey',
        input: 'steelblue',
        inputBg: '#2D3748',
        label: 'lightskyblue',
        param: 'gold',
        text: 'lightgray',
    };

    static gui(): CssProperties {
        return {
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
        };
    }

    static collapsibleBar(): CssProperties {
        return {
            height: '4px',
            width: '100%',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px 2px 0 0',
            marginBottom: '4px',
            userSelect: 'none',
        };
    }

    static title(): CssProperties {
        return {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '4px 0',
            marginBottom: '4px',
            color: this.colors.text,
        };
    }

    static folder(isNested: boolean): CssProperties {
        const left = 6;
        return {
            marginTop: '4px',
            padding: '0',
            paddingLeft: isNested ? `${left}px` : '0',
        };
    }

    static folderSummary(isNested: boolean): CssProperties {
        const left = 6;
        return {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
            marginLeft: isNested ? `-${left}px` : '0',
            paddingLeft: isNested ? `${left - 2}px` : '0',
        };
    }

    static folderContent(isNested: boolean): CssProperties {
        const left = 6;
        return {
            borderLeft: isNested ? `3px solid ${this.colors.border}` : 'none',
            paddingLeft: isNested ? `${left}px` : '0',
        };
    }

    static deck(): CssProperties {
        return {
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
        };
    }

    static deckHeaderContainer(): CssProperties {
        return {
            position: 'relative',
            backgroundColor: this.colors.inputBg,
            overflow: 'hidden',
        };
    }

    static deckHeaderBar(): CssProperties {
        return {
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
        };
    }

    static deckArrow(): CssProperties {
        return {
            position: 'absolute',
            width: '32px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        };
    }

    static deckArrowLeft(): CssProperties {
        return {
            ...this.deckArrow(),
            left: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(90deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
        };
    }

    static deckArrowRight(): CssProperties {
        return {
            ...this.deckArrow(),
            right: '0',
            top: '0',
            bottom: '0',
            background: 'linear-gradient(270deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)',
        };
    }

    static cardButton(): CssProperties {
        return {
            padding: '0 4px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: this.colors.label,
            background: this.colors.inputBg,
            whiteSpace: 'nowrap',
        };
    }

    static cardHighlight(): CssProperties {
        return {
            backgroundColor: this.colors.inputBg,
            border: `2px solid ${this.colors.param}`,
        };
    }

    static cardLowlight(): CssProperties {
        return {
            backgroundColor: '',
            border: `1px solid ${this.colors.input}`,
        };
    }

    static label(): CssProperties {
        return {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0 0 0',
        };
    }

    static labelText(): CssProperties {
        return {
            flex: '1',
            marginRight: '8px',
            color: this.colors.label,
        };
    }

    static paramValueContainer(): CssProperties {
        return {
            width: '110px',
            display: 'flex',
            color: this.colors.param,
        };
    }

    static input(): CssProperties {
        return {
            color: this.colors.param,
            padding: '0',
            boxSizing: 'border-box',
            fontSize: '10px',
        };
    }

    static checkbox(): CssProperties {
        return {
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '14px',
            height: '14px',
            backgroundColor: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            position: 'relative',
            cursor: 'pointer',
        };
    }

    static checkboxIndicator(): string {
        const props = {
            content: '""',
            position: 'absolute',
            left: '4px',
            top: '1px',
            width: '4px',
            height: '7px',
            border: `solid ${this.colors.param}`,
            'border-width': '0 2px 2px 0',
            transform: 'rotate(45deg)'
        };

        const cssString = Object.entries(props)
            .map(([key, value]) => `\n${key}:${value}`)
            .join(';');
        return `input[type="checkbox"]:checked::before{${cssString}}`;
    }

    static numberInput(): CssProperties {
        return {
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${this.colors.input}`,
            paddingLeft: '2px',
            color: this.colors.param,
            height: '16px',
            boxSizing: 'border-box',
        };
    }

    static rangeControlContainer(): CssProperties {
        return {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        };
    }

    static rangeInput(): CssProperties {
        return {
            width: '100%',
            height: '16px',
            appearance: 'none',
            background: this.colors.inputBg,
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
        };
    }

    static rangeValueSpan(): CssProperties {
        return {
            width: '40px',
            marginLeft: '5px',
        };
    }

    static selectInput(): CssProperties {
        return {
            width: '100%',
            background: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            height: '16px',
            paddingLeft: '2px',
            boxSizing: 'border-box',
            color: this.colors.param,
            padding: '0',
            fontSize: '10px',
        };
    }

    static graphBox(): CssProperties {
        return {
            flexDirection: 'column',
            alignItems: 'flex-start',
        };
    }

    static graphCanvas(): CssProperties {
        return {
            width: '100%',
            height: '80px',
            backgroundColor: this.colors.inputBg,
        };
    }

    static graphLabel(): CssProperties {
        return {
            marginBottom: '4px',
            cursor: 'pointer',
        };
    }
}
