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
function flatten_array($array, $prefix = '') {
    
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
                $result[$flat_key] = implode(",", $value);
                
//still not at the end, recurse down
            } else {
                $result = array_merge($result, flatten_array($value, $flat_key));
            }
        } else {
            $result[$flat_key] = $value;
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
            global $params, $params_help, $inputs;
            foreach ($params as $key => $value) {
                echo "<tr>" . 
                         "<td>" . htmlentities($params_help[$key]) . (in_array($key, $inputs) ? " <span style='color: red; '>&nbsp;*</span>" : "") . "</td>" .
                         "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value'></td>" .
                         "<td title='$key'><img src='question.png'></td>" .
                     "</tr>\n";
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
            
            echo "<tr>" . 
                     "<td>" . htmlentities($params_help[$key]) . (in_array($key, $inputs) ? " <span style='color: red; '>&nbsp;*</span>" : "") . "</td>" .
                     "<td><input type='text' name='$key' id='$key' value='$value' data-original-value='$value'></td>" .
                     "<td title='$key'><img src='question.png'></td>" .
                 "</tr>\n";
            break;
    }
}

function output_table($step, $next_step, $colspan, $heading, $failed, $text) {
?>
                <table id="<?php print $step; ?>" <?php if ($next_step == $step ) { ?> style="display: block;" data-current="1" <?php } else { ?> style="display: none;" <?php } ?>>    
                    <thead>
                        <tr class="infobar"><td colspan="<?php print $colspan; ?>"><h3>Step <?php print $step; ?>: <?php print $heading; ?></h3></td></tr>
                        <?php if ($failed) { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p><?php $text; ?></p></td></tr>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><p>All steps are correct here, you can continue to the next step!</p></td></tr>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="move(1)">Continue</button></td></tr>
                        <?php } ?>
                        <tr><td><em>Item</em></td><td><em>Status</em></td></tr>
                    </thead>
                    <tbody>
                        <?php output_table_body($step); ?>
                        <?php if ($failed) { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="window.location.href = 'index.php?next_step=<?php print $step; ?>';" class="error">Retry</button></td></tr>
                        <?php } else { ?>
                            <tr class="infobar"><td colspan="<?php print $colspan; ?>"><button type="button" onclick="move(1)">Continue</button></td></tr>
                        <?php } ?>
                    </tbody>
                </table>    
<?php } ?>