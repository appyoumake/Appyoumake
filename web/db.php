<?php
session_start();
header("Access-Control-Allow-Origin: *");
$server = "localhost";
$user = "root";
$pass = "ntoctomto";
$dbname = "mlab_demo";

extract($_POST);

$conn = mysqli_connect($server, $user, $pass, $dbname);
// Check connection
if (!$conn) {
    die('{"status": "ERROR", "msg": "' . mysqli_error() . '"}');
}


switch ($action) {
    case "login":
        $sql = "SELECT * FROM access WHERE username = '$username' AND password = '$password'";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            $new_token = md5(rand());
            $_SESSION[$new_token] = true;
            echo '{"status": "SUCCESS", "token": "$new_token"}';
        } else {
            echo '{"status": "ERROR", "msg": "' . $conn->error . '"}';
        }
        break;

    case "set":
        //if ($_SESSION[$token]) {
            unset($_POST["action"]);
            $columns = "";
            $values = "";
            foreach ($_POST as $key_name => $data_value) {
                $columns .= "`$key_name`,";
                $values .= '"' . $data_value . '",';
            }
            $columns = rtrim($columns, ",");
            $values = rtrim($values, ",");
            
            $sql = "SELECT * FROM data WHERE `app` = '$app' AND `comp` = '$comp' AND `usr` = '$usr' AND `type` = '$type' AND `key` = '$key'";
            
            $result = $conn->query($sql);
            if ($result->num_rows > 0) {
                $sql = "UPDATE data SET `value` = '$value' WHERE `app` = '$app' AND `comp` = '$comp' AND `usr` = '$usr' AND `type` = '$type' AND `key` = '$key'";
            } else {
                $sql = "INSERT INTO data ($columns) VALUES ($values)";
            }
            if (mysqli_query($conn, $sql)) {
                echo '{"status": "SUCCESS"}';
            } else {
                echo '{"status": "ERROR", "msg": "' . $conn->error . '"}';
            }
        /*} else {
            echo '{"status": 'NOACCESS'}';
        }*/
        break;

    case "update":
        //if ($_SESSION[$token]) {
            $sql = "UPDATE data SET `value` = '$value' WHERE `app` = '$app' AND `comp` = '$comp' AND `usr` = '$usr' AND `type` = '$type' AND `key` = '$key'";

            if (mysqli_query($conn, $sql)) {
                echo '{"status": "SUCCESS"}';
            } else {
                echo '{"status": "ERROR", "msg": "' . $conn->error . '"}';
            }
        /*} else {
            echo '{"status": 'NOACCESS'}';
        }*/
        break;

    case "get":
        //if ($_SESSION[$token]) {
            $sql = "SELECT * FROM data WHERE `app` = '$app' AND `comp` = '$comp' AND `usr` = '$usr' AND `type` = '$type'";
            if (isset($key)) {
                 $sql .= " AND `key` = '$key'";
            }
            
            $result = $conn->query($sql);
            
            
            
            if ($result->num_rows > 0) {
                $results_array = array();
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) {
                    $results_array[] = $row;
                }            
                echo '{"status": "SUCCESS", "data": "' + json_encode($results_array) + '"}';
            } else {
                echo '{"status": "SUCCESS", "data": "[]"}';
                
            }
        /*} else {
            echo '{"status": 'NOACCESS'}';
        }*/
        break;

    default:
        break;
}


mysqli_close($conn);
