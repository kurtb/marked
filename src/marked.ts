/**
 * Marked
 */

import { escape } from "./escape";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Renderer } from "./renderer";
import { checkSanitizeDeprecation, merge } from "./utils";

export function marked(src, opt, callback) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
        throw new Error('marked(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
        throw new Error('marked(): input parameter is of type '
            + Object.prototype.toString.call(src) + ', string expected');
    }

    if (callback || typeof opt === 'function') {
        if (!callback) {
            callback = opt;
            opt = null;
        }

        opt = merge({}, defaults, opt || {});
        checkSanitizeDeprecation(opt);

        var highlight = opt.highlight,
            tokens,
            pending,
            i = 0;

        try {
            tokens = Lexer.lex(src, opt);
        } catch (e) {
            return callback(e);
        }

        pending = tokens.length;

        var done = function (err?) {
            if (err) {
                opt.highlight = highlight;
                return callback(err);
            }

            var out;

            try {
                out = Parser.parse(tokens, opt);
            } catch (e) {
                err = e;
            }

            opt.highlight = highlight;

            return err
                ? callback(err)
                : callback(null, out);
        };

        if (!highlight || highlight.length < 3) {
            return done();
        }

        delete opt.highlight;

        if (!pending) return done();

        for (; i < tokens.length; i++) {
            (function (token) {
                if (token.type !== 'code') {
                    return --pending || done();
                }
                return highlight(token.text, token.lang, function (err, code) {
                    if (err) return done(err);
                    if (code == null || code === token.text) {
                        return --pending || done();
                    }
                    token.text = code;
                    token.escaped = true;
                    --pending || done();
                });
            })(tokens[i]);
        }

        return;
    }
    try {
        if (opt) opt = merge({}, defaults, opt);
        checkSanitizeDeprecation(opt);
        return Parser.parse(Lexer.lex(src, opt), opt);
    } catch (e) {
        e.message += '\nPlease report this to https://github.com/markedjs/marked.';
        if ((opt || defaults).silent) {
            return '<p>An error occurred:</p><pre>'
                + escape(e.message + '', true)
                + '</pre>';
        }
        throw e;
    }
}

/**
 * Options
 */

export function setOptions(opt) {
    merge(defaults, opt);
    return marked;
}

export function getDefaults() {
    return {
        baseUrl: null,
        breaks: false,
        gfm: true,
        headerIds: true,
        headerPrefix: '',
        highlight: null,
        langPrefix: 'language-',
        mangle: true,
        pedantic: false,
        renderer: new Renderer(),
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        xhtml: false
    };
};

export const defaults = getDefaults();
