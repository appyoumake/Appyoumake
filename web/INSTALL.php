<html>
<?php
//Have two "things "pages", one for installed items, one for parameter.yml settings

/*
 * This installer script will check if:
 *      Has Internet connection
 *      Must allow the use of URLs for downloading files using copy
 *      That date.timezone is set
 *      if relevant PHP extensions are loaded: 
 *      Composer is installed (http://stackoverflow.com/questions/17219436/run-composer-with-a-php-script-in-browser) also use autoupdate
 *      if relevant vendor / javascript libraries are installed
 *      ask for a salt, goes into security.yml
 *      offer to install icons, components and templates, they should be a zip file of directories to make it easy to do many.
 *      Check owner of files & app/cache & app/logs (should be same as current owner of php process)
 */

chdir("../");

$checks = array(
    "internet_present" => array("fixable" => false, "label" => "Mlab can be run without Internet connection, but during installation an Internet connection is required"),
    "version_php" => array("fixable" => false, "check" => array("min" => 50400, "max" => 60000), "label" => "PHP version 5.4 or higher is required"),
    "version_composer" => array("check" => 1.3, "label" => "PHP version 5.4 or higher is required"),
);
/*    "version_mysql" => array("check" => " >= 5.6 ", "label" => "MySQL version 5.5 or higher is required"),
    "url_allowed_php_ini" => array("label" => "The PHP URL functonality must be enabled"),
    "timezone_php_ini" => array("label" => "The timezone must be set"),
"libraries_php" => array("check" => "ereg,fileinfo,gd,gettext,iconv,intl,json,libxml,mbstring,mhash,mysql,mysqli,openssl,pcre,phar,readline,session,simplexml,soap,sockets,wdx,zip", "label" => "These PHP extensions must be available. Check your PHP installation & php.ini"),
"libraries_symfony" => array("label" => "These PHP extensions must be available. Check your PHP installation & php.ini"),
"libraries_js" => array("label" => "These Javascript and libraries must be installed to be able to use Mlab"),
"bootstrap_symfony" => array("label" => "These Javascript and libraries must be installed to be able to use Mlab"),
);
*/

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
    
    if (PHP_VERSION_ID >= $checks["version_php"]["check"]["min"] && PHP_VERSION_ID <= $checks["version_php"]["check"]["max"]) {
        return true;
    } else {
        return PHP_VERSION_ID;
    }
}

//check version, if not found or wrng version, download correct version
function version_composer() {
    global $checks;
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
    system('bin/composer.phar -V 2>&1');
    //$info = explode(" ", shell_exec("bin/composer.phar -V"));
    die(print_r(get_current_user(), true));
    foreach ($info as $value) {
        if (floatval($value)) {
            if (floatval($value) >= $checks["version_composer"]["check"]) {
                return true;
            } else {
                return $checks["version_composer"]["check"];
            }
        }
    }
    
    return "Unable to determine if composer is installed and the right version";
}

