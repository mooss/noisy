interface StyleColors {
    border: string;
    input: string;
    inputBg: string;
    label: string;
    param: string;
    text: string;
}

interface CSSProperties {
    [key: string]: string | number | object;
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

    static gui() {
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

    static collapsibleBar() {
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

    static title() {
        return {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '4px 0',
            marginBottom: '4px',
            color: this.colors.text,
        };
    }

    static folder(isNested) {
        const left = 6;
        return {
            marginTop: '4px',
            padding: '0',
            paddingLeft: isNested ? `${left}px` : '0',
        };
    }

    static folderSummary(isNested) {
        const left = 6;
        return {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
            marginLeft: isNested ? `-${left}px` : '0',
            paddingLeft: isNested ? `${left-2}px` : '0',
        };
    }

    static folderContent(isNested) {
        const left = 6;
        return {
            borderLeft: isNested ? `3px solid ${this.colors.border}` : 'none',
            paddingLeft: isNested ? `${left}px` : '0',
        };
    }

    static deck() {
        return {
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
        };
    }

    static deckHeaderContainer() {
        return {
            position: 'relative',
            backgroundColor: this.colors.inputBg,
            overflow: 'hidden',
        };
    }

    static deckHeaderBar() {
        return {
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
        };
    }

    static deckArrow() {
        return {
            position: 'absolute',
            width: '32px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        };
    }

    static cardButton() {
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

    static label() {
        return {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0 0 0',
        };
    }

    static labelText() {
        return {
            flex: '1',
            marginRight: '8px',
            color: this.colors.label,
        };
    }

    static paramValueContainer() {
        return {
            width: '110px',
            display: 'flex',
            color: this.colors.param,
        };
    }

    static input() {
        return {
            color: this.colors.param,
            padding: '0',
            boxSizing: 'border-box',
            fontSize: '10px',
        };
    }

    static checkbox() {
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

    static numberInput() {
        return {
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${this.colors.input}`,
            paddingLeft: '2px',
        };
    }

    static rangeInput() {
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

    static rangeValueSpan() {
        return {
            width: '40px',
            marginLeft: '5px',
        };
    }

    static selectInput() {
        return {
            width: '100%',
            background: this.colors.inputBg,
            border: `1px solid ${this.colors.input}`,
            height: '16px',
            paddingLeft: '2px',
            boxSizing: 'border-box',
        };
    }

    static graphCanvas() {
        return {
            width: '100%',
            height: '80px',
            backgroundColor: this.colors.inputBg,
        };
    }

    static graphLabel() {
        return {
            marginBottom: '4px',
            cursor: 'pointer',
        };
    }
}
