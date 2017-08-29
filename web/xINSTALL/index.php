<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/*
 * This installer script will first check prerequisites, errors here has to be changed by server admin
 *      Has Internet connection
 *      Has correct PHP version
 *      Has correct uglify version
 *      Has correct MySQL version
 *      Has correct NodeJS version
 *      PHP.ini must have allow_url_fopen=On
 *      PHP.ini must have date.timezone set
 *      Relevant PHP extensions must be loaded
 *      Composer is installed (http://stackoverflow.com/questions/17219436/run-composer-with-a-php-script-in-browser) also use autoupdate
 *      creates a salt, goes into security.yml
 *      edit parameters.yml
 *      create database (load SQL or use doctrine???) php bin/console doctrine:database:create
 */


// EDIT SETTINGS IN config.inc FILE

if (!extension_loaded("mysqli")) {
    die("Installation script requires the 'mysqli' PHP extension to be installed. Install, restart server and try again.");
}
        
require_once "config.inc";
require_once "spyc.php";
$www_user = posix_getpwuid(posix_geteuid())['name'];
$fail_permissions = false;
$fail_permissions_post_symfony = false;
$fail_versions = false;
$fail_pre_check_versions = false;

chdir("../../");
if ($_REQUEST['next_step']) {
    $next_step = $_REQUEST['next_step'];
} else {
    $next_step = 1;
}

function rmall($dir) { 
    $files = array_diff(scandir($dir), array('.','..')); 
    foreach ($files as $file) { 
      (is_dir("$dir/$file")) ? rmall("$dir/$file") : unlink("$dir/$file"); 
    } 
    return rmdir($dir); 
}

//--- RUN CODE IN RESPONSE TO GET REQUESTS ---
if ($_REQUEST['completed'] == 'ALL_OK') {
    rmall("web/INSTALL");
    header("Location: http" . (isset($_SERVER['HTTPS']) ? 's' : '') . "://" . "{$_SERVER['HTTP_HOST']}/");
    die("NOW THE FOLDER WOULD BE DELETED...");
}

switch ($_REQUEST['fix']) {
    
    case "import_empty_database":
//get password etc from YAML file
        $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
        $sql = file_get_contents(getcwd() . "/web/INSTALL/mlab.sql");
        $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
        if ($mysqli->connect_errno) {
            $error = "Database not found or user credentials incorrect: " . $mysqli->connect_error;
        }
        if ($result = $mysqli->query($sql)) {
            $result->close();
        }
        $next_step = 4;
        break;
    
    case "import_templates":
        $next_step = 4;
        break;
    
    case "import_components":
        $next_step = 4;
        break;
    
    case "version_composer":
        putenv($system_path);
        $exp_sig = trim(file_get_contents("https://composer.github.io/installer.sig"));
        copy('https://getcomposer.org/installer', 'bin/composer-setup.php');
        $dl_sig = trim(hash_file('SHA384', 'bin/composer-setup.php'));

        if ($exp_sig == $dl_sig) {
            chdir("bin");
            $p = trim(shell_exec("php composer-setup.php"));
            if (!file_exists("composer.phar")) {
                $error = "Unable to install composer";
            } else {
                chmod("bin/composer.phar", 0770);
            }
            chdir("..");
        } 
        $next_step = 4;
        break;

    case "libraries_symfony":
    case "libraries_js":
        putenv($system_path);
        $p = trim(shell_exec("bin/composer.phar install"));
        $next_step = 4;
        break;

    case "assetic_update":
        putenv($system_path);
        $p = trim(shell_exec("app/console --env=prod assetic:dump"));
        $next_step = 4;
        break;

    case "bootstrap_symfony":
        $p = trim(shell_exec("bin/composer run-script post-update-cmd"));
        $next_step = 4;
        break;

//this will merge the incoming parameters with existing app related values
    

    case "save_parameters":
            
//here we loop through the incoming data and create an array that matches the one from the YAML file
            $incoming_params = array();
            foreach ($_POST as $flat_key => $value) {
                $arr = &$incoming_params;
                $keys = explode('__', $flat_key);
                $count = count($keys);
                foreach ($keys as $key) {
                    if (--$count <= 0) {
                        $arr[$key] = (strpos($value, ",") ? implode(",", $value) : $value) ;
                    } else {
                        if (!key_exists($key, $arr)) {
                            $arr[$key] = array();
                        }
                        $arr = &$arr[$key];
                    }
                }
            }
            
//now load the other settings, merge and save
//if the parameters.yml file already exists we read in these values and update them from the incoming data
//otherwise we load the template parameters.yml.dist and add the values here
            if (file_exists('app/config/parameters.yml')) {
                $existing_params = Spyc::YAMLLoad('app/config/parameters.yml');
            } else {
                $existing_params = Spyc::YAMLLoad('app/config/parameters.yml.dist');
            }
            $combined_params = array_replace_recursive($existing_params, $incoming_params);
// generate   "secret" => "A random word or phrase that Symfony uses for CSRF tokens",
            if (!$combined_params["parameters"]["secret"]) {
                $combined_params["parameters"]["secret"] = substr(str_shuffle("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!"), 0, 1).substr(md5(time()),1);
            }
            file_put_contents('app/config/parameters.yml', Spyc::YAMLDump($combined_params));
            $next_step = 3;
        break;

}

