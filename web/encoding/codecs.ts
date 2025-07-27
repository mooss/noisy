import { combinations, mapit } from "../utils/iteration.js";
import { sortedMap } from "../utils/maps.js";
import { countNodes, grow } from "../utils/tree.js";
import { Creator, decrec, encrec } from "./self-encoder.js";

export interface Codec<From, To> {
    encode(document: From): To;
    decode(document: To): From;
    /** Encodes and decodes the document, hopefully resulting in the same document. */
    roundtrip(document: From): From;
}

export abstract class CodecABC<From, To> implements Codec<From, To> {
    abstract encode(document: From): To;
    abstract decode(document: To): From;
    roundtrip(document: From): From { return this.decode(this.encode(document)) }
}

/**
 * Encodes and decodes a document using a Lexicon generated from a reference document.
 */
export class Lexicon extends CodecABC<any, any> {
    protected forward = new Map<any, string>();
    protected backward = new Map<string, any>();

    constructor(reference: Object, alphabet: string) {
        super();
        const counter = sortedMap(countNodes(reference), ([lk, lv], [rk, rv]) => {
            const res = rv - lv;
            if (res != 0) return res;
            // Hopefully deterministic across all machines.
            return String(lk).localeCompare(String(rk), 'en-US');
        });
        const combos = mapit((x) => x.join(''), combinations(alphabet));

        for (const [term] of counter) {
            const compressed = combos.next().value;
            this.forward.set(term, compressed);
            this.backward.set(compressed, term);
        }
    }

    encode(document: any): any {
        const translate = (item: any) => {
            if (this.forward.has(item)) return this.forward.get(item);

            // It's possible to have strings that:
            //  1. Were not in the reference document that established the lexicon.
            //  2. Are in the document to encode.
            //  3. Are part of the construsted lexicon.
            //
            // Such strings would be incorrectly decoded if left untouched, so a string starting
            // with = is used to symbolize that what follows is a literal strings, not something to
            // lookup.
            if (typeof item == 'string' && (this.backward.has(item) || item.startsWith('=')))
                return '=' + item;

            return item;
        }
        return grow(translate, translate, document);
    }

    decode(document: any): any {
        const translate = (item: any) => {
            if (this.backward.has(item)) return this.backward.get(item);
            // Handle the special case where the = prefix has been used to encode a literal string.
            if (typeof item == 'string' && item.length > 0 && item[0] === '=')
                return item.slice(1);
            return item;
        }
        return grow(translate, translate, document);
    }
}

/** btoa alternative that doesn't choke on unicode. */
function utfbtoa(data: string): string {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);
    let binaryString = '';
    uint8Array.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
}

/** atob alternative that doesn't choke on unicode. */
function utfatob(data: string): string {
    const binaryString = atob(data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(uint8Array);
}

/** Compression utility using a lexicon, JSON and base64. */
export class Lexon64 extends CodecABC<any, string> {
    private lex: Lexicon;
    constructor(source: Object, alphabet: string) {
        super();
        this.lex = new Lexicon(source, alphabet);
    }

    encode(document: any): string {
        return utfbtoa(JSON.stringify(this.lex.encode(document)));
    }

    decode(document: string): any {
        return this.lex.decode(JSON.parse(utfatob(document)));
    }
}

export class AutoCodec<To> extends CodecABC<any, To> {
    constructor(private wrapped: Codec<any, To>, private creator: Creator<any>) { super() }
    encode(document: any): To { return this.wrapped.encode(encrec(document)) }
    decode(document: To): any { return decrec(this.wrapped.decode(document), this.creator) }
}
