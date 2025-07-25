import { combinations, mapit } from "./iteration.js";
import { sortedMap } from "./maps.js";
import { countNodes, grow } from "./tree.js";

function translateTree(data: Object, lexicon: Map<any, any>): any {
    const translate = (item: any): any => {
        if (lexicon.has(item)) return lexicon.get(item);
        return item;
    }
    return grow(translate, translate, data);
}

export class Lexicon {
    private forward = new Map<any, string>();
    private backward = new Map<string, any>();

    constructor(source: Object, alphabet: string) {
        const counter = sortedMap(countNodes(source), ([lk, lv], [rk, rv]) => {
            const res = rv - lv;
            if (res != 0) return res;
            // Hopefully deterministic across all machines.
            return String(lk).localeCompare(String(rk), 'en-US');
        });
        const combos = mapit((x) => x.join(''), combinations(alphabet));
        console.log(counter);

        for (const [term] of counter) {
            const compressed = combos.next().value;
            console.log(':COMPRESSION', term, '=>', compressed);
            this.forward.set(term, compressed);
            this.backward.set(compressed, term);
        }
    }

    /** Encodes the source using the valid parts of the lexicon */
    encode(document: any): any { return translateTree(document, this.forward) }

    /** Decodes the document using the backward lexicon */
    decode(document: any): any { return translateTree(document, this.backward) }

    /** Encodes and decodes the document, hopefully resulting in the same document. */
    roundtrip(document: any): any { return this.decode(this.encode(document)) }
}
