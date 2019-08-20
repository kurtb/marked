function escape(html, encode) {
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
}

escape.escapeTest = /[&<>"']/;
escape.escapeReplace = /[&<>"']/g;
escape.replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

escape.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
