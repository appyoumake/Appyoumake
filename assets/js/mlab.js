// require jQuery normally
const $ = require('script-loader!./jquery-2.1.4.js');

// if/when use NPM version, need to create global $ and jQuery variables
// global.$ = global.jQuery = $;

require('script-loader!./jquery.ui-1.11.4.js');
require('script-loader!./jquery.form.js');
require('script-loader!./jquery.uploadfile-4.0.11.js');
// require('script-loader!./jquery.qtip-3.0.3.js');
require('script-loader!./jquery.qtip.nightly.js');
require('script-loader!./bowser.js');