/*
 * xpush-javascript
 * https://xpush.github.io
 *
 * Copyright (c) 2013 John Kim
 * Licensed under the MIT license.
 */

(function($) {

  // Collection method.
  $.fn.xpush_javascript = function() {
    return this.each(function(i) {
      // Do something awesome to each selected element.
      $(this).html('awesome' + i);
    });
  };

  // Static method.
  $.xpush_javascript = function(options) {
    // Override default options with passed-in options.
    options = $.extend({}, $.xpush_javascript.options, options);
    // Return something awesome.
    return 'awesome' + options.punctuation;
  };

  // Static method default options.
  $.xpush_javascript.options = {
    punctuation: '.'
  };

  // Custom selector.
  $.expr[':'].xpush_javascript = function(elem) {
    // Is this element awesome?
    return $(elem).text().indexOf('awesome') !== -1;
  };

}(jQuery));