// ARRAY OF PRE-REQUISITE VALUES TO CHECK FOR
$pre_checks = array(
    "internet_present" =>       array(  "label"     => "Internet connection", 
                                        "help"      => "Mlab can be run without an Internet connection, but during installation a connection is required",
                                        "action"    => "Check Internet connection on the server"),
    
    "version_php" =>            array(  "label"     => "PHP version", 
                                        "check"     => array("min" => $php_version_min, "max" => $php_version_max), 
                                        "help"      => "PHP version 5.4 or higher is required, version 7 or higher is not supported at the present time",
                                        "action"    => ""),
    
    "url_allowed_php_ini" =>    array(  "label"     => "URL functionality", 
                                        "help"      => "The PHP URL functonality must be enabled in the relevant PHP.INI file on the server",
                                        "check"     => "allow_url_fopen", 
                                        "action"    => "Set  the <a href='http://php.net/manual/en/filesystem.configuration.php'>allow_url_fopen setting</a> to <em>On</em> in the " . php_ini_loaded_file() . " file on the server."),
    
    "timezone_php_ini" =>       array(  "label"     => "Timezone", 
                                        "help"      => "The timezone must be set in the relevant PHP.INI file on the server",
                                        "check"     => "date.timezone",
                                        "action"    => "Update the " . php_ini_loaded_file() . " file with a <a href='http://php.net/manual/en/timezones.php'>valid timezone setting</a>."), 
    
    "libraries_php" =>          array(  "label"     => "PHP extensions", 
                                        "help"      => "These PHP extensions must be available. Check your PHP installation & php.ini",
                                        "check"     => "ereg,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mhash,mysqli,openssl,pcre,pdo_mysql,phar,readline,session,simplexml,soap,sockets,zip,dom", 
                                        "action"    => "Install the missing extensions using either <a href='http://php.net/manual/en/install.pecl.intro.php'>PECL</a> or through your Linux server's package manager."), 
        
    "version_mysql" =>          array(  "label"     => "MySQL version", 
                                        "help"      => "A MySQL database server version 5.5 or higher is required to store Mlab usr and app data",
                                        "check"     => $mysql_version_min, 
                                        "action"    => "Install an appropriate version of Mlab on the server."), 
    
    "version_uglifyjs" =>        array( "label"     => "UglifyJS version", 
                                        "help"      => "UglifyJS is used to compress and protect Javascript file. Version 2.4 or higher is required",
                                        "check"     => $uglifyjs_version_min, 
                                        "action"    => "Install UglifyJS using the following command line as the 'root' user (make sure NPM is installed first): 'npm&nbsp;install&nbsp;uglifyjs&nbsp;-g'."), 
    
    "version_nodejs" =>          array( "label"     => "Node JS version", 
                                        "help"      => "Node JS is used to run a small web socket server for compiler and app store messaging. Version 0.10.29 or higher is required.",
                                        "check"     => $nodejs_version_min, 
                                        "action"    => "Install Node JS using your operating system's standard package management installation, see <a href='https://nodejs.org/en/download/'>here</a> for more information."), 
    
);

