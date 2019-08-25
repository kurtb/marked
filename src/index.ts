import { Lexer } from "./lexer";
import { getDefaults, marked as markedFn, setOptions } from "./marked";
import { Parser } from "./parser";
import { Renderer } from "./renderer";
import { Slugger } from "./slugger";
import { TextRenderer } from "./textRenderer";
import { InlineLexer } from "./inlineLexer";

/**
 * Expose
 */

const marked = Object.assign(
    markedFn,
    {
        options: setOptions,
        setOptions,
        getDefaults,
        defaults: getDefaults(),
        Parser,
        parser: Parser.parse,
        Renderer,
        TextRenderer,
        Lexer,
        lexer: Lexer.lex,
        InlineLexer,
        inlineLexer: InlineLexer.output,
        Slugger,
        parse: undefined,
    });
marked.parse = marked;

export = marked;
