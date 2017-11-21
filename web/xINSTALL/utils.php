<?php

function rmall($dir) { 
    $files = array_diff(scandir($dir), array('.','..')); 
    foreach ($files as $file) { 
      (is_dir("$dir/$file")) ? rmall("$dir/$file") : unlink("$dir/$file"); 
    } 
    return rmdir($dir);
}

/*
 * Clean up the parameters so we keep parents up to the top 
 * 
mlab: 
    convert:
        python_bin: 

    ws_socket:
        url_client: ws://url:8080/
 * Will check if child property is string/number or not, if not it'll recurse until it arrives at final value
 * Also needs to check if the child property is just an array of possible values, in that case we need to stop at current level and store aray as comma delimited string
 */
function flatten_array($array, $prefix = '', $search, $replace) {
    
    $editable_types = array("boolean", "integer", "double", "string");
    $result = array();
    foreach ($array as $key => $value) {
        $flat_key = $prefix . (empty($prefix) ? '' : '__') . $key;

        if (is_array($value)) {
            $test_value = reset($value);
            $first_key = key($value);
            $test = gettype($test_value);

//arrived at the innermost element IF next element is array of editable types and NOT an associative array
            if ($first_key === 0 && in_array($test, $editable_types) ) {
                $result[$flat_key] = str_replace($search, $replace, implode(",", $value));
                
//still not at the end, recurse down
            } else {
                $result = array_merge($result, flatten_array($value, $flat_key, $search, $replace));
            }
        } else {
            $result[$flat_key] = str_replace($search, $replace, $value);
        }
    }
    return $result;
}  

/***
 * Simple helper function to find the version number in a string by splitting by spaces and looking for float value
 */
/***
 * Generic version checker, command line is in the parameter, picked up from 
 */
function check_version($check_info) {
    if (isset($check_info["value"])) {
        $v = $check_info["value"];
    } else {
        $v = shell_exec($check_info["exec"]);
    }
    $info = explode(" ", $v);
    foreach ($info as $value) {
        $value = preg_replace('/[^0-9,.-]/','',$value); 
        if (floatval(trim($value))) {
            if (version_compare(trim($value), $check_info["check"], ">=")) {
                return true;
            } else {
                return "Version " . trim($value) . " installed, requires {$check_info["check"]}";
            }
        }
    }
}

function internet_present() {
    $conn = @fsockopen("www.google.com", 80);
    if ($conn) {
        fclose($conn);
        return true;
    } else {
        return "No connection";
    } 
}

//checks for regularly formatted domain ammes, app addresses + local domain names that can be anything (using gethostbyname($domain_name))
function is_valid_domain_or_ip($domain_name) {
    $dom_ok = (preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $domain_name) //valid chars check
            && preg_match("/^.{1,253}$/", $domain_name) //overall length check
            && preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)   ); //length of each label
    if (!$dom_ok) {
        $dom_ok = preg_match("/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/", $domain_name);
    }
    if (!$dom_ok) {
        print $domain_name;
        die(gethostbyname($domain_name));
        $dom_ok = gethostbyname($domain_name);
    }
    return $dom_ok;
}

function is_valid_ip($ip) {
    return preg_match("/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/", $ip);
}

function is_valid_port($port) {
    return (int)$port > 0 && (int)$port <= 65535;
}

function is_valid_password($pass) {
    return ((preg_match('/^[A-Za-z0-9]{8,20}$/', $pass) &&  
        preg_match('/[A-Z]/', $pass) &&
        preg_match('/[0-9]/', $pass))) ;
}

function is_valid_protocol($prot, $valid_prot) {
    return  $prot == $valid_prot || $prot == ($valid_prot . "s");
}


function timezone_php_ini() {
    global $software_version_checks;
    $setting = ini_get($software_version_checks["timezone_php_ini"]["check"]);
    if (trim($setting)) {
        return true;
    } else {
        return $software_version_checks["timezone_php_ini"]["check"] . " set to '" . $setting . "' in file " . php_ini_loaded_file();
    }
}

