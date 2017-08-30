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
 *      Has relevant software versions installed
 *      PHP.ini must have date.timezone set
 *      Relevant PHP extensions must be loaded
 *      creates a salt, goes into security.yml
 *      edit parameters.yml
 *      create database (load SQL or use doctrine???) php bin/console doctrine:database:create
 */

// EDIT SETTINGS IN config.inc FILE

//include additional files/libraries
require_once "config.inc";
require_once "spyc.php";
require_once "utils.php";

//set up the core vairables, the fail array is used to determine if a step has had a failed check
$www_user = posix_getpwuid(posix_geteuid())['name'];
$fail = array(false, false, false, false, false);
$next_step = ($_REQUEST['next_step'] ? $_REQUEST['next_step'] : $next_step = STEP_INTRO);
if ($next_step == STEP_CHECK_DATA) {
    if (!extension_loaded("mysqli")) {
        die("Installation script requires the 'mysqli' PHP extension to be installed. Install, restart server and try again.");
    }
}

chdir("../../");

//--- RUN VARIOUS TASKS (such as storing parameters) IN RESPONSE TO GET REQUESTS ---

//if finished, delete all files
if ($_REQUEST['completed'] == 'ALL_OK') {
    rmall("web/INSTALL");
    header("Location: http" . (isset($_SERVER['HTTPS']) ? 's' : '') . "://" . "{$_SERVER['HTTP_HOST']}/");
    die("NOW THE FOLDER WOULD BE DELETED...");
}

//various tasks that can be done from within the installed
switch ($_REQUEST['fix']) {
    
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
        $next_step = STEP_CHECK_PARAMS;
        break;
    
//import the empty database
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
        $next_step = STEP_CHECK_DATA;
        break;
    
    case "import_templates":
        $next_step = STEP_CHECK_DATA;
        break;
    
    case "import_components":
        $next_step = STEP_CHECK_DATA;
        break;
    
    case "assetic_update":
        putenv($system_path);
        $p = trim(shell_exec("app/console --env=prod assetic:dump"));
        $next_step = STEP_CHECK_DATA;
        break;

    case "bootstrap_symfony":
        $p = trim(shell_exec("bin/composer run-script post-update-cmd"));
        $next_step = STEP_CHECK_DATA;
        break;

}

//pick up parameters from dist file, then from install file to merge, and finally turn into a flat array
$params = Spyc::YAMLLoad('app/config/parameters.yml.dist');

//if parameters.yml exists, then we read in the values from that one
if (file_exists('app/config/parameters.yml')) {
    $params = array_merge_recursive($params, Spyc::YAMLLoad('app/config/parameters.yml'));
}
$params = flatten_array($params, $param_values);

    
$d = getcwd();
$write_permissions = array(
    $d . "/app" => (is_writable($d . "/app") ? true : false), 
    $d . "/app/config" => (is_writable($d . "/app/config") ? true : false), 
    $d . "/app/config/parameters.yml" => (is_writable($d . "/app/config/parameters.yml") ? true : false), 
    $d . "/bin" => (is_writable($d . "/bin") ? true : false),
    $d . "/app/cache" => (is_writable($d . "/app/cache") ? true : false), 
    $d . "/app/logs" => (is_writable($d . "/app/logs") ? true : false),
    $params["parameters__mlab__paths__app"] => (is_writable($params["parameters__mlab__paths__app"]) ? true : false),
    $params["parameters__mlab__paths__template"] => (is_writable($params["parameters__mlab__paths__template"]) ? true : false),
    $params["parameters__mlab__paths__component"] => (is_writable($params["parameters__mlab__paths__component"]) ? true : false),
    $params["parameters__mlab__paths__icon"] => (is_writable($params["parameters__mlab__paths__icon"]) ? true : false)
    );