// ARRAY OF VALUES TO CHECK FOR THAT WE CAN HELP THEM WITH
$checks = array(
    "version_composer" =>       array(  "label"     => "Composer version", 
                                        "help"      => "Composer is a library manager used by Mlab to install the Symfony framework and Javascript libraries. Version 1.3 or higher is required",
                                        "check"     => $composer_version_min, 
                                        "action"    => "You can <a href='index.php?fix=version_composer'>click here</a> to try to install the correct version of composer, otherwise manually follow <a href='https://getcomposer.org/'>these instructions</a>."), 
    
    "version_symfony" =>         array( "label"     => "Symfony framework", 
                                        "help"      => "Mlab requires the Symfony framework to be installed, during the installation a number of PHP and HTML files will be downloaded to the Mlab folder on the server.",
                                        "check"     => $symfony_version_min, 
                                        "action"    => "You can <a href='index.php?fix=libraries_symfony'>click here</a> to try to install the framework, otherwise manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>."), 
    
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
);

//pick up parameters from dist file, then we clean it up to keep only entries that start with a __
$params = Spyc::YAMLLoad('app/config/parameters.yml.dist');

//if parameters.yml exists, then we read in the values from that one
if (file_exists('app/config/parameters.yml')) {
    $param_values = Spyc::YAMLLoad('app/config/parameters.yml');
} else {
    $param_values = false;
}

