<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Verify and update Mlab installation before use</title>
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
 
 *****
 ***** Then we need to specify composer commands to run
 ***** 
 *      After composer, check if relevant vendor / javascript libraries are installed
 *      Check owner of files & app/cache & app/logs (should be same as current owner of php process)

 *****
 ***** Then we need allow editing of parameters.yml, and loading of data
 ***** 
 *      ask for a salt, goes into security.yml
 *      edit parameters.yml
 *      offer to install icons, components and templates, they should be a zip file of directories to make it easy to do many.
 *      create database (load SQL or use doctrine???) php bin/console doctrine:database:create
 */

//Edit variables here

$php_version_min = 5.4;
$php_version_max = 6.9;

//--------DO NOT EDIT BELOW THIS LINE----------------

//Have two "things "pages", one for installed items, one for parameter.yml settings
error_reporting(E_ALL);

chdir("../../");

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
                                        "action"    => "Set  the <a href='http://php.net/manual/en/filesystem.configuration.php'>allow_url_fopen setting</a> to <em>On</em> in the __PHPINI__ file on the server."),
    
    "timezone_php_ini" =>       array(  "label"     => "Timezone", 
                                        "help"      => "The timezone must be set in the relevant PHP.INI file on the server",
                                        "check"     => "date.timezone",
                                        "action"    => "Update the __PHPINI__ file with a <a href='http://php.net/manual/en/timezones.php'>valid timezone setting</a>."), 
    
    "libraries_php" =>          array(  "label"     => "PHP extensions", 
                                        "help"      => "These PHP extensions must be available. Check your PHP installation & php.ini",
                                        "check"     => "ereg,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mhash,mysql,mysqli,openssl,pcre,pdo_mysql,phar,readline,session,simplexml,soap,sockets,wdx,zip", 
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
                                        "help"      => "These Javascript and libraries must be installed to be able to use Mlab: 'bowser, jquery.contextmenu, jquery, jquery.ddslick, jquery.mobile, jquery-qrcode, jquery.qtip, spin.js, jquery.spin, jquery-ui-1.11.4, jquery.uploadfile'",
                                        "check"     => "bowser, jquery.contextmenu, jquery, jquery.ddslick, jquery.mobile, jquery-qrcode, jquery.qtip, spin.js, jquery.spin, jquery-ui-1.11.4, jquery.uploadfile", 
                                        "action"    => "You can <a href='index.php?fix=libraries_js'>click here</a> to try to install these libraries, otherwise manually follow <a href='https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies'>these instructions</a>."), 
    
    "version_uglifyjs" =>       array(  "label"     => "UglifyJS version", 
                                        "help"      => "UglifyJS is used to compress and protect Javascript file. Version 2.4 or higher is required",
                                        "check"     => "2.4", 
                                        "action"    => "Install UglifyJS using the following command line as the 'root' user (make sure NPM is installed first): 'npm&nbsp;install&nbsp;uglifyjs&nbsp;-g'."), 
);

require_once "spyc.php";
$params = Spyc::YAMLLoad('app/config/installation_parameters.yml');

/***
 * Simple helper function to find the version number in a string by splitting by spaces and looking for float value
 */