//the parameters.yml should be merged from default, non-changeable settings kept in application_parameters.yml and the stuff here which is changeable
//in addition we'll autocreate the secret setting which is used to avoid csrf attacks
//$parameters_yml = yaml_parse_file ('app/config/parameters.yml.dist')["parameters"];
/*array(
    'parameters' =>
    array(
        'database_driver' => 'pdo_mysql',
        'database_host' => 'localhost',
        'database_port' => '',
        'database_name' => 'mlab',
        'database_user' => 'mlab_user',
        'database_password' => '',
        'mailer_transport' => 'smtp',
        'mailer_host' => 'localhost',
        'mailer_user' => '',
        'mailer_password' => '',
        'locale' => 'nb_NO',
        
        'mlab' => array(
            'convert' => array(
                'python_bin' => '/usr/bin/python',
            ),
            'ws_socket' => array(
                'url_client' => 'ws://mlab.local.dev:8080/',
                'path_client' => '/messages/',
                'url_server' => 'http://mlab.local.dev:8080/',
                'path_server' => '/messages/',
            ),
            'missing_icon' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAEbgAABG4B0KOyaAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD4SURBVDiNpdO9LoRREMbx3/iqRaKREIVCoVETlmoLiauwjbgAvWvQqH1cgyhU3IBCoVJoZBUiFMIo9hSb17vvZplkknPm43+emeRAB13kiN5FJ8rhBNdGsxb2FFo7M/U7VnGAQ2wjKvl26f0NwFGJf+OznM8xORSAjRK7wwJmcVtiO1XAWM1sK3jHfmY+ZuYzrkpuuW4ZVQWBub77Gl7xhqWhCrJnTxARm7gs0N3MfKjWT9RJ6rPjUrOVmTd1BXU7UF4PzONiUHOjgszMiFjHfZPEJgVTOMPpnwAYxzRmmgBNI3xExCK+hgFe0OrtrN4G5Fql93/f+QdOZKfScs6QZgAAAABJRU5ErkJggg==',
            'save_interval' => 60,
            'icon_text_maxlength' => 6,
            'os_path' => '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            'uploads_allowed' => array(
                'img' =>
                array(
                    0 => 'image/gif',
                    1 => 'image/jpeg',
                    2 => 'image/png',
                ),
                'video' =>
                array(
                    0 => 'video/mpeg',
                    1 => 'video/mp4',
                    2 => 'video/x-flv',
                ),
                'audio' =>
                array(
                    0 => 'audio/mp4',
                    1 => 'audio/mpeg',
                    2 => 'audio/vnd.wave',
                ),
            ),
            'paths' => array(
                'app' => '/home/utvikler/workspace/mlab.local.dev/mlab_elements/apps/',
                'component' => '/home/utvikler/workspace/mlab.local.dev/mlab_elements/components/',
                'template' => '/home/utvikler/workspace/mlab.local.dev/mlab_elements/templates/',
                'icon' => '/home/utvikler/workspace/mlab.local.dev/mlab_elements/icons/',
            ),
            'urls' => array(
                'app' => '/mlab_elements/apps/',
                'component' => '/mlab_elements/components/',
                'template' => '/mlab_elements/templates/',
                'icon' => '/mlab_elements/icons/',
                'icon_font' => '/img/oswald_bold.ttf',
            ),
            'compiler_service' => array(
                'supported_platforms' => array(
                    0 => 'ios',
                    1 => 'android',
                ),
                'default_icon' => 'data:image/png;base64,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',
                'url' => '192.168.1.1:8282',
                'protocol' => 'http',
                'passphrase' => '',
                'app_creator_identifier' => '',
                'target_version' => array(
                    'ios' => 7,
                    'android' => 18,
                ),
                'rsync_bin' => '/usr/bin/rsync',
                'rsync_url' => 'user@192.168.1.1::cs_inbox',
                'rsync_password' => '',
                'rsync_suffix' => '/www/',
            ),
            
            'replace_in_filenames' =>
            array(
                'a' => '/[ÂÃÄÀÁÅàáâãäå]/',
                'ae' => '/[Ææ]/',
                'c' => '/[Çç]/',
                'e' => '/[ÈÉÊËèéêë]/',
                'i' => '/[ÌÍÎÏìíîï]/',
                'o' => '/[ÒÓÔÕÖØòóôõöø]/',
                'n' => '/[Ññ]/',
                'u' => '/[ÙÚÛÜùúûü]/',
                'y' => '/[Ýýÿ]/',
                '_' => '/[^A-Za-z0-9]/',
            ),
            'plugins' =>
            array(
                0 => 'cordova-plugin-device',
                1 => 'cordova-plugin-network-information',
            ),
        ),
    ),
)*/
?>


    <head>
        
    </head>
    <body>
        <table>
            <thead>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
            </thead>
            <tbody>
                <?php 
                foreach ($checks as $key => $value) {
                    eval("\$res = " . $key . "();");
                    echo "<tr><td>" . $value["label"] . "</td><td>" . ($res === true ? "OK" : $res ) . "</td><td>" . ((!$res && $value["fixable"]) ? "<a href='INSTALL.php?fix=" . $key . "'>Fix</span>" : "" ) . "</td></tr>\n";
                }
                
                ?>
            </tbody>
        </table>
    </body>
</html>
