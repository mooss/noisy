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
