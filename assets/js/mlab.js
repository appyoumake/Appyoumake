// require jQuery normally
const $ = require('jquery');

// create global $ and jQuery variables
global.$ = global.jQuery = $;

require('jquery-ui');
require('script-loader!./jquery.form.js');
require('script-loader!./jquery.uploadfile-4.0.11.js');
// require('script-loader!./jquery.qtip-3.0.3.js');
require('script-loader!./jquery.qtip.nightly.js');
require('script-loader!./bowser.js');