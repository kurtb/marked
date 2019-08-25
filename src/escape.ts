export const escape = Object.assign(
    function(html, encode?) {
        if (encode) {
            if (escape.escapeTest.test(html)) {
                return html.replace(escape.escapeReplace, function (ch) { return escape.replacements[ch]; });
            }
        } else {
            if (escape.escapeTestNoEncode.test(html)) {
                return html.replace(escape.escapeReplaceNoEncode, function (ch) { return escape.replacements[ch]; });
            }
        }
    
        return html;
    },
    {
        escapeTest: /[&<>"']/,
        escapeReplace: /[&<>"']/g,
        replacements: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        },
        escapeTestNoEncode: /[<>"']|&(?!#?\w+;)/,
        escapeReplaceNoEncode: /[<>"']|&(?!#?\w+;)/g,
    }
);
