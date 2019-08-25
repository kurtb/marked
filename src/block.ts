/**
 * Block-Level Grammar
 */

import { noop } from "./noop";
import { edit } from "./utils";

export class Block {
    public newline = /^\n+/;
    public code = /^( {4}[^\n]+\n*)+/;
    public fences: RegExp = /^ {0,3}(`{3,}|~{3,})([^`~\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/;
    public hr = /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/;
    public heading = /^ {0,3}(#{1,6}) +([^\n]*?)(?: +#+)? *(?:\n+|$)/;
    public blockquote = /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/;
    public list = /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/;

    public _html = '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
        + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')';
    public html: RegExp;

    public def = /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/;
    public nptable: RegExp = noop as any;
    public table: RegExp = noop as any;
    public lheading = /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/;

    // regex template, placeholders will be replaced according to different paragraph
    // interruption rules of commonmark and the original markdown spec:
    public _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html)[^\n]+)*)/;
    public text = /^[^\n]+/;

    public _label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
    public _title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
    
    public bullet = /(?:[*+-]|\d{1,9}\.)/;
    public item = /^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/;
    
    public _tag = 'address|article|aside|base|basefont|blockquote|body|caption'
        + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
        + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
        + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
        + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
        + '|track|ul';
    public _comment = /<!--(?!-?>)[\s\S]*?-->/;

    public paragraph = edit(this._paragraph)
        .replace('hr', this.hr)
        .replace('heading', ' {0,3}#{1,6} +')
        .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
        .replace('blockquote', ' {0,3}>')
        .replace('fences', ' {0,3}(?:`{3,}|~{3,})[^`\\n]*\\n')
        .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
        .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
        .replace('tag', this._tag) // pars can be interrupted by type (6) html blocks
        .getRegex();
    
    constructor() {
        this.def = edit(this.def)
            .replace('label', this._label)
            .replace('title', this._title)
            .getRegex();

        this.item = edit(this.item, 'gm')
            .replace(/bull/g, this.bullet)
            .getRegex();

        this.list = edit(this.list)
            .replace(/bull/g, this.bullet)
            .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
            .replace('def', '\\n+(?=' + this.def.source + ')')
            .getRegex();

        this.html = edit(this._html, 'i')
            .replace('comment', this._comment)
            .replace('tag', this._tag)
            .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
            .getRegex();
        
        this.blockquote = edit(this.blockquote)
            .replace('paragraph', this.paragraph)
            .getRegex();
    }
}

export class GFM extends Block {
    constructor() {
        super();

        this.nptable = /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/;
        this.table = /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/;
    }
}

export class Pedantic extends Block {
    constructor() {
        super();

        this.html = edit(
            '^ *(?:comment *(?:\\n|\\s*$)'
            + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
            + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
            .replace('comment', this._comment)
            .replace(/tag/g, '(?!(?:'
                + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
                + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
                + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
            .getRegex(),

        this.def = /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/;
        this.heading = /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/;
        this.fences = noop as any;
        this.paragraph = edit(this._paragraph)
            .replace('hr', this.hr)
            .replace('heading', ' *#{1,6} *[^\n]')
            .replace('lheading', this.lheading)
            .replace('blockquote', ' {0,3}>')
            .replace('|fences', '')
            .replace('|list', '')
            .replace('|html', '')
            .getRegex()
    }
}

/**
 * Normal Block Grammar
 */
export const normal = new Block();

/**
 * GFM Block Grammar
 */
export const gfm = new GFM();

/**
 * Pedantic grammar (original John Gruber's loose markdown specification)
 */
export const pedantic = new Pedantic();
