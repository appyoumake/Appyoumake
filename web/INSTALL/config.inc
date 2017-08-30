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
const STEP_CHECK_PERMISSIONS = 2;
const STEP_CHECK_PARAMS = 3;
const STEP_CHECK_DATA = 4;

//Lists version numbers, etc. to check for. Should be edited when Mlab or a library is updated

$php_version_min = 50400; 
$mysql_version_min = 5.5;
$composer_version_min = "1.2.4";
$symfony_version_min = 2.8;
$symfony_version_max = 3.0;
$uglifyjs_version_min = 2.4;
$nodejs_version_min = "6.0.0";
$system_path = "PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'";

$params_help = array (
    "parameters__database_driver" => "The name of the PHP database driver to use",
    "parameters__database_host" => "URL/IP address of the database server to use",
    "parameters__database_port" => "TCP/IP port of the database server, set to null if using sockets",
    "parameters__database_name" => "Name of the database (not server) to use on the database server, create this before adding it",
    "parameters__database_user" => "Name of user for database login",
    "parameters__database_password" => "Password of user for database login",
    "parameters__mailer_transport" => "How to send emails (smtp, mail, sendmail, or gmail)",
    "parameters__mailer_host" => "URL/IP address of the email server to use",
    "parameters__mailer_user" => "Name of user for email server login",
    "parameters__mailer_password" => "Password of user for email server login",
    "parameters__locale" => "Which locale to use, for instance en_UK. Can be overridden by individual Mlab users when they log in",
    "parameters__mlab__convert__python_bin" => "Path to Python executable",
    "parameters__mlab__ws_socket__url_client" => "URL for web socket server used by Mlab editor to communicate with server",
    "parameters__mlab__ws_socket__url_server" => "URL for web socket server used to communicate with compiler and app market services",
    "parameters__mlab__uploads_allowed__img" => "List of mime types allowed for image uploads",
    "parameters__mlab__uploads_allowed__video" => "List of mime types allowed for video uploads",
    "parameters__mlab__uploads_allowed__audio" => "List of mime types allowed for audio uploads",
    "parameters__mlab__paths__app" => "Full path to where Mlab created apps should be stored",
    "parameters__mlab__paths__component" => "Full path to where Mlab components should be installed",
    "parameters__mlab__paths__template" => "Full path to where Mlab templates should be installed",
    "parameters__mlab__paths__icon" => "Full path to where images used to generate app icons should be installed",
    "parameters__mlab__urls__app" => "External URL to where Mlab created apps should be stored",
    "parameters__mlab__urls__component" => "External URL to where Mlab components should be installed",
    "parameters__mlab__urls__template" => "External URL to where Mlab templates should be installed",
    "parameters__mlab__urls__icon" => "External URL to where images used to generate app icons should be installed",
    "parameters__mlab__compiler_service__supported_platforms" => "List of mobile platforms (for instance Android) supported by Cordova for this installation of Mlab",
    "parameters__mlab__compiler_service__url" => "URL to compilation service",
    "parameters__mlab__compiler_service__protocol" => "Protocol (http/https) to use to connect to compilation service",
    "parameters__mlab__compiler_service__passphrase" => "Unique passphrase to access compilation service",
    "parameters__mlab__compiler_service__app_creator_identifier" => "Unique, reverse domain, identifier, for instance 'com.test.app'",
    "parameters__mlab__compiler_service__target_version__ios" => "Which base/minimum version to compile apps for iOS for",
    "parameters__mlab__compiler_service__target_version__android" => "Which base/minimum version to compile apps for Android for",
    "parameters__mlab__compiler_service__rsync_bin" => "Path to the Rsync executable file",
    "parameters__mlab__compiler_service__rsync_url" => "URL to use to upload files to compiler service",
    "parameters__mlab__compiler_service__rsync_password" => "Password to use to upload files to compiler service",
);


