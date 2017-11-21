<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

const STEP_INTRO = 0;
const STEP_CHECK_SOFTWARE = 1;
const STEP_CHECK_PARAMS = 2;
const STEP_CHECK_PERMISSIONS = 3;
const STEP_CHECK_DATA = 4;

//Lists version numbers, etc. to check for. Should be edited when Mlab or a library is updated

$php_version_min = 50400; 
$mysql_version_min = 5.5;
$composer_version_min = "1.0.0";
$symfony_version_min = 2.8;
$symfony_version_max = 3.0;
$uglifyjs_version_min = 2.4;
$nodejs_version_min = "5.12.0";
$system_path = "PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'";

//TODO: Update labels here to say when links to something else, what use for etc.
//TODO: add about trailing slashes
$params_check = array (
    "parameters__database_driver" => array(
        "label"     => "PHP database driver to use <span>This selection depends on what database server you plan to use with Mlab. It can be one of these: pdo_mysql, pdo_sqlite, pdo_pgsql, pdo_oci, oci8, ibm_db2, pdo_ibm, pdo_sqlsrv, mysqli, drizzle_pdo_mysql or sqlsrv.</span>",
        "acceptable" => "pdo_mysql|pdo_sqlite|pdo_pgsql|pdo_oci|oci8|ibm_db2|pdo_ibm|pdo_sqlsrv|mysqli|drizzle_pdo_mysql|sqlsrv",
        "header" => "Database"
        ),
    
    "parameters__database_host" => array(  
        "label"     => "URL/IP address of database server<span>This is the server that will store the Mlab data. If it is on the same server as the Mlab webserver you use localhost here.</span>",
        "acceptable" => "URL",
        "header" => "Database"
        ),
    
    "parameters__database_port" => array(  
        "label"     => "TCP/IP port of the database server<span>This is the server that will store the Mlab data. If you are using sockets (this is the most common setup for MySQL for instance) leave this empty.</span>",
        "acceptable" => "PORT",
        "null" => true,
        "header" => "Database"
        ),
    
    "parameters__database_name" => array(  
        "label"     => "Name of the database to use<span>You need to create this database manually, using the relevant database management tools for your chosen database server.</span>",
        "acceptable" => "^[a-zA-Z][a-zA-Z0-9_]{0,63}$",
        "header" => "Database"
        ),
    
    "parameters__database_user" => array(  
        "label"     => "Name of user for database login<span>You need to create this user using the relevant database management tools for your chosen database server. You must ensure that the user is set up with full access to the database you named in the setting above.</span>",
        "acceptable" => "^[a-zA-Z][a-zA-Z0-9_]{0,63}$",
        "header" => "Database"
        ),
    
    "parameters__database_password" => array(  
        "label"     => "User password for database login<span>The password specified for the user you named in the setting above. By default Mlab requires a password between 8 and 20 characters which should include upper and lower letters and numbers. If you need to use a specific password that does not fit this pattern or you are using on a local PC for development only you can override this requirement.</span>",
        "acceptable" => "PASSWORD",
        "header" => "Database"
        ),
    
    "parameters__mailer_host" => array(  
        "label"     => "URL/IP address of email server for password reset<span>You can set up Mlab to allow users to re-set their login passwords if they forget it. When this feature is enabled, users will receive an email with a link to click to reset their password. If it is on the same server as the Mlab webserver you use localhost here.</span>",
        "acceptable" => "URL",
        "header" => "Email details for user registration and password reset"
        ),
    
    "parameters__mailer_transport" => array(  
        "label"     => "How to send emails<span>Here you specify how the server from the previous step sends verification emails. You can use smtp, mail, sendmail or gmail. If you do not plan to use this feature you can use smtp.</span>",
        "acceptable" => "smtp|mail|sendmail|gmail",
        "header" => "Email details for user registration and password reset"
        ),
    
    "parameters__mailer_user" => array(  
        "label"     => "Name of user for email server login<span>Depending on which method for sending you selected above, you may need to specify a user account that has access to send emails. If no user is required (for instance with SMTP) leave this empty.</span>",
        "acceptable" => "EMAIL",
        "header" => "Email details for user registration and password reset"
        ),
    
    "parameters__mailer_password" => array(  
        "label"     => "Password of user for email server login<span>The password specified for the user you named in the setting above, if required. Leave this empty if no user is required. By default Mlab requires a password between 8 and 20 characters which should include upper and lower letters and numbers. If you need to use a specific password that does not fit this pattern or you are using on a local PC for development only you can override this requirement.</span>",
        "acceptable" => "PASSWORD",
        "null" => true,
        "header" => "Email details for user registration and password reset"
        ),
    
    "parameters__locale" => array(  
        "label"     => "Which locale to use<span>Mlab support the use of different languages in the user interface, for instance en_GB. You can specify the default language to use here, it can be overridden by individual Mlab users when they log in. Currently nb_NO and en_GB is supported, otehr languages can be supported by providing your own translations</span>",
        "acceptable" => "nb_NO|en_GB",
        "header" => "Language & security"
        ),
    
    "parameters__secret" => array(  
        "label"     => "A random string used for security purposes<span>The string specified here is used as a 'salt' to encrypt passwords, etc. on this site. If you leave this empty, Mlab will generate a random string for you. By default Mlab requires a string between 8 and 20 characters which should include upper and lower letters and numbers. If you need to use a specific string that does not fit this pattern or you are using on a local PC for development only you can override this requirement.</span>",
        "acceptable" => "PASSWORD",
        "header" => "Language & security"
        ),
    
    "parameters__mlab__paths__app" => array(
        "label"     => "Full path to where Mlab created apps should be stored<span>For each app that is created in Mlab, Mlab uses a top level directory to store files in. This is the path to the directory where Mlab generates these directories. For instance /var/www/mlab_elements/apps/.</span>",
        "acceptable" => "PATH",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__urls__app" => array(
        "label"     => "Path of URL to where Mlab created apps are found<span>This is the part of the URL used in the web browser that maps to the directory specified in the previous setting. For instance, if you specify /mlab_elements/apps/ here, then this path (appended to the URL of your Mlab installation, for example https://mlab.mydomain.com) should point to /var/www/mlab_elements/apps/.</span>",
        "acceptable" => "^\/[a-zA-Z0-9_]{1,32}\/[a-zA-Z0-9_]{1,32}\/$",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__paths__component" => array(
        "label"     => "Full path to where Mlab components should be installed<span>Mlab uses components to build an app. Each component is stored in a separate directory. This is the path to the directory where Mlab stores these component directories. For instance /var/www/mlab_elements/components/.</span>",
        "acceptable" => "PATH",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__urls__component" => array(
        "label"     => "External URL to where Mlab components should be installed<span>This is the part of the URL used in the web browser that maps to the directory specified in the previous setting. For instance, if you specify /mlab_elements/components/ here, then this path (appended to the URL of your Mlab installation, for example https://mlab.mydomain.com) should point to /var/www/mlab_elements/components/.</span>",
        "acceptable" => "^\/[a-zA-Z0-9_]{1,32}\/[a-zA-Z0-9_]{1,32}\/$",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__paths__template" => array(
        "label"     => "Full path to where Mlab templates should be installed<span>Mlab uses templates to provide the look and feel to different apps. Each template is stored in a separate directory. This is the path to the directory where Mlab stores these template directories. For instance /var/www/mlab_elements/templates/</span>",
        "acceptable" => "PATH",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__urls__template" => array(
        "label"     => "External URL to where Mlab templates should be installed<span>This is the part of the URL used in the web browser that maps to the directory specified in the previous setting. For instance, if you specify /mlab_elements/templates/ here, then this path (appended to the URL of your Mlab installation, for example https://mlab.mydomain.com) should point to /var/www/mlab_elements/templates/.</span>",
        "acceptable" => "^\/[a-zA-Z0-9_]{1,32}\/[a-zA-Z0-9_]{1,32}\/$",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__paths__icon" => array(
        "label"     => "Full path to where images used to generate app icons should be installed<span>Mlab can use a combination of foreground and background PNG files to create icons for different apps. This is the path to the directory where Mlab stores these image files, inside this directory there should be a foreground and background directory with the relevant icons. For instance /var/www/mlab_elements/icons/</span>",
        "acceptable" => "PATH",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__urls__icon" => array(
        "label"     => "External URL to where images used to generate app icons should be installed<span>This is the part of the URL used in the web browser that maps to the directory specified in the previous setting. For instance, if you specify /mlab_elements/icons/ here, then this path (appended to the URL of your Mlab installation, for example https://mlab.mydomain.com) should point to /var/www/mlab_elements/icons/.</span>",
        "acceptable" => "^\/[a-zA-Z0-9_]{1,32}\/[a-zA-Z0-9_]{1,32}\/$",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__urls__icon_font" => array(
        "label"     => "Path of URL of a web font that can be used when creating icons for apps<span>Typically this would be put in the /web/css directory that is created as part of the Mlab source code installation. You can find free, open source, OTF fonts on the Internet, download this and place it in the suggested directory and update this URL with the full path to teh font, including the filename of the font. For instance /css/oswald.otf.</span>",
        "acceptable" => "LOCALPATH",
        "header" => "Paths and URLs to Mlab elements"
        ),
    
    "parameters__mlab__ws_socket__url_client" => array(  
        "label"     => "URL for web socket server used by Mlab editor to communicate with server<span>A small Websockets server is included with Mlab, this is required to talk to other Mlab services such as the app compilation service. Here you specify the URL, including the protocol (ws or wss) and port, that the web browser will use to connect to this websocket server. For example ws://mlab.mydomain.com:8080/</span>",
        "acceptable" => "WS_URL_PORT",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__ws_socket__url_server" => array(
        "label"     => "URL for web socket server used to communicate with compiler and app market services<span>Same as the previous setting, but for the server side connection using http. If you run this websocket server on the same server as Mlab is running you wopuld use something like this: http://localhost:8080/. As you see the ports are the same on this and the previous setting.</span>",
        "acceptable" => "HTTP_URL_PORT",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__supported_platforms" => array(
        "label"     => "List of mobile platforms (for instance Android) that have been installed<span>Mlab is using Cordova to create native apps from the HTML5 code generated in Mlab. The user that is building an app will see a list of mobile platforms they can create the app for, this list uses this setting to determine which platforms are available. Separate multiple options with a comma, for example ios,android.</span>",
        "acceptable" => "ios|android",
        "type" => "array",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__url" => array(
        "label"     => "URL to compilation service<span>The compilation service is a NodeJS app, Mlab needs to know where to find it to control it through an API. You specify the domain name and port here, for instance localhost:8282 or cs.mlab.no:8000.</span>",
        "acceptable" => "URL_PORT",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__protocol" => array(  
        "label"     => "Protocol (http or https) to use to connect to compilation service<span>Here you enter http or https (for secure connections), depending on your setup. If you are running the compiler service on a remote computer we recommend using https.</span>",
        "acceptable" => "http|https",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__passphrase" => array(  
        "label"     => "Unique passphrase to access compilation service<span>The passphrase specified here is use when communicating with the Mlab <a href='info_cs.html'>compiler service</a>. You need to specify a matching passphrase in the configuration of the compiler service, otherwise you cannot compile apps. By default Mlab requires a password between 8 and 20 characters which should include upper and lower letters and numbers. If you need to use a specific password that does not fit this pattern or you are using on a local PC for development only you can override this requirement.</span>",
        "acceptable" => "PASSWORD",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__app_creator_identifier" => array(
        "label"     => "Unique, reverse domain, identifier<span>This is used, together with a unique ID Mlab generates for each app, to identify your apps on different mobile app vendors market places (App Store, Google Play, etc). This is like a URL, but 'back to front', and typically uses your company name + a app 'suffix'. So for apps developed by ffi.no we would use, this would be no.ffi.apps</span>",
        "acceptable" => "URL",
        "header" => "Compiler service"
    ),
    
    "parameters__mlab__compiler_service__rsync_url" => array(
        "label"     => "URL to use to upload files to compiler service<span>The URL should be in the format username@url::cs_inbox. username = the name of the user to log in as, url = the URL to connect to, for instance localhost or my.server.com. cs_inbox = the name of the heading in the rsync config file that has all the settings for receiving uploaded file. See the <a href='info_cs.html#user-content-configure-the-rsync-servicedaemon'>compiler service documentation</a>.</span>",
        "acceptable" => "RSYNC_URL",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__compiler_service__rsync_password" => array(
        "label"     => "Password to use to upload files to compiler service<span>The password specified here must match the password specified in the rsync config file (for instance /etc/rsyncd.conf) on the server running the <a href='info_cs.html#user-content-configure-the-rsync-servicedaemon'>compiler service</a>. By default Mlab requires a password between 8 and 20 characters which should include upper and lower letters and numbers. If you need to use a specific password that does not fit this pattern or you are using on a local PC for development only you can override this requirement.</span>",
        "acceptable" => "PASSWORD",
        "header" => "Compiler service"
        ),
    
    "parameters__mlab__convert__python_bin" => array(  
        "label"     => "Path to Python executable<span>The full path to the Python executable on your system. For instance /usr/bin/python.</span>",
        "acceptable" => "PATH",
        "header" => "Paths to system utilities"
        ),
    
    "parameters__mlab__compiler_service__rsync_bin" => array(
        "label"     => "Path to the Rsync executable file<span>The full path to the rsync executable on your system. For instance /usr/bin/rsync. This is used to upload app source code to the compiler service.</span>",
        "acceptable" => "PATH",
        "header" => "Paths to system utilities"
        ),
    


);


