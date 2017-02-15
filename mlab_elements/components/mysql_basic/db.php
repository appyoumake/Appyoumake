<?php

//EXTREMELY simple backend to demonstrate the MySQL storage plugin

session_start();
header("Access-Control-Allow-Origin: *");
$server = "localhost";
$user = "";
$pass = "";
$dbname = "mlab_demo_storage";

extract($_POST);

$conn = mysqli_connect($server, $user, $pass, $dbname);
// Check connection
if (!$conn) {
    die('{"status": "ERROR", "msg": "' . str_replace(array('"', "'"), "", mysqli_error()) . '"}');
}


switch ($action) {
    case "login":
        $sql = "SELECT * FROM access WHERE username = '$username' AND password = '$password'";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            $new_token = md5(rand());
            $_SESSION[$new_token] = true;
            echo '{"status": "SUCCESS", "token": "' . $new_token . '"}';
        } else {
            echo '{"status": "ERROR", "msg": "' . str_replace(array('"', "'"), "", $conn->error) . '"}';
        }
        break;

    case "set":
        if ($_SESSION[$token]) {
            $columns = rtrim($columns, ",");
            $values = rtrim($values, ",");
            
            $sql = "SELECT * FROM data WHERE `app` = '$app' AND `comp` = '$comp' AND `dev` = '$dev' AND `type` = '$type' AND `key` = '$key'";
            
            $result = $conn->query($sql);
            if ($result->num_rows > 0) {
                $sql = "UPDATE data SET `value` = '$value' WHERE `app` = '$app' AND `comp` = '$comp' AND `dev` = '$dev' AND `type` = '$type' AND `key` = '$key'";
            } else {
                $val = addslashes($value);
                $sql = "INSERT INTO data (`app`, `comp`, `dev`, `type`, `key`, `value`) VALUES ('$app', '$comp', '$dev', '$type', '$key', '$val')" ;
            }
            if (mysqli_query($conn, $sql)) {
                echo '{"status": "SUCCESS"}';
            } else {
                echo '{"status": "ERROR", "msg": "' . str_replace(array('"', "'"), "", $conn->error) . '", "sql": "' . $sql . '"}';
            }
        } else {
            echo '{"status": "NOACCESS"}';
        }
        break;

    case "update":
        if ($_SESSION[$token]) {
            $sql = "UPDATE data SET `value` = '$value' WHERE `app` = '$app' AND `comp` = '$comp' AND `dev` = '$dev' AND `type` = '$type' AND `key` = '$key'";

            if (mysqli_query($conn, $sql)) {
                echo '{"status": "SUCCESS"}';
            } else {
                echo '{"status": "ERROR", "msg": "' . str_replace(array('"', "'"), "", $conn->error) . '"}';
            }
        } else {
            echo '{"status": "NOACCESS"}';
        }
        break;

    case "get":
        if ($_SESSION[$token]) {
            $sql = "SELECT `key`, `value` FROM data WHERE `app` = '$app' AND `comp` = '$comp' AND `dev` = '$dev' AND `type` = '$type'";
            if (isset($key)) {
                 $sql .= " AND `key` = '$key'";
            }
            
            $result = $conn->query($sql);
            
            
            if ($result->num_rows == 1) {
                $result = $conn->query($sql);
                $row = $result->fetch_assoc();
                $row["value"] = stripslashes($row["value"]);
                echo '{"status": "SUCCESS", "data": ' . json_encode(array($row["key"] => $row["value"])) . '}';
            } else if ($result->num_rows > 1) {
                $results_array = array();
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) {
                    $results_array[$row["key"]] = stripslashes($row["value"]);
                }            
                echo '{"status": "SUCCESS", "data": ' . json_encode($results_array) . '}';
            } else {
                echo '{"status": "SUCCESS", "data": "[]"}';
                
            }
        } else {
            echo '{"status": "NOACCESS"}';
        }
        break;

    default:
        break;
}


mysqli_close($conn);
