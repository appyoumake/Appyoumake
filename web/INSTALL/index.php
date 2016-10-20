<?php
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
 *      ask for a salt, goes into security.yml
 *      edit parameters.yml
 *      create database (load SQL or use doctrine???) php bin/console doctrine:database:create
 */


//Edit variables here

$php_version_min = 5.4;
$php_version_max = 6.9;

//--------DO NOT EDIT BELOW THIS LINE----------------

require_once "spyc.php";
chdir("../../");


//--- RUN CODE IN RESPONSE TO GET REQUESTS ---

switch ($_REQUEST['fix']) {
    case "version_composer":
        break;

    case "libraries_symfony":
        break;

    case "bootstrap_symfony":
        break;

    case "libraries_js":
        break;

//this will merge the incoming parameters with existing app related values
    
// generate   "secret" => "A random word or phrase that Symfony uses for CSRF tokens",

    case "save_parameters":
        if (array_key_exists("submit_ok", $_POST) && $_POST["submit_ok"] == "Save") {
            unset($_POST["submit_ok"]);
            $incoming_params = array("parameters" => array());
            foreach ($_POST as $flat_key => $value) {
                $arr = &$incoming_params["parameters"];
                $keys = explode('__', $flat_key);
                $count = count($keys);
                foreach ($keys as $key) {
                    if (--$count <= 0) {
                        $arr[$key] = $value;
                    } else {
                        if (!key_exists($key, $arr)) {
                            $arr[$key] = array();
                        }
                        $arr = &$arr[$key];
                    }
                }
            }
            
//now load the other settings, merge and save
            file_put_contents('app/config/testparameters.yml', Spyc::YAMLDump($incoming_params));
            
        }
        break;

}