//function to set some sensible values if they are missing initially
function init() {
    global $data_checks, $software_version_checks, $params, $param_values, $write_permissions, $system_path, $fail;
    $cur_dir = getcwd();
    putenv($system_path);

    $info = file("web/INSTALL/info.html", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $info = str_replace("{%php.ini%}", php_ini_loaded_file(), $info);
    
   
    $fail[STEP_CHECK_PERMISSIONS] = in_array(false, $write_permissions);
    
    foreach ($data_checks as $key => $value) {
        if (function_exists($key)) {
            eval("\$data_checks['" . $key . "']['result'] = " . $key . "(\$value);");
        } else {
            $data_checks[$key]['result'] = false;
        }
        if ($data_checks[$key]['result'] !== true) {
            $fail_versions = true;
        }
        
//loop through the info.html content and assign help text. 
//this is done by looking for comment lines with $key as the content
        $update_help = false;

        foreach ($info as $line) {
            if (!$update_help && $line == "<!--$key-->") {
                $update_help = true;
                $data_checks[$key]['action'] = '';
            } else if ($update_help) {
                if ($line == "<!--/$key-->") {
                    $update_help = false;
                } else {
                    $data_checks[$key]['action'] .= $line;
                }
            } 
        }
        
    }
    
//looping through all pre checks and see if they are present of missing
    foreach ($software_version_checks as $key => $value) {
        if (function_exists($key)) {
            eval("\$software_version_checks['" . $key . "']['result'] = " . $key . "(\$value);");
        } else {
            $software_version_checks[$key]['result'] = false;
        }
        if ($software_version_checks[$key]['result'] !== true) {
            $fail[STEP_CHECK_SOFTWARE] = true;
        }
        
//loop through the info.html content and assign help text. 
//this is done by looking for comment lines with $key as the content
        $update_help = false;

        foreach ($info as $line) {
            if (!$update_help && $line == "<!--$key-->") {
                $update_help = true;
                $software_version_checks[$key]['action'] = '';
            } else if ($update_help) {
                if ($line == "<!--/$key-->") {
                    $update_help = false;
                } else {
                    $software_version_checks[$key]['action'] .= $line;
                }
            } 
        }
    }
    
}




//call the init function to fill variables
init();

?><!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" type="text/css" href="basic.css">
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
            <p><a href="info.html" target="_new">Click here for complete setup instructions.</a></p>
            <form action='index.php?fix=save_parameters' method="post" accept-charset="UTF-8" id="parameters">
                <table id="0">    
                    <tr>
                        <td>
                            <p>This installation page will help you through the steps required to configure your Mlab installation. For some of these steps you have to access the server as root/administrator, others you can do directly from this page.</p>
                            <p>Although this page will guide you through the correct setup, it is expeced that you are familiar with installing and setting up server software and know the basics about domain names, TCP/IP setup, etc.</p>
                        </td>
                    </tr>
                </table>    
                
<!-- First we show instructions for how to install web server, database server, etc -->
                <?php output_table(STEP_CHECK_SOFTWARE, $next_step, 2, "Software and server setup", $fail[STEP_CHECK_SOFTWARE], "Mlab requires various servers, helper programs and libraries to be present to work correctly."); ?>

<!-- Then the permissions required for folders that are NOT created by symfony, we have checked for access in the init() function -->
                <?php output_table(STEP_CHECK_PERMISSIONS, $next_step, 3, "File and directory permissions", $fail[STEP_CHECK_PERMISSIONS], "For Mlab to work correctly, and for this installation page to be able to update settings, you must create the directories indicated below and assign the user <em>$www_user</em> as the owner of the files and directories listed here; and the owner must then have write access to these directories and files. Check the status of the access below and continue when all entries have write access."); ?>
                
<!-- third we get the parameters such as paths etc that we can update, if they are not specified we do not know what folders to check for permissions -->
                <?php output_table(STEP_CHECK_PARAMS, $next_step, 3, "Mlab configuration settings", false, "Mlab uses various settings to let it know where to store files, how to connect to databases etc. Please fill in and verify all the required entries below and save them before going to next step."); ?>

<!-- Then the libs and server versions checks -->
                <?php output_table(STEP_CHECK_DATA, $next_step, 2, "Mlab data", false, "Mlab requires a basic database and a set of templates and components to work correctly. Upload the files containing the data, templates and components below"); ?>

            </form>
        </div>
    </body>
</html>
