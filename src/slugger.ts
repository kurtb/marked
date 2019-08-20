/**
 * Slugger generates header id
 */

function Slugger() {
    this.seen = {};
}

/**
 * Convert string to unique id
 */

Slugger.prototype.slug = function (value) {
    var slug = value
        .toLowerCase()
        .trim()
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
        .replace(/\s/g, '-');

    if (this.seen.hasOwnProperty(slug)) {
        var originalSlug = slug;
        do {
            this.seen[originalSlug]++;
            slug = originalSlug + '-' + this.seen[originalSlug];
        } while (this.seen.hasOwnProperty(slug));
    }
    this.seen[slug] = 0;

    return slug;
};
