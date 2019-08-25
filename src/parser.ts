/**
 * Parsing & Compiling
 */

import * as marked from "./marked";
import { Renderer } from "./renderer";
import { InlineLexer } from "./inlineLexer";
import { Slugger } from "./slugger";
import { TextRenderer } from "./textRenderer";
import { merge } from "./utils";

export class Parser {
    /**
     * Static Parse Method
     */

    public static parse(src, options) {
        var parser = new Parser(options);
        return parser.parse(src);
    };

    public tokens = [];
    public token = null;
    public options;
    public renderer;
    public slugger = new Slugger();
    public inline: InlineLexer;
    public inlineText: InlineLexer;

    constructor(options?) {
        this.options = options || marked.defaults;
        this.options.renderer = this.options.renderer || new Renderer();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
    }

    /**
     * Parse Loop
     */
    public parse(src) {
        this.inline = new InlineLexer(src.links, this.options);
        // use an InlineLexer with a TextRenderer to extract pure text
        this.inlineText = new InlineLexer(
            src.links,
            merge({}, this.options, { renderer: new TextRenderer() })
        );
        this.tokens = src.reverse();

        var out = '';
        while (this.next()) {
            out += this.tok();
        }

        return out;
    };

    /**
     * Next Token
     */

    public next() {
        this.token = this.tokens.pop();
        return this.token;
    };

    /**
     * Preview Next Token
     */

    public peek() {
        return this.tokens[this.tokens.length - 1] || 0;
    };

    /**
     * Parse Text Tokens
     */

    public parseText() {
        var body = this.token.text;

        while (this.peek().type === 'text') {
            body += '\n' + this.next().text;
        }

        return this.inline.output(body);
    };

    /**
     * Parse Current Token
     */

    public tok() {
        switch (this.token.type) {
            case 'space': {
                return '';
            }
            case 'hr': {
                return this.renderer.hr();
            }
            case 'heading': {
                return this.renderer.heading(
                    this.inline.output(this.token.text),
                    this.token.depth,
                    unescape(this.inlineText.output(this.token.text)),
                    this.slugger);
            }
            case 'code': {
                return this.renderer.code(this.token.text,
                    this.token.lang,
                    this.token.escaped);
            }
            case 'table': {
                var header = '',
                    body = '',
                    i,
                    row,
                    cell,
                    j;

                // header
                cell = '';
                for (i = 0; i < this.token.header.length; i++) {
                    cell += this.renderer.tablecell(
                        this.inline.output(this.token.header[i]),
                        { header: true, align: this.token.align[i] }
                    );
                }
                header += this.renderer.tablerow(cell);

                for (i = 0; i < this.token.cells.length; i++) {
                    row = this.token.cells[i];

                    cell = '';
                    for (j = 0; j < row.length; j++) {
                        cell += this.renderer.tablecell(
                            this.inline.output(row[j]),
                            { header: false, align: this.token.align[j] }
                        );
                    }

                    body += this.renderer.tablerow(cell);
                }
                return this.renderer.table(header, body);
            }
            case 'blockquote_start': {
                body = '';

                while (this.next().type !== 'blockquote_end') {
                    body += this.tok();
                }

                return this.renderer.blockquote(body);
            }
            case 'list_start': {
                body = '';
                var ordered = this.token.ordered,
                    start = this.token.start;

                while (this.next().type !== 'list_end') {
                    body += this.tok();
                }

                return this.renderer.list(body, ordered, start);
            }
            case 'list_item_start': {
                body = '';
                var loose = this.token.loose;
                var checked = this.token.checked;
                var task = this.token.task;

                if (this.token.task) {
                    if (loose) {
                        if (this.peek().type === 'text') {
                            var nextToken = this.peek();
                            nextToken.text = this.renderer.checkbox(checked) + ' ' + nextToken.text;
                        } else {
                            this.tokens.push({
                                type: 'text',
                                text: this.renderer.checkbox(checked)
                            });
                        }
                    } else {
                        body += this.renderer.checkbox(checked);
                    }
                }

                while (this.next().type !== 'list_item_end') {
                    body += !loose && this.token.type === 'text'
                        ? this.parseText()
                        : this.tok();
                }
                return this.renderer.listitem(body, task, checked);
            }
            case 'html': {
                // TODO parse inline content if parameter markdown=1
                return this.renderer.html(this.token.text);
            }
            case 'paragraph': {
                return this.renderer.paragraph(this.inline.output(this.token.text));
            }
            case 'text': {
                return this.renderer.paragraph(this.parseText());
            }
            default: {
                var errMsg = 'Token with "' + this.token.type + '" type was not found.';
                if (this.options.silent) {
                    console.log(errMsg);
                } else {
                    throw new Error(errMsg);
                }
            }
        }
    };
}
