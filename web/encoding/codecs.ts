import { compressToBase64, decompressFromBase64 } from "lz-string";
import { combinations, mapit } from "../utils/iteration.js";
import { sortedMap } from "../utils/maps.js";
import { climbTree, countNodes, cultivateTree } from "../utils/tree.js";
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

/*
 * Roughly estimate the size of a primitive encoded through Lexon64.
 * Does not return a byte size estimation, but an arbitrary unit.
 *
 * @param obj - The object whose size to estimate.
 * @returns the estimated size.
 */
function estimatePrimitiveSize(obj: any): number {
    if (obj == null) return 4; // Special case because typeof null is object.
    switch (typeof obj) {
        case 'symbol': // Encoded in JSON as undefined.
        case 'function': // Same.
        case 'undefined':
            return 9;
        case 'boolean':
            if (obj) return 4;
            return 5;
        case 'bigint':
        case 'number':
        case 'string': // .length does not exist here somehow.
            obj.toString().length;
        case 'object':
            return JSON.stringify(obj).length; // Accurate but more costly.
    }
}

interface nodeFootprint { size: number; count: number; }
function estimateNodeFootprints(obj: any): Map<any, nodeFootprint> {
    const footprints = new Map<any, nodeFootprint>();
    const accumulate = (node: any) => {
        let current = footprints.get(node);
        if (current === undefined) {
            current = {size: estimatePrimitiveSize(node), count: 0};
            footprints.set(node, current);
        }
        current.count++;
    }

    climbTree(accumulate, accumulate, obj);
    return footprints;
}

/**
 * Encodes and decodes a document using a Lexicon generated from a reference document.
 */
export class Lexicon extends CodecABC<any, any> {
    protected forward = new Map<any, string>();
    protected backward = new Map<string, any>();

    constructor(reference: Object, alphabet: string) {
        super();
        const fp = estimateNodeFootprints(reference);
        const sizeSortedNodes = sortedMap(fp, ([_0, lv], [_1, rv]) => rv.size * rv.count - lv.size * lv.count);

        // Combinations on the alphabet (e.g. for latin alphabet [a, b, c, ..., aa, ab, ...]).
        const combos = mapit((x) => x.join(''), combinations(alphabet));

        for (const [term] of sizeSortedNodes) {
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
        return cultivateTree(translate, translate, document);
    }

    decode(document: any): any {
        const translate = (item: any) => {
            if (this.backward.has(item)) return this.backward.get(item);
            // Handle the special case where the = prefix has been used to encode a literal string.
            if (typeof item == 'string' && item.length > 0 && item[0] === '=')
                return item.slice(1);
            return item;
        }
        return cultivateTree(translate, translate, document);
    }
}

/**
 * Translate all the caracters in a string by mapping its characters from one set to another (like
 * the tr command).
 *
 * @param source - The initial string to transform.
 * @param from   - The characters to replace.
 * @param to     - The replacement characters (must contain the same amount as the caracters to replace).
 * @returns a new string that has been translated.
 */
function tr(source: string, from: string, to: string): string {
    return source.split('').map((chr: string) => {
        const idx = from.indexOf(chr);
        if (from.includes(chr)) return to[idx];
        return chr;
    }).join('');
}

function base64ToGet(b64: string) {
    return tr(b64, '+/=', '-_.');
}

function getToBase64(url: string) {
    return tr(url, '-_.', '+/=');
}

/** Compression utility using a lexicon, JSON and base64. */
export class Lexon64 extends CodecABC<any, string> {
    private lex: Lexicon;
    constructor(source: Object, alphabet: string) {
        super();
        this.lex = new Lexicon(source, alphabet);
    }

    encode(document: any): string {
        return base64ToGet(compressToBase64(JSON.stringify(this.lex.encode(document))));
    }

    decode(document: string): any {
        return this.lex.decode(JSON.parse(decompressFromBase64(getToBase64(document))));
    }
}

export class AutoCodec<To> extends CodecABC<any, To> {
    constructor(private wrapped: Codec<any, To>, private creator: Creator<any>) { super() }
    encode(document: any): To { return this.wrapped.encode(encrec(document)) }
    decode(document: To): any { return decrec(this.wrapped.decode(document), this.creator) }
}