// ARRAY OF PRE-REQUISITE VALUES TO CHECK FOR
$software_version_checks = array(
    "internet_present" =>       array(  "label"     => "Internet connection", 
                                        "action"    => "",
                                        "function"  => "internet_present"),
    
    
    "version_php" =>            array(  "label"     => "PHP version", 
                                        "check"     => $php_version_min, 
                                        "help"      => "PHP version 5.4 or higher is required",
                                        "error"    => "PHP is incorrect version",
                                        "value"     => PHP_VERSION_ID,
                                        "function"  => "check_version"),
    
    "libraries_php" =>          array(  "label"     => "PHP extensions", 
                                        "help"      => "These PHP extensions must be available. Check your PHP installation & php.ini",
                                        "check"     => "curl,dom,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mysqli,openssl,pcre,pdo_mysql,phar,readline,session,simplexml,soap,sockets,xml,xmlreader,xmlwriter,zip", 
                                        "function"  => "libraries_php"), 

    "timezone_php_ini" =>       array(  "label"     => "Timezone", 
                                        "help"      => "The timezone must be set in the relevant PHP.INI file on the server",
                                        "check"     => "date.timezone",
                                        "function"  => "timezone_php_ini"), 
    
    "version_composer" =>       array(  "label"     => "Composer version", 
                                        "help"      => "Composer is a library manager used by Mlab to install the Symfony framework and Javascript libraries. Version 1.3 or higher is required",
                                        "check"     => $composer_version_min, 
                                        "exec"      => "bin/composer.phar -V",
                                        "function"  => "check_version"), 
    
    "version_symfony" =>        array( "label"     => "Symfony framework", 
                                        "help"      => "Mlab requires the Symfony framework to be installed, during the installation a number of PHP and HTML files will be downloaded to the Mlab folder on the server.",
                                        "check"     => $symfony_version_min, 
                                        "exec"      => "app/console --version",
                                        "function"  => "check_version"), 
    
    "libraries_symfony" =>      array(  "label"     => "Symfony libraries", 
                                        "help"      => "These Symfony libraries must be available.",
                                        "function"  => "libraries_symfony"), 

    "version_nodejs" =>         array( "label"     => "Node JS version", 
                                        "help"      => "Node JS is used to run a small web socket server for compiler and app store messaging. Version 0.10.29 or higher is required.",
                                        "check"     => $nodejs_version_min, 
                                        "exec"      => "nodejs --version",
                                        "function"  => "check_version"), 
    
    "version_uglifyjs" =>       array( "label"     => "UglifyJS version", 
                                        "help"      => "UglifyJS is used to compress and protect Javascript file. Version 2.4 or higher is required",
                                        "check"     => $uglifyjs_version_min, 
                                        "exec"      => "uglifyjs --version",
                                        "function"  => "check_version"), 
    
    "libraries_npm" =>          array(  "label"     => "NodeJS libraries", 
                                        "help"      => "These NodeJS libraries must be installed to be able to use Mlab: 'ws'",
                                        "check"     => "ws", 
                                        "function"  => "libraries_npm"), 
    

);

