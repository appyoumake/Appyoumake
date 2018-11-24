// require jQuery normally
const $ = require('script-loader!../jquery-2.1.4.js');

// if/when use NPM version, need to create global $ and jQuery variables
// global.$ = global.jQuery = $;

require('script-loader!../jquery.mobile-1.4.5.js');
require('script-loader!../jquery.ui-1.11.4.js');
require('script-loader!../jquery.form.js');
require('script-loader!../jquery.uploadfile-4.0.11.js');
require('script-loader!../jquery.qtip.nightly.js');
require('script-loader!../jquery.ddslick-2.0.0.js');
require('script-loader!../jquery.qrcode-0.12.0.js');
require('script-loader!../jquery.contextmenu-1.0.0.js');
require('script-loader!../spin.js');
require('script-loader!../jquery.spin.js');
require('script-loader!../bowser.js');

require('script-loader!../mlab.api.js');
require('script-loader!../mlab.dt.api.js');
require('script-loader!./mlab.dt.management.js');
require('script-loader!../mlab.dt.bestpractice.js');
require('script-loader!./mlab.dt.design.js');
require('script-loader!./mlab.dt.utils.js');
require('script-loader!./mlab_editor.init.js');

require('script-loader!./ui.js');
