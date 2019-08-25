/**
 * Inline-Level Grammar
 */

import * as block from "./block";
import { noop } from "./noop";
import { edit } from "./utils";

export class Inline {
    public escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
    public autolink = /^<(scheme:[^\s\x00-\x1f<>]*|email)>/;
    public url: RegExp = noop as any;
    public tag: RegExp;
    public _tag = '^comment'
        + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
        + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
        + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
        + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
        + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>'; // CDATA section
    public link = /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/;
    public reflink = /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/;
    public nolink = /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/;
    public strong = /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/;
    public em = /^_([^\s_])_(?!_)|^\*([^\s*<\[])\*(?!\*)|^_([^\s<][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_<][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s<"][\s\S]*?[^\s\*])\*(?!\*|[^\spunctuation])|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/;
    public code = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
    public br = /^( {2,}|\\)\n(?!\s*$)/;
    public del: RegExp = noop as any;
    public text = /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/;

    public _backpedal: RegExp; 

    // list of punctuation marks from common mark spec
    // without ` and ] to workaround Rule 17 (inline code blocks/links)
    public _punctuation = '!"#$%&\'()*+,\\-./:;<=>?@\\[^_{|}~';
    public _escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
    public _scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
    public _email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
    public _attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

    public _label = /(?:\[[^\[\]]*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
    public _href = /<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*/;
    public _title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

    constructor() {
        this.em = edit(this.em).replace(/punctuation/g, this._punctuation).getRegex();

        this.autolink = edit(this.autolink)
            .replace('scheme', this._scheme)
            .replace('email', this._email)
            .getRegex();

        this.tag = edit(this._tag)
            .replace('comment', block.normal._comment)
            .replace('attribute', this._attribute)
            .getRegex();

        this.link = edit(this.link)
            .replace('label', this._label)
            .replace('href', this._href)
            .replace('title', this._title)
            .getRegex();
    
        this.reflink = edit(this.reflink)
            .replace('label', this._label)
            .getRegex();
    }
}

/**
 * Pedantic Inline Grammar
 */
export class Pedantic extends Inline {
    public strong = /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/;
    public em = /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;

    constructor() {
        super();

        this.link = edit(/^!?\[(label)\]\((.*?)\)/)
            .replace('label', this._label)
            .getRegex();

        this.reflink = edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
            .replace('label', this._label)
            .getRegex();
    }
}

/**
 * GFM Inline Grammar
 */
export class GFM extends Inline {
    public _extended_email = /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/;
    public url = /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/;
    public _backpedal = /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/;
    public del = /^~+(?=\S)([\s\S]*?\S)~+/;
    public text = /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/;

    constructor() {
        super();

        this.escape = edit(this.escape).replace('])', '~|])').getRegex(),
        
        this.url = edit(this.url, 'i')
            .replace('email', this._extended_email)
            .getRegex();
        
    }
}

/**
 * GFM + Line Breaks Inline Grammar
 */
export class Breaks extends GFM {
    constructor() {
        super();

        this.br = edit(this.br).replace('{2,}', '*').getRegex();

        this.text = edit(this.text)
            .replace('\\b_', '\\b_| {2,}\\n')
            .replace(/\{2,\}/g, '*')
            .getRegex();
    }
}

/**
 * Normal Inline Grammar
 */
export const normal = new Inline();

export const pedantic = new Pedantic();

export const gfm = new GFM();

export const breaks = new Breaks();