function libraries_php() {
    global $software_version_checks;
    $libs = explode(",", $software_version_checks["libraries_php"]["check"]);
    foreach ($libs as $lib) { if (!extension_loaded($lib)) { return "PHP extension $lib not present"; } }
    return true;
}

function libraries_symfony() {
    global $system_path;
    $required_libs = array();
    $missing_libs = array();

    putenv($system_path);
    putenv("COMPOSER_HOME=" . getcwd() . "/bin/");

    $temp_libs = json_decode(file_get_contents('composer.lock'), true)["packages"];
    foreach ($temp_libs as $lib) {
        $required_libs[] = $lib["name"];
    }

    $temp_libs = explode("\n", shell_exec("./bin/composer.phar show"));
    foreach($temp_libs as $lib) {
        $installed_lib = strtok($lib, ' ');
        if ($installed_lib && !in_array($installed_lib, $required_libs)) {
            $missing_libs[] = $installed_lib;
        }
    }
    
    if(!empty($missing_libs)) {
        return "Missing symfony libraries: " . implode(", ", $missing_libs);
    }
    return true;
}

function version_mysql() {
    global $software_version_checks;
    $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
    if ($mysqli->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    $software_version_checks["version_mysql"]["value"] = $mysqli->server_info;
    //$info = str_replace("version", "", $info);
    return check_version($software_version_checks["version_mysql"]);
}

function libraries_js() {
    global $data_checks;
    $libs = explode(",", $data_checks["libraries_js"]["check"]);
    foreach ($libs as $lib) { if (!file_exists("web/js/$lib") && !file_exists("./src/Sinett/MLAB/BuilderBundle/Resources/public/js/$lib")) { return "Library web/js/$lib not found"; } }
    return true;
}

function libraries_npm() {
    global $software_version_checks;
    $libs = explode(",", $software_version_checks["libraries_npm"]["check"]);
    $installed = json_decode(shell_exec("cd _minimal_websocket && npm ls -depth=0 -json=true"), true);
    foreach ($libs as $lib) { 
        if (array_key_exists($lib, $installed["dependencies"]) && array_key_exists("missing", $installed["dependencies"][$lib])) {
            if ( $installed["dependencies"][$lib]["missing"] ) { return "NodeJS library $lib not found"; } 
        }
    }
    return true;
}



function bootstrap_symfony() {
    global $data_checks;
    if (file_exists($data_checks["bootstrap_symfony"]["check"])) {
        return true;
    } else {
        return "File " . $data_checks["bootstrap_symfony"]["check"] . " not found";
    }
}

function assetic_update() {
    global $data_checks;
    $passed = false;
    $files = glob($data_checks["assetic_update"]["check"]);
    if (sizeof($files) > 0) {
//check if assetic files hve been generatd, should do this when run "composer install"
        foreach($files as $file) {
            if (preg_match('/[0-9]{7,}/', basename($file))) {
                $passed = true;
            }
        }
//now we check that no MLAB Javascript files are directly accessible
        foreach($files as $file) {
            if (preg_match('/mlab.*\.js/', basename($file))) {
                $passed = "One or more Mlab Javascript files found in " . getcwd() . "/" . dirname($data_checks["assetic_update"]["check"]) . ". These files must NOT be directly accessible to download.";
            }
        }
        return $passed;
    }
    return "Assetic file not found in " . getcwd() . "/" . dirname($data_checks["assetic_update"]["check"]);
}

//checking to see if the database exists and if the relevant tables have been created
function import_empty_database() {
    global $data_checks;
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
        if ($info["num_tables"] >= $data_checks["import_empty_database"]["check"]) {
            return true;
        } else if ($info["num_tables"] == 0) {
            return "Empty database, import Mlab data manually following the instructions below.";
        } else {
            return "Incorrect number of tables, please verify by comparing database '" . $existing_params[database_name] . "' with the content of 'web/INSTALL/mlab.sql'.";
        }
    } else {
        return "Database not found or user credentials incorrect";
    }
}