// ARRAY OF PRE-REQUISITE VALUES TO CHECK FOR
$software_version_checks = array(
    "internet_present" =>       array(  "label"     => "Internet connection", 
                                        "help"      => "Mlab can be run without an Internet connection, but during installation a connection is required",
                                        "action"    => "Check Internet connection on the server"),
    
    
    "version_php" =>            array(  "label"     => "PHP version", 
                                        "check"     => array("min" => $php_version_min), 
                                        "help"      => "PHP version 5.4 or higher is required",
                                        "error"    => "PHP is incorrect version",
                                        "value"     => PHP_VERSION_ID),
    
    "version_uglifyjs" =>        array( "label"     => "UglifyJS version", 
                                        "help"      => "UglifyJS is used to compress and protect Javascript file. Version 2.4 or higher is required",
                                        "check"     => $uglifyjs_version_min, 
                                        "action"    => "Install UglifyJS using the following command line as the 'root' user (make sure NPM is installed first): 'npm&nbsp;install&nbsp;uglifyjs&nbsp;-g'.",
                                        "exec"      => "uglifyjs --version"), 
    
    "version_nodejs" =>          array( "label"     => "Node JS version", 
                                        "help"      => "Node JS is used to run a small web socket server for compiler and app store messaging. Version 0.10.29 or higher is required.",
                                        "check"     => $nodejs_version_min, 
                                        "action"    => "Install Node JS using your operating system's standard package management installation, see <a href='https://nodejs.org/en/download/'>here</a> for more information.",
                                        "exec"      => "nodejs --version"), 
    
    "version_composer" =>       array(  "label"     => "Composer version", 
                                        "help"      => "Composer is a library manager used by Mlab to install the Symfony framework and Javascript libraries. Version 1.3 or higher is required",
                                        "check"     => $composer_version_min, 
                                        "action"    => "You can <a href='index.php?fix=version_composer'>click here</a> to try to install the correct version of composer, otherwise manually follow <a href='https://getcomposer.org/'>these instructions</a>.",
                                        "exec"      => "composer -V"), 
    
    "version_symfony" =>         array( "label"     => "Symfony framework", 
                                        "help"      => "Mlab requires the Symfony framework to be installed, during the installation a number of PHP and HTML files will be downloaded to the Mlab folder on the server.",
                                        "check"     => $symfony_version_min, 
                                        "action"    => "Manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>.",
                                        "exec"      => "app/console --version"), 
    
    "timezone_php_ini" =>       array(  "label"     => "Timezone", 
                                        "help"      => "The timezone must be set in the relevant PHP.INI file on the server",
                                        "check"     => "date.timezone",
                                        "action"    => "Update the " . php_ini_loaded_file() . " file with a <a href='http://php.net/manual/en/timezones.php'>valid timezone setting</a>."), 
    
    "libraries_php" =>          array(  "label"     => "PHP extensions", 
                                        "help"      => "These PHP extensions must be available. Check your PHP installation & php.ini",
                                        "check"     => "ereg,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mhash,mysqli,openssl,pcre,pdo_mysql,phar,readline,session,simplexml,soap,sockets,zip,dom", 
                                        "action"    => "Install the missing extensions using either <a href='http://php.net/manual/en/install.pecl.intro.php'>PECL</a> or through your Linux server's package manager."), 
        
);

// ARRAY OF VALUES TO CHECK FOR THAT WE CAN HELP THEM WITH
$data_checks = array(
    
    "bootstrap_symfony" =>       array( "label"     => "Boostrap file", 
                                        "help"      => "The app/bootstrap.php.cache must be created, this is usually done by Composer when the Symfony framework is installed.",
                                        "check"     => "app/bootstrap.php.cache", 
                                        "action"    => "You can <a href='index.php?fix=bootstrap_symfony'>click here</a> to try to generate this file, otherwise manually follow <a href='http://stackoverflow.com/questions/6072081/symfony2-updating-bootstrap-php-cache'>these instructions</a>."), 
    
    "libraries_js" =>            array( "label"     => "Javascript libraries", 
                                        "help"      => "These Javascript and libraries must be installed to be able to use Mlab: 'bowser, jquery.contextmenu, jquery, jquery.ddslick, jquery.mobile, jquery-qrcode, jquery.qtip, spin.js, jquery.spin, jquery-ui, jquery.uploadfile-1.9.0'",
                                        "check"     => "bowser.js,jquery.contextmenu-1.0.0.js,jquery-2.1.4.js,jquery.ddslick-1.0.0.js,jquery.mobile-1.4.5.js,jquery.qrcode-0.12.0.js,jquery.qtip-2.2.0.js,spin.js,jquery.spin.js,jquery.ui-1.11.4.js,jquery.uploadfile-1.9.0.js", 
                                        "action"    => "You can <a href='index.php?fix=libraries_js'>click here</a> to try to install these libraries, otherwise manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>."), 
    
    "assetic_update" =>            array( "label"     => "Javascript protection", 
                                        "help"      => "The Javascript libraries created by FFI must be protected using UglifyJS as per your contractual obligations. To do this you need to generate a single combined 'asset' JavaScript file from the original code. If you do not do this Mlab will fail to work.",
                                        "check"     => "web/js/*.js", 
                                        "action"    => "You can <a href='index.php?fix=assetic_update'>click here</a> to run the Symfony assetic command which protects the source code, otherwise you can follow the manual instructions."), 
    
    "import_empty_database" =>   array( "label"     => "Initial Mlab data", 
                                        "help"      => "To start using Mlab the basic database must be set up and an admin user must be added. ",
                                        "check"     => 14, 
                                        "action"    => "You can click <a href='index.php?fix=import_empty_database'>here</a> to do this, or you can manually import the 'INSTALL/mlab.sql' file into the designated database."), 
    
    "version_mysql" =>          array(  "label"     => "MySQL version", 
                                        "help"      => "A MySQL database server version 5.5 or higher is required to store Mlab usr and app data",
                                        "check"     => $mysql_version_min, 
                                        "action"    => "Install an appropriate version of Mlab on the server."), 
    
);