// ARRAY OF VALUES TO CHECK FOR THAT WE CAN HELP THEM WITH
$data_checks = array(
    
    "bootstrap_symfony" =>      array(  "label"     => "Boostrap file", 
                                        "help"      => "The app/bootstrap.php.cache must be created, this is usually done by Composer when the Symfony framework is installed.",
                                        "check"     => "app/bootstrap.php.cache"), 
    
    "libraries_js" =>           array(  "label"     => "Javascript libraries", 
                                        "help"      => "These Javascript libraries must be installed to be able to use Mlab: 'bowser, jquery.contextmenu, jquery, jquery.ddslick, jquery.mobile, jquery-qrcode, jquery.qtip, spin.js, jquery.spin, jquery-ui, jquery.form.js, jquery.uploadfile-4.0.11'",
                                        "check"     => "bowser.js,jquery.form.js,jquery.contextmenu-1.0.0.js,jquery-2.1.4.js,jquery.ddslick-1.0.0.js,jquery.mobile-1.4.5.js,jquery.qrcode-0.12.0.js,jquery.qtip-2.2.0.js,spin.js,jquery.spin.js,jquery.ui-1.11.4.js,jquery.uploadfile-4.0.11.js"), 
    
    "assetic_update" =>         array( "label"     => "Javascript protection", 
                                        "help"      => "The Javascript libraries created by FFI must be protected using UglifyJS as per your contractual obligations. To do this you need to generate a single combined 'asset' JavaScript file from the original code. If you do not do this Mlab will fail to work.",
                                        "check"     => "web/js/*.js"), 
    
    "version_mysql" =>          array(  "label"     => "MySQL version", 
                                        "help"      => "A MySQL database server version 5.5 or higher is required to store Mlab user and app data",
                                        "check"     => $mysql_version_min),
    
    "import_empty_database" =>  array( "label"     => "Initial Mlab data", 
                                        "help"      => "To start using Mlab the basic database must be set up and an admin user must be added. ",
                                        "check"     => 14), 
    
    "import_templates" =>       array(  "label"     => "Import templates", 
                                        "help"      => "To use Mlab you need at least one template. If you have one or more templates available as a ZIP file you can upload this file now." . 
                                                       '<form action="index.php?fix=import_templates" method="post" accept-charset="UTF-8" enctype="multipart/form-data"><input type="file" name="mlab_upload" accept=".zip"><input type="submit"></form>',
                                        "check"     => 1),
    
    "import_components" =>      array(  "label"     => "Import components", 
                                        "help"      => "To use Mlab you need at least one component. If you have one or more components available as a ZIP file you can upload this file now." . 
                                                       '<form action="index.php?fix=import_components" method="post" accept-charset="UTF-8" enctype="multipart/form-data"><input type="file" name="mlab_upload" accept=".zip"><input type="submit"></form>',
                                        "check"     => 1 ),
    
);