// ARRAY OF PRE-REQUISITE VALUES TO CHECK FOR
$checks = array(
    "internet_present" =>       array(  "label"     => "Internet connection", 
                                        "help"      => "Mlab can be run without an Internet connection, but during installation a connection is required",
                                        "action"    => "Check Internet connection on the server"),
    
    "version_php" =>            array(  "label"     => "PHP version", 
                                        "check"     => array("min" => 50400, "max" => 60000), 
                                        "help"      => "PHP version 5.4 or higher is required, version 7 or higher is not supported at the present time",
                                        "action"    => "Install supported version of PHP on the server"),
    
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
                                        "check"     => "ereg,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mhash,mysql,mysqli,openssl,pcre,pdo_mysql,phar,readline,session,simplexml,soap,sockets,zip", 
                                        "action"    => "Install the missing extensions using either <a href='http://php.net/manual/en/install.pecl.intro.php'>PECL</a> or through your Linux server's package manager."), 
        
    "version_mysql" =>          array(  "label"     => "MySQL version", 
                                        "help"      => "A MySQL database server version 5.5 or higher is required to store Mlab usr and app data",
                                        "check"     => "5.5", 
                                        "action"    => "Install an appropriate version of Mlab on the server."), 
    
    "version_composer" =>       array(  "label"     => "Composer version", 
                                        "help"      => "Composer is a library manager used by Mlab to install the Symfony framework and Javascript libraries. Version 1.3 or higher is required",
                                        "check"     => "1.3", 
                                        "action"    => "You can <a href='index.php?fix=version_composer'>click here</a> to try to install the correct version of composer, otherwise manually follow <a href='https://getcomposer.org/'>these instructions</a>."), 
    
    "version_symfony" =>         array( "label"     => "Symfony framework", 
                                        "help"      => "Mlab requires the Symfony framework to be installed, during the installation a number of PHP and HTML files will be downloaded to the Mlab folder on the server.",
                                        "check"     => "2.8", 
                                        "action"    => "You can <a href='index.php?fix=libraries_symfony'>click here</a> to try to install the framework, otherwise manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>."), 
    
    "bootstrap_symfony" =>       array( "label"     => "Boostrap file", 
                                        "help"      => "The app/bootstrap.php.cache must be created, this is usually done by Composer when the Symfony framework is installed.",
                                        "check"     => "app/bootstrap.php.cache", 
                                        "action"    => "You can <a href='index.php?fix=bootstrap_symfony'>click here</a> to try to generate this file, otherwise manually follow <a href='http://stackoverflow.com/questions/6072081/symfony2-updating-bootstrap-php-cache'>these instructions</a>."), 
    
    "libraries_js" =>           array(  "label"     => "Javascript libraries", 
                                        "help"      => "These Javascript and libraries must be installed to be able to use Mlab: 'bowser, jquery.contextmenu, jquery, jquery.ddslick, jquery.mobile, jquery-qrcode, jquery.qtip, spin.js, jquery.spin, jquery-ui, jquery.uploadfile-1.9.0'",
                                        "check"     => "bowser.js,jquery.contextmenu.js,jquery-2.1.4.js,jquery.ddslick-1.0.0.js,jquery.mobile-1.4.5.js,jquery.qrcode-0.12.0.js,jquery.qtip-2.2.0.js,spin.js,jquery.spin.js,jquery-ui.js,jquery.uploadfile-1.9.0.js", 
                                        "action"    => "You can <a href='index.php?fix=libraries_js'>click here</a> to try to install these libraries, otherwise manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>."), 
    
    "version_uglifyjs" =>       array(  "label"     => "UglifyJS version", 
                                        "help"      => "UglifyJS is used to compress and protect Javascript file. Version 2.4 or higher is required",
                                        "check"     => "2.4", 
                                        "action"    => "Install UglifyJS using the following command line as the 'root' user (make sure NPM is installed first): 'npm&nbsp;install&nbsp;uglifyjs&nbsp;-g'."), 
    
    "version_nodejs" =>       array(    "label"     => "Node JS version", 
                                        "help"      => "Node JS is used to run a small web socket server for compiler and app store messaging. Version 0.10.29 or higher is required.",
                                        "check"     => "0.10.29", 
                                        "action"    => "Install Node JS using your operating system's standard package management installation, see <a href='https://nodejs.org/en/download/'>here</a> for more information."), 
);

//pick up parameters from dist file, then we clean it up to keep only entries that start with a __
$params = Spyc::YAMLLoad('app/config/parameters.yml.dist');

//if parameters.yml exists, then we read in the values from that one
if (file_exists('app/config/parameters.yml')) { 
    $param_values = Spyc::YAMLLoad('app/config/parameters.yml');
} else {
    $param_values = false;
}

