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
    if ($conn){
        fclose($conn);
        return true;
    }else{
        return "No connection";
    }   
}

function is_valid_domain_or_ip($domain_name) {
    $dom_ok = (preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $domain_name) //valid chars check
            && preg_match("/^.{1,253}$/", $domain_name) //overall length check
            && preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)   ); //length of each label
    if (!$dom_ok) {
        $dom_ok = preg_match("/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/", $domain_name);
    }
    return $dom_ok;
}

function is_valid_ip($ip) {
    return preg_match("/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/", $ip);
}

function is_valid_port($port) {
    return preg_match("/^(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/");
}

function is_valid_password($pass) {
    return ((preg_match('/^[A-Za-z0-9]{8,20}$/', $pass) &&  
        preg_match('/[A-Z]/', $pass) &&
        preg_match('/[0-9]/', $pass))) ;
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
    foreach ($libs as $lib) { if (!file_exists("web/js/$lib")) { return "Library web/js/$lib not found"; } }
    return true;
}

function libraries_npm() {
    global $data_checks;
    $libs = explode(",", $data_checks["libraries_npm"]["check"]);
    $installed = json_decode(shell_exec("cd _minimal_websocket && npm ls -depth=0 -json=true"));
/*
    {
      "name": "mlab.minimal_websocket.dev",
      "version": "0.0.1",
      "problems": [
        "missing: ws@0.8.0, required by mlab.minimal_websocket.dev@0.0.1"
      ],
      "dependencies": {
        "ws": {
          "required": "0.8.0",
          "missing": true
        }
      }
    }
*/    
    foreach ($libs as $lib) { 
        if ( $installed->dependencies->ws->missing ) { return "NodeJS library $lib not found"; } 
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
    $files = glob($data_checks["assetic_update"]["check"]);
    if (sizeof($files) > 0) {
        foreach($files as $file) {
            if (preg_match('/[0-9]{7,}/', basename($file))) {
                return true;
            }
        }
    }
    return "Assetic file not found in " . $data_checks["assetic_update"]["check"];
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
        } else {
            return "Incorrect number of tables, please verify by comparing database '$mysql_database' with the content of 'web/INSTALL/mlab.sql'.";
        }
    } else {
        return "Database not found or user credentials incorrect";
    }
}

/***
 * Run the four different checks for each page we display
 */
function run_checks($step, $params) {
    global $params_check, $data_checks, $software_version_checks, $write_permissions, $system_path;
    $failed = false;
    $cur_dir = getcwd();
    putenv($system_path);
//here we load the info file which is added to the arrays used to know what to check for
    $info = file("web/INSTALL/info.html", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
                } else {
                    switch ($settings["acceptable"]) {

                        case "EMAIL":
                            $params_check[$key]['result'] = (bool)filter_var($params[$key], FILTER_VALIDATE_EMAIL);
                            break;

                        case "URL":
                            $params_check[$key]['result'] = (bool)is_valid_domain_or_ip($params[$key]);
                            break;

                        case "URL_PORT":
                            $parts = explode(":", $params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_domain_or_ip($parts[0]) && (bool)is_valid_port($parts[0]));
                            break;

                        case "WS_URL_PORT":
                            $parts = explode(":", $params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_domain_or_ip($parts[1]) && (bool)is_valid_port($parts[2]));
                            break;

                        case "HTTP_URL_PORT":
                            $parts = explode(":", $params[$key]);
                            $params_check[$key]['result'] = ((bool)is_valid_domain_or_ip($parts[1]) && (bool)is_valid_port($parts[2]));
                            break;

                        case "RSYNC_URL":
                            $parts = explode(":", $params[$key]);
                            $params_check[$key]['result'] = (bool)is_valid_domain_or_ip($params[$key]);
                            break;

                        case "PORT":
                            $params_check[$key]['result'] = (bool)is_valid_port($params[$key]);
                            break;

                        case "PATH":
                            $params_check[$key]['result'] = (bool)file_exists($params[$key]);
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
            
//TODO: check JS protection, uglify
        case STEP_CHECK_PERMISSIONS:
            global $write_permissions;
            foreach ($write_permissions as $dir => $write_ok) {
                echo "<tr><td>$dir</td><td><img src='" . (!$write_ok ? "fail" : "ok") . ".png'></td></tr>\n";
            }
            break;

        case STEP_CHECK_PARAMS:
            global $params, $params_check, $inputs;
            foreach ($params as $key => $value) {
                echo "<tr>" . 
                         "<td>{$params_check[$key]["label"]}</td>" .
                         "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value'></td>";
                if ($params_check[$key]["result"] === true) {
                    echo "<td><img src='ok.png'></td>";
                } else {
                    echo "<td><img src='fail.png'></td>";
                }    
                echo "</tr>\n";
            }            
            break;

//this will have 3 lines:
//  MySQL version
//  Data import
// template/component import
        case STEP_CHECK_DATA:
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
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p>All steps are correct here, you can continue to the next step!</p></td></tr>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step + 1; ?>';">Continue</button></td></tr>
                        <?php } ?>
                        <tr><td><em>Item</em></td><td><em>Status</em></td></tr>
                    </thead>
                    <tbody>
                        <?php output_table_body($step); ?>
                        <?php if ($failed) { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step + 1; ?>';">Continue</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>    
<?php } ?>