//checking to see if a template has been added
function import_templates() {
    global $data_checks;
//get password etc from YAML file
    $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
    if ($mysqli->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    $sql = "SELECT count(*) AS num_templates FROM template";
    if ($result = $mysqli->query($sql)) {
        $info = $result->fetch_array(MYSQLI_ASSOC);
        $result->close();
        if ($info["num_templates"] >= $data_checks["import_templates"]["check"]) {
            return true;
        } else {
            return 'To use Mlab you need at least one template. If you have one or more templates available as a ZIP file you can upload this file now. <form action="index.php?fix=import_templates" method="post" accept-charset="UTF-8" enctype="multipart/form-data"><input type="file" name="mlab_upload" accept=".zip"><input type="submit"></form>';
        }
    } else {
        return "Problem connecting to the database.";
    }
}

//checking to see if one or more components has been added
function import_components() {
    global $data_checks;
//get password etc from YAML file
    $existing_params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $mysqli = new mysqli($existing_params["database_host"], $existing_params["database_user"], $existing_params["database_password"], $existing_params["database_name"]);
    if ($mysqli->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    $sql = "SELECT count(*) AS num_components FROM component";
    if ($result = $mysqli->query($sql)) {
        $info = $result->fetch_array(MYSQLI_ASSOC);
        $result->close();
        if ($info["num_components"] >= $data_checks["import_components"]["check"]) {
            return true;
        } else {
            return 'To use Mlab you need at least one component. If you have one or more components available as a ZIP file you can upload this file now. <form action="index.php?fix=import_components" method="post" accept-charset="UTF-8" enctype="multipart/form-data"><input type="file" name="mlab_upload" accept=".zip"><input type="submit"></form>';
        }
    } else {
        return "Database not found or user credentials incorrect";
    }
}

/**
 * Simple function to import template and component uploads
 * IP file can be one or more folders, always with top level dir included!
 * @param type $type
 * @param type $upload_data
 * @return type
 */
function import_files($type) {
    $file_info = $_FILES["mlab_upload"];
//check if a valid file has been uploaded
    if ( !$file_info || $file_info["error"] ) {
        die("Unable to process file, make sure you selected a valid file before trying to upload.");
    }
//load parameters, at this point we can assume it is kosher
    $params = Spyc::YAMLLoad('app/config/parameters.yml')["parameters"];
    $unzip_path = $params["mlab"]["paths"][$type];
    $locale = $params["locale"];
    $order_by_counter = 1;
    $db_conn = new mysqli($params["database_host"], $params["database_user"], $params["database_password"], $params["database_name"]);
    if ($db_conn->connect_errno) {
        return "Database not found or user credentials incorrect: " . $mysqli->connect_error;
    }
    
    $zip = new ZipArchive();
    $res = $zip->open($file_info["tmp_name"]);
    if (!$zip->extractTo($unzip_path)) {
// clean up the file property, not persisted to DB
        $zip->close();
        return "Unable to unzip $type to $unzip_path";
    }
    $zip->close();

//pick up IDs of all the groups that exists so we can create acces records for all of them
    $sql = "SELECT id FROM grp";
    if ($result = $db_conn->query($sql)) {
        $group_ids = $result->fetch_all(MYSQLI_ASSOC);
    }
    
//now loop through all the folders in the directory and populate the database
    $fields = array("tooltip" => "description", "name" => "name", "version" => "version");
    $data = array();
    foreach (new DirectoryIterator($unzip_path) as $dir) {
        if($dir->isDot()) continue;
        
//only add if not already in DB
        $existing = false;
        $sql = "SELECT count(*) AS num FROM $type WHERE path = '" . $dir->getFilename() . "'";
        if ($result = $db_conn->query($sql)) {
            $existing = $result->fetch_array(MYSQLI_ASSOC)["num"];
//            $existing = $info["exists"];
            $result->close();
        }
        if (!$existing) {
            $dir_name = $dir->getPathname();
            if ( file_exists($dir_name . "/conf.yml") ) {
                $temp = Spyc::YAMLLoad($dir_name . "/conf.yml");
                foreach ($fields as $yml_field => $db_field) {
                     if (isset($temp[$yml_field])) {
                        if (is_array($temp[$yml_field])) {
                            if (isset($temp[$yml_field][$locale])) {
                                $data[$db_field] = $temp[$yml_field][$locale];
                            }
                        } else {
                            $data[$db_field] = $temp[$yml_field];
                        }
                    }
                }
                $data["path"] = $dir->getFilename();
                $data["enabled"] = 1;
                if ($type == "component") {
                    $data["order_by"] = $order_by_counter;
                    $order_by_counter++;
                }
                $field_names = implode(",", array_keys($data));
                $field_values = implode("','", array_values($data));
                $sql = "INSERT INTO $type ($field_names) VALUES ('$field_values')";

                if ($db_conn->query($sql) !== TRUE) {
                    return "Unable to add $type data";
                }

    //now loop through the list of group ids and make sure all have access to the added template/component
                $entity_id = $db_conn->insert_id;
                foreach ($group_ids as $row) {
                    if ($type == "template") {
                        $sql = "INSERT INTO {$type}s_groups ({$type}_id, group_id) VALUES ($entity_id, $row[id]);" .
                               "INSERT INTO {$type}s_groups_data ({$type}_id, group_id, access_state) VALUES ($entity_id, $row[id], 3);";
                    } else {
                        $sql = "INSERT INTO {$type}s_groups ({$type}_id, group_id, access_state) VALUES ($entity_id, $row[id], 3);";
                    }
                    if ($db_conn->multi_query($sql) !== TRUE) {
                        return "Unable to give group access to $type";
                    }                
                }
            } //end for loop through directory
        } //end check if already exists
    }

}

/***
 * Run the four different checks for each page we display
 */
function run_checks($step, $params, $params_override) {
    global $params_check, $data_checks, $software_version_checks, $write_permissions, $permissions_info, $system_path;
    $failed = false;
    $cur_dir = getcwd();
    putenv($system_path);
//here we load the info file which is added to the arrays used to know what to check for
    $info = file(__DIR__ . "/info.html", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $info = str_replace("{%php.ini%}", php_ini_loaded_file(), $info);
    
//different steps have different set of checks, some are simple loops to check writable permissions, others have individual checks for different tasks
    switch ($step) {
        case STEP_CHECK_SOFTWARE:
            foreach ($software_version_checks as $key => $value) {
                if (function_exists($software_version_checks[$key]["function"])) {
                    eval("\$software_version_checks['" . $key . "']['result'] = " . $software_version_checks[$key]["function"] . "(\$value);");
                } else {
                    $software_version_checks[$key]['result'] = false;
                }
                if (!$failed && $software_version_checks[$key]['result'] !== true) {
                    $failed = true;
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
            return $failed;
            break;
            

//we check acceptable settings for the parameters.yml settings, done through the use of some contants or regex
        case STEP_CHECK_PARAMS:
            foreach ($params_check as $key => $settings) {
                if ($settings["null"] && empty($params[$key])) {
                    $params_check[$key]['result'] = true;
                } else if ($params_override[$key]) {
                    $params_check[$key]['result'] = true;
                } else {
                    switch ($settings["acceptable"]) {

                        case "EMAIL":
                            $params_check[$key]['result'] = (bool)filter_var($params[$key], FILTER_VALIDATE_EMAIL);
                            break;

                        case "URL":
                            $params_check[$key]['result'] = (bool)is_valid_domain_or_ip($params[$key]);
                            break;

                        case "URL_PORT":
                            $parts = parse_url($params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_domain_or_ip($parts["host"]) && (bool)is_valid_port($parts["port"]));
                            break;

                        case "WS_URL_PORT":
                            $parts = parse_url($params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_protocol($parts["scheme"], "ws") && (bool)is_valid_domain_or_ip($parts["host"]) && (bool)is_valid_port($parts["port"]));
                            break;

                        case "HTTP_URL_PORT":
                            $parts = parse_url($params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_protocol($parts["scheme"], "http") && (bool)is_valid_domain_or_ip($parts["host"]) && (bool)is_valid_port($parts["port"]));
                            break;

                        case "RSYNC_URL":
                            $user = strtok($params[$key], "@:");
                            $domain = strtok("@:");
                            $dir = strtok("@:");
                            $params_check[$key]['result'] = (strlen($user) > 0 && (bool)is_valid_domain_or_ip($domain) && strlen($dir) > 0);
                            break;

                        case "PORT":
                            $params_check[$key]['result'] = (bool)is_valid_port($params[$key]);
                            break;
//add trailing slashes here
                        case "PATH":
                            $params_check[$key]['result'] = (bool)file_exists($params[$key]);
                            if ($params_check[$key]['result'] && is_dir($params[$key]) && substr($params[$key], -1) != "/") {
                                $params[$key] = $params[$key] . "/";
                            }
                            break;

                        case "LOCALPATH":
                            $params_check[$key]['result'] = (bool)file_exists("./web" . $params[$key]);
                            break;

                        case "PASSWORD":
                            $params_check[$key]['result'] = (bool)is_valid_password($params[$key]);
                            break;

                        default:
                            $params_check[$key]['result'] = (bool)preg_match("/" . $settings["acceptable"] . "/", $params[$key]);
                            break;

                    }
                }
                if (!$failed && !$params_check[$key]['result']) {
                    $failed = true;
                }            
            }
            
            return $failed;
            break;
        
//we have an array of URLs that we need to access, check that they match the web server user access
        case STEP_CHECK_PERMISSIONS:
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
            
//load in help text
                $update_help = false;
                $permissions_info = '';
                foreach ($info as $line) {
                    if (!$update_help && $line == "<!--directories-->") {
                        $update_help = true;
                    } else if ($update_help) {
                        if ($line == "<!--/directories-->") {
                            $update_help = false;
                        } else {
                            $permissions_info .= $line;
                        }
                    } 
                }
            return in_array(false, $write_permissions);
            break;
        
//the final check is to see
//a: if we are running the right mysql version
//b: whether data has been loaded into the database, 
//c: if there are no components or templates in the relevant folders 
//d: if Javascript protection is in place
        
       case STEP_CHECK_DATA:
            foreach ($data_checks as $key => $value) {
                if (function_exists($key)) {
                    eval("\$data_checks['" . $key . "']['result'] = " . $key . "(\$value);");
                } else {
                    $data_checks[$key]['result'] = $data_checks[$key]['help'];
                }
                if (!$failed && $data_checks[$key]['result'] !== true) {
                    $failed = true;
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
            return $failed;
            break;
    }
}

function output_table_body($step) {
    switch ($step) {
        case STEP_CHECK_SOFTWARE:
            global $software_version_checks;
            foreach ($software_version_checks as $key => $value) {
                if ($value["result"] === true) {
                    echo "<tr><td>$value[label]</td><td><img src='ok.png'></td></tr>\n";
                } else {
                    echo "<tr><td><details><summary>$value[label]</summary><p>Error: $value[result]<hr>$value[action]</p></details></td><td><img src='fail.png'></td></tr>\n";
                }
            }
            break;
            
        case STEP_CHECK_PERMISSIONS:
            global $write_permissions, $permissions_info;
            foreach ($write_permissions as $dir => $write_ok) {
                if ($write_ok) {
                    print "<tr><td>$dir</td><td><img src='ok.png'></td></tr>\n";
                } else {
                    print "<tr><td><details><summary>$dir</summary><div>Error: Does not exist or is not writable by web server<hr>$permissions_info</div></details></td><td><img src='fail.png'></td></tr>\n";
                }
            }
            break;

        case STEP_CHECK_PARAMS:
            global $params, $params_check, $inputs;
            $h = "";
            foreach ($params as $key => $value) {
                 if ($h != $params_check[$key]["header"]) {
                    echo "<tr>" . 
                         "<td colspan=3 class='param_heading'>{$params_check[$key]["header"]}</td>" .
                         "</tr>\n" .
                         "<tr><td><em>Item</em></td><td><em>Setting</em></td><td><em>Status</em></td></tr>";
                 }

                if ($params_check[$key]["result"] === true) {
                    echo "<tr>" . 
                         "<td>{$params_check[$key]["label"]}</td>" .
                         "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value'></td>" .
                         "<td><img src='ok.png'></td>" . 
                         "</tr>\n";
                } else {
                    echo "<tr>" . 
                         "<td>{$params_check[$key]["label"]}</td>" .
                         "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value' >" .
                         "<input type='checkbox' name='override_$key' id='override_$key' value='1' class='override'><label for='override_$key' class='override'>Override check</label></td>" .
                         "<td><img src='fail.png'></td>" . 
                         "</tr>\n";
                }    
                $h = $params_check[$key]["header"];
            }            
            break;

//check stuff that has to happen after config & permissions set, such as data import
        case STEP_CHECK_DATA:
            global $data_checks;
            foreach ($data_checks as $key => $value) {
                if ($value["result"] === true) {
                    echo "<tr><td>$value[label]</td><td><img src='ok.png'></td></tr>\n";
                } else {
                    echo "<tr><td><details><summary>$value[label]</summary><p>Error: $value[result]<hr>$value[action]</p></details></td><td><img src='fail.png'></td></tr>\n";
                }
            }
            break;
    }
}

function output_table($step, $current_step, $colspan, $heading, $failed, $text) {
?>
    <table>    
        <thead>
            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><h3>Step <?php print $step; ?>: <?php print $heading; ?></h3></td></tr>
            <?php if ($failed) { ?>
                <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p><?php $text; ?></p></td></tr>
                <?php if ($step == STEP_CHECK_PARAMS) { // button must submit form, not go to next page  ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="document.getElementById('parameters').submit();" class="error">Retry</button></td></tr>
                <?php } else { ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                <?php }  ?>

            <?php } else { ?>
                <?php if ($step == STEP_CHECK_DATA) { // button must say finish, this will delete install dir   ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p>All steps are correct, when you click 'Finish' the install folder will be removed and you will be forwarded to Mlab.</p></td></tr>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?completed=ALL_OK';">Finish</button></td></tr>
                <?php } else { ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p>All steps are correct here, you can continue to the next step!</p></td></tr>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step + 1; ?>';">Continue</button></td></tr>
                <?php }  ?>
            <?php } ?>

            <tr><td><em>Item</em></td><?php if ($colspan > 2) { ?><td><em>Setting</em></td><?php }; ?><td><em>Status</em></td></tr>
        </thead>
        <tbody>
            <?php output_table_body($step); ?>
            <?php if ($failed) { ?>
                <?php if ($step == STEP_CHECK_PARAMS) { // button must submit form, not go to next page ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="document.getElementById('parameters').submit();" class="error">Retry</button></td></tr>
                <?php } else { ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                <?php }  ?>
            <?php } else { ?>
                <?php if ($step == STEP_CHECK_DATA) { // button must say finish, this will delete install dir   ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?completed=ALL_OK';">Finish</button></td></tr>
                <?php } else { ?>
                    <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step + 1; ?>';">Continue</button></td></tr>
                <?php }  ?>
            <?php } ?>
        </tbody>
    </table>    
<?php } ?>