$params_help = array(
    "database_driver" => "The name of the PHP database driver to use",
    "database_host" => "URL/IP address of the database server to use",
    "database_port" => "TCP/IP port of the database server, set to null ig using sockets",
    "database_name" => "Name of the database (not server) to use on the database server, create this before adding it",
    "database_user" => "Name of user for database login",
    "database_password" => "Password of user for database login",
    "mailer_transport" => "How to send emails (smtp, mail, sendmail, or gmail)",
    "mailer_host" => "URL/IP address of the email server to use",
    "mailer_user" => "Name of user for email server login",
    "mailer_password" => "Password of user for email server login",
    "locale" => "Which locale to use, for instance en_UK. Can be overridden by individual Mlab users when they log in",
    "mlab__convert__python_bin" => "Path to Python executable",
    "mlab__ws_socket__url_client" => "URL for web socket server used by Mlab editor to communicate with server",
    "mlab__ws_socket__url_server" => "URL for web socket server used to communicate with compiler and app market services",
    "mlab__uploads_allowed__img" => "List of mime types allowed for image uploads",
    "mlab__uploads_allowed__video" => "List of mime types allowed for video uploads",
    "mlab__uploads_allowed__audio" => "List of mime types allowed for audio uploads",
    "mlab__paths__app" => "Full path to where Mlab created apps should be stored",
    "mlab__paths__component" => "Full path to where Mlab components should be installed",
    "mlab__paths__template" => "Full path to where Mlab templates should be installed",
    "mlab__paths__icon" => "Full path to where images used to generate app icons should be installed",
    "mlab__urls__app" => "External URL to where Mlab created apps should be stored",
    "mlab__urls__component" => "External URL to where Mlab components should be installed",
    "mlab__urls__template" => "External URL to where Mlab templates should be installed",
    "mlab__urls__icon" => "External URL to where images used to generate app icons should be installed",
    "mlab__compiler_service__supported_platforms" => "List of mobile platforms (for instance Android) supported by Cordova for this installation of Mlab",
    "mlab__compiler_service__url" => "URL to compilation service",
    "mlab__compiler_service__protocol" => "Protocol (http/https) to use to connect to compilation service",
    "mlab__compiler_service__passphrase" => "Unique passphrase to access compilation service",
    "mlab__compiler_service__app_creator_identifier" => "Unique, reverse domain, identifier, for instance 'com.test.app'",
    "mlab__compiler_service__target_version__ios" => "Which base/minimum version to compile apps for iOS for",
    "mlab__compiler_service__target_version__android" => "Which base/minimum version to compile apps for Android for",
    "mlab__compiler_service__rsync_bin" => "Path to the Rsync executable file",
    "mlab__compiler_service__rsync_url" => "URL to use to upload files to compiler service",
    "mlab__compiler_service__rsync_password" => "Password to use to upload files to compiler service",
);

$write_permissions = array(getcwd() . "/app/cache", getcwd() . "/app/config", getcwd() . "/app/logs", getcwd() . "/composer.lock");


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
function clean_parameters($array, $prefix = '') {
    global $param_values;
    $editable_types = array("boolean", "integer", "double", "string");
    $result = array();
    foreach ($array as $key => $value) {
        $flat_key = $prefix . (empty($prefix) ? '' : '.') . $key;
        
        if (is_array($value)) {
            $test_value = reset($value);
            $first_key = key($value);
            $test = gettype($test_value);
            if ($first_key === 0 && in_array($test, $editable_types)) {
                $result[$flat_key] = implode(",", $value);
            } else {
                $result = array_merge($result, clean_parameters($value, $flat_key));
            }
        } else {
            if (strpos($flat_key, "___") !== false) {
                $new_key = str_replace(array("___", "."), array("", "__"), $key);
                $result[$flat_key] = $value;
            }
        }
    }
    return $result;
}  


//function to set some sensible values if they are missing initially
function init() {
    global $params;
    global $write_permissions;
    $cur_dir = getcwd();
    putenv("PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'");

    if (!$params["parameters"]["mlab"]["compiler_service"]["rsync_bin"]) {
        $p = shell_exec("which rsync");
        $params["parameters"]["mlab"]["compiler_service"]["rsync_bin"] = $p;
    }
    if (!$params["parameters"]["mlab"]["convert"]["python_bin"]) {
        $p = shell_exec("which python");
        $params["parameters"]["mlab"]["convert"]["python_bin"] = $p;
    }
    foreach(array("app", "component", "template", "icon") as $element) {
        if (!$params["parameters"]["mlab"]["paths"][$element]) {
            $params["parameters"]["mlab"]["paths"][$element] = $cur_dir . "/mlab_elements/$element" . "s/";
        }
        $write_permissions[] = $params["parameters"]["mlab"]["paths"][$element];
        
        if (!$params["parameters"]["mlab"]["urls"][$element]) {
            $params["parameters"]["mlab"]["urls"][$element] = str_replace($cur_dir, "", $params["parameters"]["mlab"]["paths"][$element]) . "$element" . "s/";
        }
    }
    $params = clean_parameters($params);
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
    global $checks;
    return (PHP_VERSION_ID >= $checks["version_php"]["check"]["min"] && PHP_VERSION_ID <= $checks["version_php"]["check"]["max"]);
}

