import { Renderer } from "./renderer";

/**
 * TextRenderer
 * returns only the textual part of the token
 */

export class TextRenderer extends Renderer {
  // no need for block level renderers
  public strong(text) {
    return text;
  }

  public em(text) {
    return text;
  }

  public codespan(text) {
    return text;
  }

  public del(text) {
    return text;
  }

  public text(text) {
    return text;
  };

  public link(href, title, text) {
    return '' + text;
  }

  public image(href, title, text) {
    return '' + text;
  }

  public br() {
    return '';
  }
}