$params_help = array (
    "parameters__database_driver" => "The name of the PHP database driver to use",
    "parameters__database_host" => "URL/IP address of the database server to use",
    "parameters__database_port" => "TCP/IP port of the database server, set to null ig using sockets",
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


$d = getcwd();
$write_permissions = array(
    $d . "/app" => (is_writable($d . "/app") ? true : false), 
    $d . "/app/config" => (is_writable($d . "/app/config") ? true : false), 
    $d . "/composer.json" => (is_writable($d . "/composer.json") ? true : false), 
    $d . "/bin" => (is_writable($d . "/bin") ? true : false));


$write_permissions_post_symfony = array(
    $d . "/app/cache" => (is_writable($d . "/app/cache") ? true : false), 
    $d . "/app/logs" => (is_writable($d . "/app/logs") ? true : false));


/*
 * Clean up the parameters so we only keep the ones that is prefixed with ___ (triple underscore)
 * Also need to keep parents up to the top obviously
 * 
mlab: 
    convert:
        ___python_bin: 
        converter_bin: document2HTML.py
        config: config.json
        converter_path: src/Sinett/MLAB/BuilderBundle/FileManagement/conv/

    ws_socket:
        ___url_client: ws://url:8080/
        path_client: /messages/ 
 * Will check if child property is string/number or not, if not it'll recurse until it arrives at final value
 * Also needs to check if the child property is just an array of possible values, in that case we need to stop at current level and store aray as comma delimited string
 */
function clean_parameters($array, $param_values, $prefix = '') {
    $editable_types = array("boolean", "integer", "double", "string");
    $result = array();
    foreach ($array as $key => $value) {
        if ($key != "_") { //special case for list of characters to replace
            $flat_key = $prefix . (empty($prefix) ? '' : '__') . $key;

//pick up the current value from the existing values if it exists
            if ($param_values) {
                $existing_values = $param_values[str_replace("___", "", $key)];
            } else {
                $existing_values = false;
            }

            if (is_array($value)) {
                $test_value = reset($value);
                $first_key = key($value);
                $test = gettype($test_value);

//arrived at the innermost element IF next element is array of strings, if they flat key contains 3 underscores anywhere we want to use it 
//(parameters to save are identified with 3 underscores before the key name in parameter.yml.dist)
//Then the underscores are removed before adding to the flat array
//            print $flat_key."<br>";
                if ($first_key === 0 && in_array($test, $editable_types) && strpos($flat_key, "___") !== false) {
                    $new_key = str_replace("___", "", $flat_key);
                    if ($existing_values) {
                        $result[$new_key] = implode(",", $existing_values);
                    } else {
                        $result[$new_key] = implode(",", $value);
                    }
                } else {
                    $result = array_merge($result, clean_parameters($value, $existing_values, $flat_key));
                }
            } else {

//as above 
                if (strpos($flat_key, "___") !== false) {
                    $new_key = str_replace("___", "", $flat_key);
                    if ($existing_values) {
                        $result[$new_key] = $existing_values;
                    } else {
                        $result[$new_key] = $value;
                    }
                }
            }
        }
    }
    return $result;
}  


//function to set some sensible values if they are missing initially
function init() {
    global $checks, $pre_checks, $params, $param_values, $write_permissions, $system_path, $fail_permissions, $fail_permissions_post_symfony, $fail_versions, $fail_pre_check_versions;
    $cur_dir = getcwd();
    putenv($system_path);

    $info = file("web/INSTALL/info.html", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $params = clean_parameters($params, $param_values);
    
    if (!$params["parameters__mlab__compiler_service__rsync_bin"]) {
        $p = trim(shell_exec("which rsync"));
        $params["parameters__mlab__compiler_service__rsync_bin"] = $p;
    }
    
    if (!$params["parameters__mlab__convert__python_bin"]) {
        $p = trim(shell_exec("which python"));
        $params["parameters__mlab__convert__python_bin"] = $p;
    }
    
    foreach(array("app", "component", "template", "icon") as $element) {
        if (!$params["parameters__mlab__paths__$element"]) {
            $params["parameters__mlab__paths__$element"] = $cur_dir . "/mlab_elements/$element" . "s/";
        }
        $write_permissions[$params["parameters__mlab__paths__$element"]] = (is_writable($params["parameters__mlab__paths__$element"]) ? true : false);
        
        if (!$params["parameters__mlab__urls__$element"]) {
            $params["parameters__mlab__urls__$element"] = str_replace($cur_dir, "", $params["parameters__mlab__paths__$element"]) . "$element" . "s/";
        }
    }

    $fail_permissions = in_array(false, $write_permissions);
    $fail_permissions_post_symfony = in_array(false, $write_permissions_post_symfony);
    
    foreach ($checks as $key => $value) {
        if (function_exists($key)) {
            eval("\$checks['" . $key . "']['result'] = " . $key . "(\$value);");
        } else {
            $checks[$key]['result'] = false;
        }
        if ($checks[$key]['result'] !== true) {
            $fail_versions = true;
        }
        
//loop through the info.html content and assign help text. 
//this is done by looking for comment lines with $key as the content
        $update_help = false;

        foreach ($info as $line) {
            if (!$update_help && $line == "<!--$key-->") {
                $update_help = true;
                $checks[$key]['action'] = '';
            } else if ($update_help) {
                if ($line == "<!--/$key-->") {
                    $update_help = false;
                } else {
                    $checks[$key]['action'] .= $line;
                }
            } 
        }
        
    }
    
//looping through all pre checks and see if they are present of missing
    foreach ($pre_checks as $key => $value) {
        if (function_exists($key)) {
            eval("\$pre_checks['" . $key . "']['result'] = " . $key . "(\$value);");
        } else {
            $pre_checks[$key]['result'] = false;
        }
        if ($pre_checks[$key]['result'] !== true) {
            $fail_pre_check_versions = true;
        }
        
//loop through the info.html content and assign help text. 
//this is done by looking for comment lines with $key as the content
        $update_help = false;

        foreach ($info as $line) {
            if (!$update_help && $line == "<!--$key-->") {
                $update_help = true;
                $pre_checks[$key]['action'] = '';
            } else if ($update_help) {
                if ($line == "<!--/$key-->") {
                    $update_help = false;
                } else {
                    $pre_checks[$key]['action'] .= $line;
                }
            } 
        }
    }
    
}


/***
 * Simple helper function to find the version number in a string by splitting by spaces and looking for float value
 */
function check_version_number($str, $ver) {
    $info = explode(" ", $str);
    foreach ($info as $value) {
        if (floatval(trim($value))) {
            if (version_compare(trim($value), $ver, ">=")) {
                return true;
            } else {
                return "Version " . trim($value) . " installed, requires $ver";
            }
        }
    }
}

function internet_present() {
    $conn = @fsockopen("www.google.com", 80); 
    if ($conn){
        fclose($conn);
        return true;
    }else{
        return "No connection";
    }   
}

function version_php() {
    global $pre_checks;
    if (PHP_VERSION_ID >= $pre_checks["version_php"]["check"]["min"] && PHP_VERSION_ID <= $pre_checks["version_php"]["check"]["max"]) {
        return true;
    } else {
        return "PHP is incorrect version";
    }
}

function url_allowed_php_ini() {
    global $pre_checks;
    $setting = ini_get($pre_checks["url_allowed_php_ini"]["check"]);
    if (gettype($setting) == "string") {
        $setting = strtolower($setting);
    }
    if (in_array($setting, array("true", "yes", 1, "on"))) {
        return true;
    } else {
        return $pre_checks["url_allowed_php_ini"]["check"] . " set to " . $setting;
    }
}

function timezone_php_ini() {
    global $pre_checks;
    $setting = ini_get($pre_checks["timezone_php_ini"]["check"]);
    if (trim($setting)) {
        return true;
    } else {
        return $pre_checks["timezone_php_ini"]["check"] . " set to " . $setting;
    }
}

function libraries_php() {
    global $pre_checks;
    $libs = explode(",", $pre_checks["libraries_php"]["check"]);
    foreach ($libs as $lib) {
        if (!extension_loaded($lib)) {
            return "PHP extension $lib not present";
        }
    }
    return true;
}

function version_mysql() {
    global $pre_checks;
    $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
    if ($mysqli->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    
    $info = $mysqli->server_info;
    //$info = str_replace("version", "", $info);
    return check_version_number($info, $pre_checks["version_mysql"]["check"]);
}

// check version, if not found or wrong version, download correct version
// see https://github.com/composer/packagist/issues/393 re home dir
function version_composer() {
    global $checks, $system_path;
    putenv("COMPOSER_HOME=" . getcwd() . "/mlab.local.dev/bin/.composer");
    putenv($system_path);
    
    if (!file_exists("bin/composer.phar")) {
        return "Composer is not installed, try to install";
        
    } else {
//now check version
        if (!is_executable("bin/composer.phar")) {
            chmod("bin/composer.phar", 0770);
        }
        $ret = shell_exec("bin/composer.phar -V");
        $info = explode(" ", $ret);
        foreach ($info as $value) {
            if (floatval($value)) {
                list($ver) = explode("-", $value);
                if (version_compare($ver, $checks["version_composer"]["check"], ">=")) {
                    return true;
                } else {
                    return "Version $ver installed, requires " . $checks["version_composer"]["check"];
                }
            }
        }    
    }
}

function version_symfony() {
    global $checks;
    $info = shell_exec("app/console --version");
    $version_ok = check_version_number($info, $checks["version_symfony"]["check"]);
    $file_ok = file_exists("vendor/sensio/distribution-bundle/Sensio/Bundle/DistributionBundle/SensioDistributionBundle.php");
    
    if ($version_ok === true && $file_ok === true) {
        return true;
    } else if ($version_ok !== true) {
        return $version_ok;
    } else {
        return "Library file 'vendor/sensio/distribution-bundle/Sensio/Bundle/DistributionBundle/SensioDistributionBundle.php' not found";
    }
}

function bootstrap_symfony() {
    global $checks;
    if (file_exists($checks["bootstrap_symfony"]["check"])) {
        return true;
    } else {
        return "File " . $checks["bootstrap_symfony"]["check"] . " not found";
    }
}

function assetic_update() {
    global $checks;
    $files = glob($checks["assetic_update"]["check"]);
    if (sizeof($files) > 0) {
        foreach($files as $file) {
            if (preg_match('/[0-9]{7,}/', basename($file))) {
                return true;
            }
        }
    }
    return "Assetic file not found in " . $checks["assetic_update"]["check"];
}

function libraries_js() {
    global $checks;
    $libs = explode(",", $checks["libraries_js"]["check"]);
    foreach ($libs as $lib) {
        if (!file_exists("web/js/$lib")) {
            return "Library web/js/$lib not found";
        }
    }
    return true;
}

function version_uglifyjs() {
    global $pre_checks;
    $info = shell_exec("uglifyjs --version");
    return check_version_number($info, $pre_checks["version_uglifyjs"]["check"]);
}

function version_nodejs() {
    global $pre_checks;
    $info = str_replace("v", "", shell_exec("nodejs --version"));
    return check_version_number($info, $pre_checks["version_nodejs"]["check"]);
}


//checking to see if the database exists and if the relevant tables have been created
function import_empty_database() {
    global $checks;
//get password etc from YAML file
    $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
    if ($mysqli->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    $sql = "SELECT count(*) AS num_tables FROM information_schema.TABLES WHERE (TABLE_SCHEMA = '$existing_params[database_name]')";
    if ($result = $mysqli->query($sql)) {
        $info = $result->fetch_array(MYSQLI_ASSOC);
        $result->close();
        if ($info["num_tables"] >= $checks["import_empty_database"]["check"]) {
            return true;
        } else {
            return "Incorrect number of tables, please verify by comparing database '$mysql_database' with the content of 'web/INSTALL/mlab.sql'.";
        }
    } else {
        return "Database not found or user credentials incorrect";
    }
}

//call the init function to fill variables
init();

?><!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" type="text/css" href="basic.css">
        <style>
            div, table { width: 650px; margin:0 auto; border: none; background-color: white;}
            div {background: transparent; box-shadow: 10px 10px 5px #888888;}
            th, td { border: 1px solid lightgray; border-collapse: collapse; padding: 5px; vertical-align: top; }
            table td:nth-child(2), table td:nth-child(4) { width: 40px; text-align: center; }
            table td:nth-child(4) { width: 250px; }
            input[type=text] { width: 230px; padding: 3px; }
            button { float: right; }
            table .wrap { width: auto; }
            tr.infobar {background-color: #CAED9E; }
            button { background-color: green; color: white; font-size: 110%; }
            button.error { background-color: red; }
        </style>
        
        <script>
            var permissions_ok = true;
            function move(direction) {
                var curTable = document.querySelectorAll("[data-current='1']")[0];
                var curId = curTable.getAttribute("id");
                var input_element = null;
                <?php
                    $inputs = array_diff(array_keys($params), $optional_params);
                    //exclude certain parameters
                    echo "var check_inputs = new Array('" . implode("','", $inputs) . "');";
                ?>
                        
//check that all paramaters are filled in, otehrwise do NOT go to next tab
//if all filled in and some are changed, then save it. Otherwise just display next table
                if (curId == 2 && direction == 1) {
                    var dirty = false;
                    for (i in check_inputs) {
                        input_element = document.getElementById(check_inputs[i]);
                        if (input_element.value.trim() == "") {
                            alert("One or more of the parameters have not been filled in. All required entries highlighted with a red asterisk must be filled in before the parameters can be saved.");
                            return;
                        }
                        if (input_element.value != input_element.getAttribute("data-original-value")) {
//something has changed, submit form and bail
                            dirty = true;
                        }
                    }
                    if (dirty) {
                        document.getElementById("parameters").submit();
                        return;
                    }
                } 
                            
                if (direction == 1) {
                    var showTable = curTable.nextElementSibling;
                } else {
                    var showTable = curTable.previousElementSibling;
                }
                if (showTable) {
                    curTable.style.display = "none";
                    curTable.setAttribute('data-current', '0');
                    showTable.style.display = "block";
                    showTable.setAttribute('data-current', '1');
                }
            }
        </script>
        <meta charset="UTF-8" />
        <title>Mlab installation</title>
    </head>
    <body>
        <div>
            <h1>Mlab installation</h1>
            <p>This installation page will help you through the steps required to configure your Mlab installation. For some of these steps you have to access the server as root/administrator, others you can do directly from this page.</p>
            <p><a href="info.html" target="_new">Click here for complete setup instructions.</a></p>
            <form action='index.php?fix=save_parameters' method="post" accept-charset="UTF-8" id="parameters">
                
<!-- First we show instructions for how to install web server, database server, etc -->
                <table id="1" <?php if ($next_step == 1 ) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr class="infobar"><td colspan="2"><h3>Step 1: Web, database and PHP server setup</h3></td></tr>
                        <?php if ($fail_pre_check_versions) { ?>
                            <tr class="infobar"><td colspan="2"><p>Mlab requires various servers, helper programs and libraries to be present to work correctly. Please correct the errors below before completing the Mlab installation</p></td></tr>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=1';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><p>Mlab requires various servers, helper programs and libraries to be present to work correctly. They all seem to be correctly installed on this server!</p></td></tr>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1)">Continue</button></td></tr>
                        <?php } ?>
                        <tr><td><em>Item</em></td><td><em>Status</em></td></tr>
                    </thead>
                    <tbody>
                        <?php 
                            foreach ($pre_checks as $key => $value) {
                                if ($value["result"] === true) {
                                    echo "<tr><td>$value[label]</td><td><img src='ok.png'></td></tr>\n";
                                } else {
                                    echo "<tr><td><details><summary>$value[label]</summary><p>Error: $value[result]<hr>$value[action]</p></details></td><td><img src='fail.png'></td></tr>\n";
                                }
                            }
                        ?>
                        <?php if ($fail_pre_check_versions) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=1';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1)">Continue</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>

<!-- Second we get the parameters such as paths etc that we can update, if they are not specified we do not know what folders to check for permissions -->
                <table id="2" <?php if ($next_step == 2) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr><td colspan="3"><h3>Step 2: Mlab configuration settings</h3></td></tr>
                        <?php if (!is_writable("app/config/") || (file_exists("app/config/parameters.yml") && !is_writable("app/config/parameters.yml"))) { ?>
                                <tr class="infobar"><td colspan="3">The <?php echo $www_user; ?> user does not have access to write in the 'app/config' folder OR the 'app/config/parameters.yml' file. Update the owner and write permissions and click 'Retry' before continuing.</td></tr>
                                <tr class="infobar"><td colspan="3"><button type="button" onclick="window.location.href = 'index.php?next_step=2';" class="error">Retry</button></td></tr>
                            </thead>
                        <?php } else { ?>
                                <tr class="infobar"><td colspan="3"><p>Mlab uses various settings to let it know where to store files, how to connect to databases etc. Please fill in and verify all the required entries below and save them before going to next step.</p></td></tr>
                                <tr class="infobar"><td colspan="3"><button type="button" onclick="move(1)">Save settings and continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                                <tr><td><em>Setting</em></td><td><em>Current value</em></td><td>&nbsp;</td></tr>
                            </thead>
                            <tbody>
                                <?php 
                                    foreach ($params as $key => $value) {
                                        echo "<tr>" . 
                                                 "<td>" . htmlentities($params_help[$key]) . (in_array($key, $inputs) ? " <span style='color: red; '>&nbsp;*</span>" : "") . "</td>" .
                                                 "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value'></td>" .
                                                 "<td title='$key'><img src='question.png'></td>" .
                                             "</tr>\n";
                                    }
                                ?>
                                <tr class="infobar"><td colspan="3"><button type="button" onclick="move(1)">Save settings and continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                            </tbody>
                        <?php } ?>
                </table>


<!-- Then the permissions required for folders that are NOT created by symfony, we have checked for access in the init() function -->
                <table id="3" <?php if ($next_step == 3) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr class="infobar"><td colspan="2"><h3>Step 3: File and directory permissions</h3></td></tr>
                        <tr class="infobar"><td colspan="2"><p>For Mlab to work correctly, and for this installation page to be able to update settings, you must create the directories indicated below and assign the user '<?php echo $www_user; ?>' as the owner of the files and directories listed here; and the owner must then have write access to these directories and files. Check the status of the access below and continue when all entries have write access.</p></td></tr>
                        <?php if ($fail_permissions) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=3';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1);">Continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                        <tr><td>File/Directory</td><td>Writable?</td></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($write_permissions as $dir => $write_ok) {
                            echo "<tr><td>$dir</td><td><img src='" . (!$write_ok ? "fail" : "ok") . ".png'></td></tr>\n";
                        } ?>
                        <?php if ($fail_permissions) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=3';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1);">Continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>

<!-- Then the libs and server versions checks -->
                <table id="4" <?php if ($next_step == 4) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr class="infobar"><td colspan="2"><h3>Step 4: Versions and libraries</h3></td></tr>
                        <?php if ($fail_versions) { ?>
                            <tr class="infobar"><td colspan="2"><p>Mlab requires various servers, helper programs and libraries to be present to work correctly. Please correct the errors below before completing the Mlab installation</p></td></tr>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=4';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><p>Mlab requires various servers, helper programs and libraries to be present to work correctly. They all seem to be correctly installed on this server!</p></td></tr>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1);">Continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                        <tr><td><em>Item</em></td><td><em>Status</em></td></tr>
                    </thead>
                    <tbody>
                        <?php 
                            foreach ($checks as $key => $value) {
                                if ($value["result"] === true) {
                                    echo "<tr><td>$value[label]</td><td><img src='ok.png'></td></tr>\n";
                                } else {
                                    echo "<tr><td><details><summary>$value[label]</summary><p>Error: $value[result]<hr>$value[action]</p></details></td><td><img src='fail.png'></td></tr>\n";
                                }
                            }
                        ?>
                        <?php if ($fail_versions) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=4';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="move(1);">Continue</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>

<!-- Then the permissions required for folders that are NOT created by symfony, we have checked for access in the init() function -->
                <table id="5" <?php if ($next_step == 5) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr class="infobar"><td colspan="2"><h3>Step 5: Symfony file and directory permissions</h3></td></tr>
                        <tr class="infobar"><td colspan="2"><p>For Mlab to work correctly, and for this installation page to be able to update settings, you must create the directories indicated below and assign the user '<?php echo $www_user; ?>' as the owner of the files and directories listed here; and the owner must then have write access to these directories and files. Check the status of the access below and continue when all entries have write access.</p></td></tr>
                        <?php if ($fail_permissions_post_symfony) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=5';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?completed=ALL_OK';">Complete installation by removing the installation files</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                        <tr><td>File/Directory</td><td>Writable?</td></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($write_permissions_post_symfony as $dir => $write_ok) {
                            echo "<tr><td>$dir</td><td><img src='" . (!$write_ok ? "fail" : "ok") . ".png'></td></tr>\n";
                        } ?>
                        <?php if ($fail_permissions_post_symfony) { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?next_step=5';" class="error">Retry</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="2"><button type="button" onclick="window.location.href = 'index.php?completed=ALL_OK';">Complete installation by removing the installation files</button><button type="button" onclick="move(-1)">Go back</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>
            </form>
        </div>
    </body>
</html>