function url_allowed_php_ini() {
    global $checks;
    $setting = ini_get($checks["url_allowed_php_ini"]["check"]);
    if (gettype($setting) == "string") {
        $setting = strtolower($setting);
    }
    if (in_array($setting, array("true", "yes", 1, "on"))) {
        return true;
    } else {
        return $checks["url_allowed_php_ini"]["check"] . " set to " . $setting;
    }
}

function timezone_php_ini() {
    global $checks;
    $setting = ini_get($checks["timezone_php_ini"]["check"]);
    if (trim($setting)) {
        return true;
    } else {
        return $checks["timezone_php_ini"]["check"] . " set to " . $setting;
    }
}

function libraries_php() {
    global $checks;
    $libs = explode(",", $checks["libraries_php"]["check"]);
    foreach ($libs as $lib) {
        if (!extension_loaded($lib)) {
            return "PHP extension $lib not present";
        }
    }
    return true;
}

function version_mysql() {
    global $checks;
    $info = shell_exec("mysql -N -B -e \"SHOW VARIABLES LIKE 'version';\"");
    list($info) = explode("-", $info);
    $info = str_replace("version", "", $info);
    return check_version_number($info, $checks["version_mysql"]["check"]);
}

// check version, if not found or wrong version, download correct version
// see https://github.com/composer/packagist/issues/393 re home dir
function version_composer() {
    global $checks;
    putenv("COMPOSER_HOME=/home/utvikler/workspace/mlab.local.dev/bin/.composer");
    putenv("PATH='/usr/local/bin:/usr/bin:/bin'");
    
    if (!file_exists("bin/composer.phar")) {
        $exp_sig = read("https://composer.github.io/installer.sig");
        copy('https://getcomposer.org/installer', 'bin/composer-setup.php');
        $dl_sig = hash_file('SHA384', 'bin/composer-setup.php');

        if ($exp_sig == $dl_sig) {
            include("bin/composer-setup.php");
        } 
        
        include("bin/composer-setup.php");
        if (!file_exists("bin/composer.phar")) {
            return "Unable to install composer";
        }
    }

//now check version
    $ret = shell_exec("cd /home/utvikler/workspace/mlab.local.dev; bin/composer.phar -V");
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

function libraries_js() {
    global $checks;
    $libs = explode(",", $checks["libraries_js"]["check"]);
    foreach ($libs as $lib) {
        if (!file_exists("src/Sinett/MLAB/BuilderBundle/Resources/public/js/$lib")) {
            return "Library src/Sinett/MLAB/BuilderBundle/Resources/public/js/$lib not found";
        }
    }
    return true;
}

function version_uglifyjs() {
    global $checks;
    $info = shell_exec("uglifyjs --version");
    return check_version_number($info, $checks["version_uglifyjs"]["check"]);
}

function version_nodejs() {
    global $checks;
    $info = str_replace("v", "", shell_exec("nodejs --version"));
    return check_version_number($info, $checks["version_nodejs"]["check"]);
}


// se http://symfony.com/doc/current/doctrine.html
function populate_db($password) {
    $sql = "INSERT INTO `grp` (`id`, `name`, `description`, `is_default`, `enabled`, `roles`) VALUES (1, 'General', 'General group for initial use', 1, 1, 'a:0:{}')";
    $sql = "INSERT INTO `templates_groups` (`template_id`, `group_id`) VALUES (1, 1)";
    $sql = "INSERT INTO `users_groups` (`user_id`, `group_id`) VALUES (3, 1)";
    $sql = "INSERT INTO `usr` (`id`, `category_1`, `category_2`, `category_3`, `email`, `password`, `salt`, `created`, `updated`, `username`, `username_canonical`, `email_canonical`, `enabled`, `last_login`, `locked`, `expired`, `expires_at`, `confirmation_token`, `password_requested_at`, `roles`, `credentials_expired`, `credentials_expire_at`, `locale`) VALUES (3, NULL, NULL, NULL, 'arild.bergh@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2016-10-10 16:11:32', 'arild', 'arild', 'arild.bergh@ffi.no', 1, '2016-10-10 16:11:32', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:\"ROLE_ADMIN\";}', 0, NULL, 'en_GB')";
}

//call the init function to fill variables
init();

?><!DOCTYPE html>
<html>
    <head>
        <style>
            table {
                width: 500px;
            }
            table, th, td {
                border: 1px solid lightgray;
                border-collapse: collapse;
                padding: 5px;
                vertical-align: top;
            }
            table td:nth-child(2), table td:nth-child(4) {
                width: 40px;
                text-align: center;
            }
            table td:nth-child(4) {
                width: 250px;
            }
            input[type=text] {
                width: 230px;
                padding: 3px;
            }
        </style>
        <meta charset="UTF-8" />
        <title>Verify and update Mlab installation before use</title>
    </head>
    <body>
        <h1>Verify and update Mlab installation before use</h1>
        <h2>setting up web server and correctly</h2>
        <p>Look <a href="server_setup.html">here</a> for a full explanation on how to correctly configure the web server before starting the Mlab configuration</p>
        <form action='index.php?fix=save_parameters' method="post" accept-charset="UTF-8">
<!-- First the required stuff that they have to do themselves -->
            <table>
                <thead>
                    <tr><td colspan="4"><h2>Prerequisites</h2></td></tr>
                    <tr><td>Item</td><td>Status</td><td>Action required</td><td>&nbsp</td></tr>
                </thead>
                <tbody>
                    <?php 
                    foreach ($checks as $key => $value) {
                        if (function_exists($key)) {
                            eval("\$res = " . $key . "(\$value);");
                        } else {
                            $res = false;
                        }
                        if ($res === true) {
                            echo "<tr><td>" . $value["label"] . "</td><td><img src='ok.png'></td><td>None</td><td title='" . htmlentities($value["help"]) . "'><img src='question.png'></td></tr>\n";
                        } else {
                            echo "<tr><td>" . $value["label"] . "</td><td><img src='fail.png'></td><td>$value[action]<hr>Error: $res</td><td title='" . htmlentities($value["help"]) . "'><img src='question.png'></td></tr>\n";
                        }
                    }

                    ?>
                </tbody>
                
<!-- Then the parameters such as paths etc that we can update -->
                <tr><td colspan="4"><h2>Permissions</h2></td></tr>
                <tr><td colspan='3'>File/Directory</td><td>Writable?</td></tr>
                <tbody>
                    <?php 
                        foreach ($write_permissions as $dir) {
                            echo "<tr><td colspan='3'>$dir</td><td><img src='" . (is_writable($dir) ? "ok" : "fail") . ".png'></td></tr>\n";
                        }
                    ?>
                </tbody>
                
<!-- Then the parameters such as paths etc that we can update -->
                <tr><td colspan="4"><h2>Site setup</h2></td></tr>
                <tr><td>Setting</td><td colspan='2'>Current value</td><td>&nbsp;</td></tr>
                <tbody>
                    <?php 
                        $param_list = get_parameter_value($params["parameters"]);
                        foreach ($param_list as $key => $value) {
                            if (strpos($key, "___") !== false) {
                                $new_key = str_replace(array("___", "."), array("", "__"), $key);
                                echo "<tr><td>" . htmlentities($params_help[$new_key]) . "</td><td colspan='2'><input type='text' name='" . $new_key . "' value='$value'></td><td title='$key'><img src='question.png'></td></tr>\n";
                            }
                        }
                    ?>
                    <tr><td colspan='3'></td><td><input type="submit" name="submit_ok" value="Save"></td></tr>
                </tbody>
            </table>
        </form>
    </body>
</html>