function check_version_number($str, $ver) {
    $info = explode(" ", $str);
    foreach ($info as $value) {
        if (floatval($value)) {
            if (version_compare($value, $ver, ">=")) {
                return true;
            } else {
                return false;
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

// check version, if not found or wrong version, download correct version
// see https://github.com/composer/packagist/issues/393 re home dir
function version_composer() {
    global $checks;
    putenv("COMPOSER_HOME=/home/utvikler/workspace/mlab.local.dev/bin/.composer");
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
    $x = shell_exec("php /home/utvikler/workspace/mlab.local.dev/bin/composer.phar -V");
    $info = explode(" ", $x);
    foreach ($info as $value) {
        if (floatval($value)) {
            if (version_compare($value, $checks["version_composer"]["check"], ">=")) {
                return true;
            } else {
                return $checks["version_composer"]["check"];
            }
        }
    }
    
    return "Unable to determine if composer is installed and the right version";
}

function version_uglify() {
    global $checks;
    
    $ver = extract_version_number(shell_exec("uglifyjs --version"));
    
    if (version_compare($info[0], $checks["version_uglifyjs"]["check"], ">=")) {
        return true;
    } else {
        return $info[0];
    }
}

// se http://symfony.com/doc/current/doctrine.html
function populate_db($password) {
    $sql = "INSERT INTO `grp` (`id`, `name`, `description`, `is_default`, `enabled`, `roles`) VALUES (1, 'General', 'General group for initial use', 1, 1, 'a:0:{}')";
    $sql = "INSERT INTO `templates_groups` (`template_id`, `group_id`) VALUES (1, 1)";
    $sql = "INSERT INTO `users_groups` (`user_id`, `group_id`) VALUES (3, 1)";
    $sql = "INSERT INTO `usr` (`id`, `category_1`, `category_2`, `category_3`, `email`, `password`, `salt`, `created`, `updated`, `username`, `username_canonical`, `email_canonical`, `enabled`, `last_login`, `locked`, `expired`, `expires_at`, `confirmation_token`, `password_requested_at`, `roles`, `credentials_expired`, `credentials_expire_at`, `locale`) VALUES (3, NULL, NULL, NULL, 'arild.bergh@ffi.no', 'NfC70S55Mqgmq6eowT04hTJZPUjEMQFj4qsX7RIOhwm20xIJX3BgHqbhsF7B3y9RZ2XF7Ti2D3aHlVbBHNURoA==', 'l07vnpnyysgg4s0kggockgooc00skww', '2013-11-18', '2016-10-10 16:11:32', 'arild', 'arild', 'arild.bergh@ffi.no', 1, '2016-10-10 16:11:32', 0, 0, NULL, NULL, NULL, 'a:1:{i:0;s:10:\"ROLE_ADMIN\";}', 0, NULL, 'en_GB')";
}

//----php_ini_loaded_file

//app/console --version

/*
 * get a subsidiary branch, for instance:
        uploads_allowed:
          img: [image/gif, image/jpeg, image/png]
          video: [video/webm, video/mp4, video/ogg]
          audio: [audio/mp4, audio/mpeg, audio/vnd.wave]
          
        paths:
          app: /home/utvikler/workspace/mlab.local.dev/mlab_elements/apps/
          component: /home/utvikler/workspace/mlab.local.dev/mlab_elements/components/
          template: /home/utvikler/workspace/mlab.local.dev/mlab_elements/templates/
          icon: /home/utvikler/workspace/mlab.local.dev/mlab_elements/icons/
 
 * Will check if child property is string/number or not, if not it'll recurse until it arrives at final value
 * Also needs to check if the child property is just an array of possible values, in that case we need to stop at current level
 */
function get_parameter_value($array, $prefix = '') {
    $editable_types = array("boolean", "integer", "double", "string");
    $result = array();
    foreach ($array as $key => $value) {
        $new_key = $prefix . (empty($prefix) ? '' : '.') . $key;
        
        if (is_array($value)) {
            $test_value = reset($value);
            $first_key = key($value);
            $test = gettype($test_value);
            if ($first_key === 0 && in_array($test, $editable_types)) {
                $result[$new_key] = implode(",", $value);
            } else {
                $result = array_merge($result, get_parameter_value($value, $new_key));
            }
        } else {
            $result[$new_key] = $value;
        }
    }

    return $result;
}    
    
/*    
    $editable_types = array("boolean", "integer", "double", "string");
    $type = getttype($value);

//if the next value down is a string/number, 
    if (in_array($type, $editable_types)) {
        return array($path, $value);
        
    } else {
        $test = getttype(reset($value));
        if (in_array($type, $editable_types)) {
            
        } else {
            return get_parameter_value($key, $value, $path, $result);
        }
    }
    
    return $result;
}*/

?>
    </head>
    <body>
        <h1>Verify and update Mlab installation before use</h1>
        <!-- First the required stuff that they have to do themselves -->
        <table>
            <thead>
                <tr><td colspan="3"><h2>Prerequisites</h2></td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
            </thead>
            <tbody>
                <?php 
                foreach ($checks as $key => $value) {
                    if (function_exists($key)) {
                        eval("\$res = " . $key . "(\$value);");
                    } else {
                        $res = false;
                    }
                    echo "<tr><td>" . $value["label"] . "</td><td><img src='" . ($res === true ? "ok.png" : "fail.png" ) . "'></td><td>" . ((!$res && $value["fixable"]) ? "<a href='INSTALL.php?fix=" . $key . "'>Fix</span>" : "" ) . "</td></tr>\n";
                }
                
                ?>
            </tbody>
        <!-- Then the parameters such as paths etc that we can update -->
            <thead>
                <tr><td colspan="3"><h2>Site setup</h2></td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
            </thead>
            <tbody>
                <?php 
                
                foreach ($params as $top_level => $sub_level) {
                    echo "<tr><td>" . $top_level . "</td><td>&nbsp;</td><td>&nbsp;</td></tr>\n";
                    $param_list = get_parameter_value($sub_level);
                    foreach ($param_list as $key => $value) {
                        echo "<tr><td>&nbsp;</td><td>$key</td><td><input type='text' name='$key' value='$value'></td></tr>\n";
                    }
                }
                
                ?>
                <tr><td>&nbsp;</td><td>&nbsp;</td><td><button>Save</button></td></tr>
            </tbody>
        </table>
        
    </body>
</html>
