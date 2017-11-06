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
 *      edit parameters.yml
 *      create database (load SQL or use doctrine???) php app/console doctrine:database:create
 */

// EDIT SETTINGS IN config.inc FILE

//include additional files/libraries
    require_once "config.inc";
    require_once "spyc.php"  ;
    require_once "utils.php" ;

//set up the core vairables, the fail array is used to determine if a step has had a failed check
    $www_user = posix_getpwuid(posix_geteuid())['name'];
    $fail = array(false, false, false, false, false);
    $current_step = ($_REQUEST['next_step'] ? intval($_REQUEST['next_step']) : STEP_INTRO);

    chdir("../../");

//--- RUN VARIOUS TASKS (such as storing parameters) IN RESPONSE TO GET REQUESTS ---

//if finished, delete all files
    if (array_key_exists('completed', $_REQUEST) && $_REQUEST['completed'] == 'ALL_OK') {
        die("NOW THE FOLDER WOULD BE DELETED...");
        //rmall("web/INSTALL");
        header("Location: http" . (isset($_SERVER['HTTPS']) ? 's' : '') . "://" . "{$_SERVER['HTTP_HOST']}/");
        return;
    }

//various tasks that can be done from within the installed
    if (array_key_exists('fix', $_REQUEST)) {
        switch ($_REQUEST['fix']) {

    //this will merge the incoming parameters with existing app related values
            case "save_parameters":
    //here we loop through the incoming data and create an array that matches the one from the YAML file
                $incoming_params = array();
                $params_override = array();
                foreach ($_POST as $flat_key => $value) {
                    if (substr($flat_key, 0, 9) == "override_" && $value == 1) {
                        $params_override[substr($flat_key, 9)] = $value;
                    } else {
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
                $current_step = STEP_CHECK_PARAMS;
                break;

    //import the empty database
            case "import_empty_database":
    //get password etc from YAML file
                $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
                $sql = file_get_contents(getcwd() . "/web/INSTALL/mlab_empty.sql");
                $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
                if ($mysqli->connect_errno) {
                    $error = "Database not found or user credentials incorrect: " . $mysqli->connect_error;
                }
                if ($result = $mysqli->query($sql)) {
                    $result->close();
                }
                $current_step = STEP_CHECK_DATA;
                break;

            case "import_templates":
                import_files('template');
                $current_step = STEP_CHECK_DATA;
                break;

            case "import_components":
                import_files('component');
                $current_step = STEP_CHECK_DATA;
                break;

/*            case "assetic_update":
                putenv($system_path);
                $p = trim(shell_exec("app/console --env=prod assetic:dump"));
                $p = trim(shell_exec("app/console --env=dev assetic:dump"));
                $current_step = STEP_CHECK_DATA;
                break;

            case "bootstrap_symfony":
                $p = trim(shell_exec("bin/composer.phar run-script post-update-cmd"));
                $current_step = STEP_CHECK_DATA;
                break;*/
        } //finished with tasks, now display current state
    }
    
//pick up parameters from dist file, then from install file to merge, and finally turn into a flat array
    $params = Spyc::YAMLLoad('app/config/parameters.yml.dist');

//if parameters.yml exists, then we read in the values from that one
    if (file_exists('app/config/parameters.yml')) {
        $params = Spyc::YAMLLoad('app/config/parameters.yml') + $params;
    }
    $params = flatten_array($params, '', array("%mlab_path%"), array(getcwd()) );

    
//step speficic checks, this solves the issue of logically grouping steps, like setting parameters, 
//before doing other steps, like checking permissions of the parameter file.
    switch ($current_step) {
        case (STEP_CHECK_DATA) :
            if (!extension_loaded("mysqli")) {
                die("Installation script requires the 'mysqli' PHP extension to be installed. Install, restart server and try again.");
            }
            break;
        
        case (STEP_CHECK_PERMISSIONS) :
            if (!is_writable("./app/config/parameters.yml")) {
                die("Installation script requires that user <em>$www_user</em> has write access to the file <em>" . getcwd() . "/app/config/parameters.yml</em>. Please set the correct permissions according to your operating system before refreshing this file to continue.");
            }
            break;
        
    }
    
//run the individual tests 
    $fail[$current_step] = run_checks($current_step, $params, $params_override);

?><!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" type="text/css" href="basic.css">
        <meta charset="UTF-8" />
        <title>Mlab installation</title>
    </head>
    <body class="step_<?php print $_REQUEST['next_step']; ?>">
        <div>
            <h1>Mlab installation</h1>
            <p><a href="info.html" target="_new">Click here for complete setup instructions.</a></p>
                <?php 
                    switch ($current_step) {
                        case STEP_INTRO:
                            print '<table id="0">    
                                <tr>
                                    <td>
                                        <p>This installation page will help and verify the tasks required to configure your Mlab installation. For some tasks you have to access the server as root/administrator, other tasks you can do directly from this page.</p>
                                        <p>Although this page will guide you through the correct setup, it is expeced that you are familiar with website setup in general, this includes knowledge about domains/host names/IP addresses and ports; manipulating files, folders and access permissions; issuing commands on the command line and scripts. For specific settings you should refer to the vendors own help pages. This installation page provides links to these where possible.</p>
                                        
                                    </td>
                                </tr>
                                <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = \'index.php?next_step=1\';">Continue</button></td></tr>
                            </table>';
                            break;
                        
//First we show instructions for how to install web server, database server, etc 
                        case STEP_CHECK_SOFTWARE:
                            output_table(STEP_CHECK_SOFTWARE, $current_step, 2, "Software and server setup", $fail[STEP_CHECK_SOFTWARE], "Mlab requires various servers, helper programs and libraries to be present to work correctly.");
                            break;
                        
//Then the permissions required for folders that are NOT created by symfony, we have checked for access in the init() function 
                        case STEP_CHECK_PERMISSIONS:
                            output_table(STEP_CHECK_PERMISSIONS, $current_step, 2, "File and directory permissions", $fail[STEP_CHECK_PERMISSIONS], "For Mlab to work correctly, and for this installation page to be able to update settings, you must create the directories indicated below and assign the user <em>$www_user</em> as the owner of the files and directories listed here; and the owner must then have write access to these directories and files. Check the status of the access below and continue when all entries have write access."); 
                            break;
                
//third we get the parameters such as paths etc that we can update, if they are not specified we do not know what folders to check for permissions 
                        case STEP_CHECK_PARAMS:
                            print "<form action='index.php?fix=save_parameters' method='post' accept-charset='UTF-8' id='parameters'>";
                            output_table(STEP_CHECK_PARAMS, $current_step, 3, "Mlab configuration settings", $fail[STEP_CHECK_PARAMS], "Mlab uses various settings to let it know where to store files, how to connect to databases etc. Please fill in and verify all the required entries below and save them before going to next step."); 
                            print "</form>";
                            break;

//Then the libs and server versions checks
                        case STEP_CHECK_DATA;
                            output_table(STEP_CHECK_DATA, $current_step, 2, "Mlab data", $fail[STEP_CHECK_DATA], "Mlab requires a basic database and a set of templates and components to work correctly. Upload the files containing the data, templates and components below"); 
                            break;
                    }
                ?>
        </div>
    </body>
</html>
