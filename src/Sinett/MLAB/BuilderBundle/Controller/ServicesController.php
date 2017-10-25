<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Functions here are all for backend communication with the compiler and app market services
 * There is no GUI, just AJAX calls with JSON data sent back and forth, with calls being made to servers
 * hosting the two services.
 */



namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\Component;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

use Symfony\Component\Yaml\Parser;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\HttpFoundation\Response;
use ZipArchive;



class ServicesController extends Controller
{
    
    private function hybi10Decode($data)
    {
        if ($data == "") {
            return "";
        }
        $bytes = $data;
        $dataLength = '';
        $mask = '';
        $coded_data = '';
        $decodedData = '';
        $secondByte = sprintf('%08b', ord($bytes[1]));
        $masked = ($secondByte[0] == '1') ? true : false;
        $dataLength = ($masked === true) ? ord($bytes[1]) & 127 : ord($bytes[1]);

        if($masked === true)
        {
            if($dataLength === 126)
            {
               $mask = substr($bytes, 4, 4);
               $coded_data = substr($bytes, 8);
            }
            elseif($dataLength === 127)
            {
                $mask = substr($bytes, 10, 4);
                $coded_data = substr($bytes, 14);
            }
            else
            {
                $mask = substr($bytes, 2, 4);       
                $coded_data = substr($bytes, 6);        
            }   
            for($i = 0; $i < strlen($coded_data); $i++)
            {       
                $decodedData .= $coded_data[$i] ^ $mask[$i % 4];
            }
        }
        else
        {
            if($dataLength === 126)
            {          
               $decodedData = substr($bytes, 4);
            }
            elseif($dataLength === 127)
            {           
                $decodedData = substr($bytes, 10);
            }
            else
            {               
                $decodedData = substr($bytes, 2);       
            }       
        }   

        return $decodedData;
    }


    private function hybi10Encode($payload, $type = 'text', $masked = true) {
        $frameHead = array();
        $frame = '';
        $payloadLength = strlen($payload);

        switch ($type) {
            case 'text':
                // first byte indicates FIN, Text-Frame (10000001):
                $frameHead[0] = 129;
                break;

            case 'close':
                // first byte indicates FIN, Close Frame(10001000):
                $frameHead[0] = 136;
                break;

            case 'ping':
                // first byte indicates FIN, Ping frame (10001001):
                $frameHead[0] = 137;
                break;

            case 'pong':
                // first byte indicates FIN, Pong frame (10001010):
                $frameHead[0] = 138;
                break;
        }

        // set mask and payload length (using 1, 3 or 9 bytes)
        if ($payloadLength > 65535) {
            $payloadLengthBin = str_split(sprintf('%064b', $payloadLength), 8);
            $frameHead[1] = ($masked === true) ? 255 : 127;
            for ($i = 0; $i < 8; $i++) {
                $frameHead[$i + 2] = bindec($payloadLengthBin[$i]);
            }

            // most significant bit MUST be 0 (close connection if frame too big)
            if ($frameHead[2] > 127) {
                $this->close(1004);
                return false;
            }
        } elseif ($payloadLength > 125) {
            $payloadLengthBin = str_split(sprintf('%016b', $payloadLength), 8);
            $frameHead[1] = ($masked === true) ? 254 : 126;
            $frameHead[2] = bindec($payloadLengthBin[0]);
            $frameHead[3] = bindec($payloadLengthBin[1]);
        } else {
            $frameHead[1] = ($masked === true) ? $payloadLength + 128 : $payloadLength;
        }

        // convert frame-head to string:
        foreach (array_keys($frameHead) as $i) {
            $frameHead[$i] = chr($frameHead[$i]);
        }

        if ($masked === true) {
            // generate a random mask:
            $mask = array();
            for ($i = 0; $i < 4; $i++) {
                $mask[$i] = chr(rand(0, 255));
            }

            $frameHead = array_merge($frameHead, $mask);
        }
        $frame = implode('', $frameHead);
        // append payload to frame:
        for ($i = 0; $i < $payloadLength; $i++) {
            $frame .= ($masked === true) ? $payload[$i] ^ $mask[$i % 4] : $payload[$i];
        }

        return $frame;
    }
    
    private function getUrlContent($url) {
        //create stream context to retrieve data
        list($protocol) = explode("/", $url);
        if (!$protocol) {
            $protocol = "http";
        }
        
        $opt = array(
            CURLOPT_URL => $url, 
            CURLOPT_CONNECTTIMEOUT => 2, 
            CURLOPT_RETURNTRANSFER => 1, 
            CURLOPT_USERAGENT => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:50.0) Gecko/20100101 Firefox/50.0',
            CURLOPT_MAXREDIRS => 1,
            CURLOPT_FRESH_CONNECT => true,
            CURLOPT_FORBID_REUSE => true
            );
            
        $curl_handle = curl_init();
        curl_setopt_array($curl_handle, $opt);
        $result = curl_exec($curl_handle);
        curl_close($curl_handle);
        return $result;
    }
    
    /**
     * This function uses basic PHP socket functions to send a message to the web socket server where the 
     * front end Javascript is listening to messages from the compilation services
     * @param type $msg (must contain destination_id, this is the uid of the window that is being updated, so for example 
     *                  '{"destination_id": "' . $window_uid . '", "state": "completed", "checksum": "' . $app_checksum . '"}')
     * @param type $config
     * Solution to connection issue from https://forum.ripple.com/viewtopic.php?f=2&t=6171&p=43313&f=2&t=6171&p=43313#p43313
     */
    private function sendWebsocketMessage($msg, $config) {
        
//prepare variables
        $url = $config["ws_socket"]["url_server"];
        $path = $config["ws_socket"]["path_server"] . "0";
        list($dummy, $host, $port) = explode(":", $url);
        $port = intval($port);
        $host = substr($host, 2);
        if ( in_array("HTTPS", $_SERVER) && $_SERVER["HTTPS"] ) {
            $proto = "https://";
        } else {
            $proto = "http://";
        }
        
        $local = $proto . $_SERVER["HTTP_HOST"] . ":" . $_SERVER["SERVER_PORT"];  //url where this script run
        $head = "GET $path HTTP/1.1"."\r\n" .
                "Upgrade: WebSocket"."\r\n" .
                "Connection: Upgrade"."\r\n" .
                "Origin: $local"."\r\n" .
                "Host: $host"."\r\n" .
                "Sec-WebSocket-Version: 13"."\r\n".
                "Sec-WebSocket-Key: asdasdaas76da7sd6asd6as7d"."\r\n".
                "Content-Length: " . strlen($msg) . "\r\n" . "\r\n" ;

//WebSocket handshake & data transmission
        try {
            $sock = @fsockopen($host, $port, $errno, $errstr, 2);
            if (!$sock) {
                return false;
            }
            fwrite($sock, $head ) or die('error:'.$errno.':'.$errstr);
            $headers = fread($sock, 2000);
            fwrite($sock, $this->hybi10Encode($msg) ) or die('error:'.$errno.':'.$errstr);
            $wsdata = fread($sock, 2000);  //receives the data included in the websocket package "\x00MSG\xff"
            fclose($sock);
            return $this->hybi10Decode($wsdata);
        } catch (Exception $e) {
            return false;
        }
    }


    public function updateMlabRuntimeVariables() {
        
    }
    
    public function mktGetTaggedUsersAction($token, $tag) {
    }

    public function mktSubmitAppDetailsAction($app_details) {
    }

    public function mktUploadAppFileAction($token, $app_id, $replace_existing) {
    }

    public function mktPublishAppAction($token, $app_id, $version) {
    }

    public function mktUnpublishAppAction($token, $app_id, $version, $action) {
    }

    public function mktLoginAction($username, $password) {
    }

    public function mktCreateUserAction($token, $user_details) {
    }

    public function mktGetNewUsersAction($token) {
    }

    public function mktSetUserStateAction($token, $app_id, $state) {
    }

    public function mktSetTaggedUsersStateAction($token, $tag, $state) {
    }

//---Internal functions that contain code for externally exposed callback functions---
    
/**
 * Generic function to invoke a remote API function on server, passphrase is added in this function
 * @param type $config
 * @param type $window_uid
 * @param type $status
 * @param type $service
 * @param type $parameters
 * @param type $func_name
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    private function cmpCallRemoteFunction($config, $window_uid, $status, $service, $parameters, $func_name) {
        $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "' . $status . '"}}', $config), true);
        if ($res_socket["data"]["status"] != "SUCCESS") { 
            return new JsonResponse(array('result' => 'error', 'msg' => $res_socket["data"]["error"])); 
        }

        $protocol = $config[$service]["protocol"];
        $url = $config[$service]["url"];
        
//generate the parameter string for the URL
        $params = "";
        foreach ($parameters as $key => $value) {
            $params .= urlencode($key) . "=" . urlencode($value) . "&";
        }
        
//add passphrase, used to see that we are allowed to talk to remote PC
        $params .= "passphrase=" . urlencode($config['compiler_service']["passphrase"]);
        $url = "$protocol://$url/$func_name?$params";
        
        error_log(">> Calling remote function: " . $url);

        return $this->getUrlContent($url);
    }
    
//run rsync, we need to "store" the password in the environment variable, then run the command using shell_exec
//this is done in two rounds, first without the config file, icon file and splash screen, and then afterwards only with these files
    private function cmpUploadFiles($from_path, $window_uid, $app_uid, $app_version, $config) {
        error_log("  > cmpUploadFiles");
        $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "uploading"}}', $config), true);
        if ($res_socket["data"]["status"] != "SUCCESS") {
            return new JsonResponse(array('result' => 'error'));
        }

        putenv("RSYNC_PASSWORD=" . $config['compiler_service']['rsync_password']);
        
        $to_path = "{$config['compiler_service']['rsync_url']}/$app_uid/$app_version/{$config['compiler_service']['rsync_suffix']}";
        while (substr($to_path, -1) == "/") {
            $to_path = substr($to_path, 0, strlen($to_path) - 1);
        }
        $rsync_cmd = $config['compiler_service']['rsync_bin'] . " -v -L -r --delete --exclude /{$config['filenames']['app_config']} --exclude /{$config['filenames']['app_icon']} --exclude /{$config['filenames']['app_splash_screen']}* $from_path/ $to_path";
        $res_rsync = shell_exec($rsync_cmd);
        
        $to_path = "{$config['compiler_service']['rsync_url']}/$app_uid/$app_version";
        $rsync_cmd = $config['compiler_service']['rsync_bin'] . " -v -L \"$from_path/{$config['filenames']['app_config']}\" \"$from_path/{$config['filenames']['app_icon']}\" \"$from_path\"/{$config['filenames']['app_splash_screen']}.* $to_path";
        $res_rsync = shell_exec($rsync_cmd);
        
        return true;
    }
    
/**
 * Uses the compiler services' getAppStatus API call to get info about one or more apps
 * Unlike other compiler functions, this is NOT async, so we wait for answer
 * @param type $app_id
 * @param type $app_version
 * @param type $platform
 * @return type
 */
    private function cmpGetAppStatus($app_id = NULL, $app_version = NULL, $platform = NULL) {
        error_log("  > cmpGetAppStatus");
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $passphrase = urlencode($config["compiler_service"]["passphrase"]);
        $protocol = $config["compiler_service"]["protocol"];
        $url = $protocol . "://" . $config["compiler_service"]["url"] . "/getAppStatus?passphrase=" . urlencode($passphrase);

        if ($app_id != NULL) {
            $em = $this->getDoctrine()->getManager();
            $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (is_null($app)) {
                return new JsonResponse(array('result' => 'error', 'message' => $this->get('translator')->trans('servicesController.msg.unable.retrieve.db.entry') . ': ' . $app_id));
            }
            $app_uid = $app->getUid();
        } else {
            $app_uid = NULL;
        }
            
        if (is_null($app_uid)) {
            $status = $this->getUrlContent($url);
        } else if (is_null($app_version)) {
            $url .= "&app_uid=" . $app_uid;
            $status = $this->getUrlContent($url);
        } else if (is_null($platform)) {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version;
            $status = $this->getUrlContent($url);
        } else {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version . "&platform=" . $platform;
            $status = $this->getUrlContent($url);
        }
        
        return json_decode($status, true);
    }
    
    
    /**
     * Runs through the initial precompile process and then ZIPs the source code
     * @param type $window_uid
     * @param type $app_id
     * @param type $app_version
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function cmpGetAppSourceAction($window_uid, $app_id, $app_version) {
//check for valid variables first
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

        if (intval($app_id) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.1') . ': ' . $app_id));
        }
        
        if (floatval($app_version) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.2') . ': ' . $app_version));
        }
        
//get the app database record
        $file_mgmt = $this->get('file_management');
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die("You have no access to this app");
        }

        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        if (is_null($app)) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.retrieve.db.entry') . ': ' . $app_id));
        }
        
//prepare variables & get current processed app checksum
        $app_uid = $app->getUid();
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $app_name = $app->getName();
        $path_app_config = $app_path . $config['filenames']["app_config"];
        $compiled_app_path = substr_replace($app_path, "_compiled/", -1); 
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        $processed_app_checksum = $file_mgmt->getProcessedAppMD5($app, $config['filenames']["app_config"]);
        
//run the precompile process, it will return the same whether it runs the whole process, or if the app has already been processed
//the return contains the status and the checksum (if status = success) of the code resulting from the precompile process
        $res_precompile = $file_mgmt->preCompileProcessingAction($app, $config);
        if ($res_precompile["result"] != "success") {
            return new JsonResponse(array('result' => 'error', 'msg' => $res_precompile["msg"]));
        }
        
//we now have the "ready to go" source, and we need to zip it up.
        if (!file_exists($compiled_app_path)) {
            mkdir($compiled_app_path);
        }

        $temp_name = $compiled_app_path . $app_name . ".zip";
        $zip = new ZipArchive();
        $o = $zip->open($temp_name, ZipArchive::CREATE);
        if ($o === TRUE) {
            
            $app_files = $file_mgmt->func_find($cached_app_path);
            
            foreach($app_files as $file) {
                if (!$zip->addFile($file, str_replace($cached_app_path, "", $file))) {
                    $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.zip_error.1'));
                    return false;
                } 
            }  
                  
            $zip->close();
        } else {
            $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.zip_error.2'), 'filename' => $temp_name);
            return new JsonResponse($arr);
        }
        $processed_app_checksum = $res_precompile["checksum"];
        $arr = array('result' => 'success', 'url' => $config["urls"]["app"] . $app->getPath() . "/" . $app->getActiveVersion() . "_compiled/" . basename($temp_name),  'msg' => $this->get('translator')->trans('servicesController.msg.zip_success'));

        return new JsonResponse($arr);

    }
    
    public function cmpUploadWebsite($window_uid, $app_id, $app_version) {
//check for valid variables first
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

        if (intval($app_id) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.1') . ': ' . $app_id));
        }
        
        if (floatval($app_version) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.2') . ': ' . $app_version));
        }
        
//get the app database record
        $file_mgmt = $this->get('file_management');
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die("You have no access to this app");
        }

        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        if (is_null($app)) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.retrieve.db.entry') . ': ' . $app_id));
        }
        
//prepare variables & get current processed app checksum
        $app_uid = $app->getUid();
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $app_name = $app->getName();
        $path_app_config = $app_path . $config['filenames']["app_config"];
        $compiled_app_path = substr_replace($app_path, "_compiled/", -1); 
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        $processed_app_checksum = $file_mgmt->getProcessedAppMD5($app, $config['filenames']["app_config"]);
        
//run the precompile process, it will return the same whether it runs the whole process, or if the app has already been processed
//the return contains the status and the checksum (if status = success) of the code resulting from the precompile process
        $res_precompile = $file_mgmt->preCompileProcessingAction($app, $config);
        if ($res_precompile["result"] != "success") {
            return new JsonResponse(array('result' => 'error', 'msg' => $res_precompile["msg"]));
        }
        
//we now have the "ready to go" source, and we need to zip it up.
        if (!file_exists($compiled_app_path)) {
            mkdir($compiled_app_path);
        }

        $app_files = $file_mgmt->func_find($cached_app_path);
        $ftp_server = "bergh.fm";
        $ftp_user_name = "flurky@bergh.fm";
        $ftp_user_pass = "!flurkyflurkerson1";
        $conn_id = ftp_connect();

        // login with username and password
        $login_result = ftp_login($conn_id, $ftp_user_name, $ftp_user_pass);
        die(print_r($app_files, true));
       
        foreach($app_files as $file) {
            if (is_dir($file)) { // do the following if it is a directory
                if (!@ftp_chdir($conn_id, "/" . $file)) {
                    ftp_mkdir($conn_id, "/" . $file); // create directories that do not yet exist
                }
                
// upload a file
                if (ftp_put($conn_id, $remote_file, $file, FTP_ASCII)) {
                    echo "successfully uploaded $file\n";
                } else {
                    echo "There was a problem while uploading $file\n";
                }
                
            } else {
                $upload = ftp_put($conn_id, $dst_dir."/".$file, $src_dir."/".$file, FTP_BINARY); // put the files
            }
        }  
        // close the connection
        ftp_close($conn_id);
                  
        $processed_app_checksum = $res_precompile["checksum"];
        $arr = array('result' => 'success', 'url' => $config["urls"]["app"] . $app->getPath() . "/" . $app->getActiveVersion() . "_compiled/" . basename($temp_name),  'msg' => $this->get('translator')->trans('servicesController.msg.zip_success'));

        return new JsonResponse($arr);
        
    }
    
    /**
     * Downloads the compiled executable file and stored in the compiled folder, then checks if it has same checksum as online version
     * @param type $app_uid
     * @param type $app_version
     * @param type $app_checksum
     * @param type $platform
     * @return bool
     */
    private function cmpDownloadApp($window_uid, $app_uid, $app_version, $app_checksum, $remote_compiled_app_checksum, $platform) {
        error_log("  > cmpDownloadApp");
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "receiving"}}', $config), true);
        if ($res_socket["data"]["status"] != "SUCCESS") { return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket'))); }

//prepare app variables and calculate som paths
        $em = $this->getDoctrine()->getManager();
        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneByUid($app_uid);
        if (is_null($app)) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpDownloadApp') . ': ' . $app_uid));
        }

        $passphrase = urlencode($config["compiler_service"]["passphrase"]);
        $file_mgmt = $this->get('file_management');
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $compiled_app_filename = substr_replace($app_path, "_compiled/", -1) . $app_checksum . "." . $config["compiler_service"]["file_extensions"][$platform];
        $download_url = $config["compiler_service"]["protocol"] . "://" . $config["compiler_service"]["url"] . "/getApp?passphrase=$passphrase&app_uid=$app_uid&app_version=$app_version&checksum=$app_checksum&platform=$platform";
        
        if ($remote_compiled_app_checksum == "") {
            $checksum_url = str_replace("?getApp", "?getExecChecksum", $download_url);
            $remote_compiled_app_checksum = $this->getUrlContent($checksum_url);
        }

        if (!file_exists(substr_replace($app_path, "_compiled/", -1))) {
            mkdir(substr_replace($app_path, "_compiled/", -1));
        }
        $local_checksum = $file_mgmt->download_file($download_url, $compiled_app_filename);
        return $local_checksum;
    }
    
/**
 * Public wrapper for private cmpGetAppStatus function
 * 
 * @param type $window_uid
 * @param null $app_id
 * @param null $app_version
 * @param null $platform
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    public function cmpGetAppStatusAction($window_uid, $app_id = NULL, $app_version = NULL, $platform = NULL) {
        error_log("  > cmpGetAppStatusAction");
        return new JsonResponse(array('result' => 'success', 'app_status' => $this->cmpGetAppStatus($app_id = NULL, $app_version = NULL, $platform = NULL)));
    }

    /**
     * This function will ask for the latest version of the app to be compiled. 
     * To reduce requests for pre-compilation processing, uploads and compilations it will do the following pre-checks
     *   1: First it checks to see if the app was compiled and stored locally for the current code (using checksums)
     *   2: Inside the preCompileProcessingAction it checks to see if the app has already been precompiled by comparing the checksum of the app with the checksum 
     * @param type $user_uid
     * @param type $app_id
     * @param type $app_version
     * @param type $checksum
     * @param type $platform
     */
    public function cmpGetAppProcessAction($window_uid, $app_id, $app_version, $platform) {
        error_log("  > cmpGetAppProcessAction");
        
//check for valid variables first
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

        if (intval($app_id) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.1') . ': ' . $app_id));
        }
        
        if (floatval($app_version) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.2') . ': ' . $app_version));
        }
        
        if ($platform == "") {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.3') . ': ' . $platform));
        } else if (!in_array($platform, $config['compiler_service']["supported_platforms"])) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.4') . ': ' . $platform));
        }
        
//get the app database record
        $file_mgmt = $this->get('file_management');
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die("You have no access to this app");
        }

        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        if (is_null($app)) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.retrieve.db.entry') . ': ' . $app_id));
        }
        
//prepare variables & get current processed app checksum
        $app_uid = $app->getUid();
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $path_app_config = $app_path . $config['filenames']["app_config"];
        $compiled_app_path = substr_replace($app_path, "_compiled/", -1); 
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        $processed_app_checksum = $file_mgmt->getProcessedAppMD5($app, $config['filenames']["app_config"]);


//see if app is already downloaded, apps are stored in folders called {version}_compiled/{platform}_{checksum}.ext where ext = .apk or .ipa
//if it has been compiled we send a message via the websocket server
        $app_filename = $processed_app_checksum . $config["compiler_service"]["file_extensions"][$platform];
        
        if (file_exists($compiled_app_path . $app_filename)) {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "ready", "platform": "' . $platform . '", "checksum": "' . $processed_app_checksum . '", "filename": "' . $app_filename . '"}}', $config), true);
            (!$res_socket || $res_socket["data"]["status"] != "SUCCESS") ? $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket')) : $arr = array('result' => 'success');
            return new JsonResponse($arr);
        }
        
//run the precompile process, it will return the same whether it runs the whole process, or if the app has already been processed
//the return contains the status and the checksum (if status = success) of the code resulting from the precompile process
        $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "precompilation"}}', $config), true);
        if (!$res_socket || $res_socket["data"]["status"] != "SUCCESS") { return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket'))); }
        
        $res_precompile = $file_mgmt->preCompileProcessingAction($app, $config);
        if ($res_precompile["result"] != "success") {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "precompilation_failed", "platform": "' . $platform . '", "text": "' . $res_precompile["msg"] . '"}}', $config), true);
            return new JsonResponse(array('result' => 'error', 'msg' => $res_precompile["msg"]));
        }
        $processed_app_checksum = $res_precompile["checksum"];
        
        
//now we need to check to see if the app has been created on the remote server, if not we create it
//the create function is async, so we need to point exit here, and wait for the callback to be called by the remote service.
        $app_info = $this->cmpGetAppStatus($app_id, $app_version, $platform);
        if ( empty($app_info) || !array_key_exists($app_uid, $app_info) || !array_key_exists($app_version, $app_info[$app_uid]) ) {
            $parameters = array("app_uid" => $app_uid, "app_version" => $app_version, "tag" => "multistep-$window_uid-$platform");
            $res_call_create = $this->cmpCallRemoteFunction($config, $window_uid, "creating", "compiler_service", $parameters, "createApp");
            (strtolower($res_call_create) !== "true") ? $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.5')) : $arr = array('result' => 'success');
            return new JsonResponse($arr);
        }        
        
//app already exists, time to upload files
        $res_upload = $this->cmpUploadFiles($cached_app_path, $window_uid, $app_uid, $app_version, $config);
        
//files are uploaded, now we need to verify them. The steps from here, and the next two, compile and download, are called inside the callback from verify
        $parameters = array("app_uid" => $app_uid, "app_version" => $app_version, "checksum" => $processed_app_checksum, "tag" => "multistep-$window_uid-$platform");
        $res_call_verify = $this->cmpCallRemoteFunction($config, $window_uid, "verifying", "compiler_service", $parameters, "verifyApp");
        (strtolower($res_call_verify) != "true") ? $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cmpGetAppProcessAction.6')) : $arr = array('result' => 'success');

        return new JsonResponse($arr);

    }
    
    /**
     * URL called by the compiler service to indicate that an app (version) was successfully created
     * @param type $app_uid
     * @param type $app_version
     * @param type $tag
     */
    public function cbCmpCreatedAppAction(Request $request) {
        error_log("  > cbCmpCreatedAppAction");
//parameters are passed as querystring, not symfony style URL as we cannot guarantee the order of them
//we therefore need to read them from the request object
//Symfony_2.8        $request = $this->getRequest();
        $passphrase = $request->query->get("passphrase");
        $app_uid = $request->query->get("app_uid");
        $app_version = $request->query->get("app_version");
        $result = strtolower($request->query->get("result"));
        $tag = $request->query->get("tag");
        
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $local_passphrase = $config["compiler_service"]["passphrase"];
        if ($local_passphrase != $passphrase) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.passphrase.not.matching')));
        }
        
        list($action, $window_uid, $platform) = array_pad(explode("-", $tag), 3, NULL);
        $fail_text = $this->get('translator')->trans('servicesController.msg.cbCmpCreatedAppAction.1');
        $status = ($result == "true") ? "created" : "create_failed";
        
        if (!is_null($window_uid)) {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "' . $status . '","fail_text": "' . $fail_text . '", "platform": "' . $platform . '"}}', $config), true);
            if ($res_socket["data"]["status"] != "SUCCESS") {
                return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket')));
            }
        }
        
        if ($result != "true") {
            return new JsonResponse(array('result' => 'failure'));
        } else if ($action == "multistep") {
//this is called externally from compiler service, we therefore need to look up the app in the DB and generate a few app related variables
            $em = $this->getDoctrine()->getManager();
            $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneByUid($app_uid);
            if (is_null($app)) {
                return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cbCmpCreatedAppAction.2') . ': ' . $app_uid, "platform" => $platform));
            }

            $app_path = $app->calculateFullPath($config['paths']['app']);
            $cached_app_path = substr_replace($app_path, "_cache/", -1); 

//app now exists, time to upload files
            $res_upload = $this->cmpUploadFiles($cached_app_path, $window_uid, $app_uid, $app_version, $config);
            
//files are uploaded, now we need to verify them. The steps from here, and the next two, compile and download, are called inside the callback from verify
            $file_mgmt = $this->get('file_management');
            $processed_app_checksum = $file_mgmt->getProcessedAppMD5($app, $config['filenames']["app_config"]);
            $parameters = array("app_uid" => $app_uid, "app_version" => $app_version, "checksum" => $processed_app_checksum, "tag" => "multistep-$window_uid-$platform");
            $res_verify = $this->cmpCallRemoteFunction($config, $window_uid, "verifying", "compiler_service", $parameters, "verifyApp");
            (strtolower($res_verify) != "true") ? $arr = array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.cbCmpCreatedAppAction.3')) : $arr = array('result' => 'success');
            return new JsonResponse($arr);

        } 
        
        return new JsonResponse(array('result' => 'success'));
        
    }
    
//app verification (checksum) callback, if this is true all is well.
//if this is called as a part of a complete getapp process, then we will ask for the app to be compiled if it verified OK
    public function cbCmpVerifiedAppAction(Request $request) {
        error_log("  > cbCmpVerifiedAppAction");
//parameters are passed as querystring, not symfony style URL as we cannot guarantee the order of them
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        
//we therefore need to read them from the request object
//Symfony_2.8        $request = $this->getRequest();
        $passphrase = $request->query->get("passphrase");
        $app_uid = $request->query->get("app_uid");
        $app_version = $request->query->get("app_version");
        $remote_processed_app_checksum = $request->query->get("checksum");
        $result = strtolower($request->query->get("result"));
        $tag = $request->query->get("tag");
        
        $local_passphrase = $config["compiler_service"]["passphrase"];
        if ($local_passphrase != $passphrase) {
            error_log("Passphrases not matching (local/remote): $local_passphrase / $passphrase ");
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.passphrase.not.matching')));
        }
        
        $fail_text = $this->get('translator')->trans('servicesController.msg.cbCmpVerifiedAppAction.1');
        $status = ($result != "true" ? "verification_failed" : "verification_ok" );
        list($action, $window_uid, $platform) = array_pad(explode("-", $tag), 3, NULL);
        
        if (!is_null($window_uid)) {
            $local_processed_app_checksum = $remote_processed_app_checksum;
            if ($result != "true") {
                $em = $this->getDoctrine()->getManager();
                $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneByUid($app_uid);
                if ($app) {
                    $file_mgmt = $this->get('file_management');
                    $local_processed_app_checksum = $file_mgmt->getProcessedAppMD5($app, $config['filenames']["app_config"]);
                }
            }
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "' . $status . '","fail_text": "' . $fail_text . '", "remote_checksum": "' . $remote_processed_app_checksum . '", "local_checksum": "' . $local_processed_app_checksum . '", "platform": "' . $platform . '"}}', $config), true);
            if ($res_socket["data"]["status"] != "SUCCESS") {
                return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket')));
            }
        }
        
//this is called externally from compiler service, we reuse the app related variables and call the next step, compiling the app
        if ($action == "multistep" && $result == "true") {
//files are verified, now we need to compile the app. The final step, download app, is called inside the callback from verify
            $parameters = array("app_uid" => $app_uid, "app_version" => $app_version, "checksum" => $remote_processed_app_checksum, "platform" => $platform, "tag" => "multistep-$window_uid-$platform");
            $res = $this->cmpCallRemoteFunction($config, $window_uid, "compiling", "compiler_service", $parameters, "compileApp");
            (strtolower($res) != "true") ? $arr = array('result' => 'error', 'msg' => "compileApp compiler service failed") : $arr = array('result' => 'success');
            return new JsonResponse($arr);

        }        

        return new JsonResponse(array('result' => 'success'));
    }

//app finished compiling callback, if this is true all is well.
//if this is called as a part of a complete getapp process, then we will ask for the app to be downloaded
    public function cbCmpCompiledAppAction(Request $request) {
        error_log("  > cbCmpCompiledAppAction");
//parameters are passed as querystring, not symfony style URL as we cannot guarantee the order of them
//we therefore need to read them from the request object
//Symfony_2.8        $request = $this->getRequest();
        $passphrase = $request->query->get("passphrase");
        $app_uid = $request->query->get("app_uid");
        $app_version = $request->query->get("app_version");
        $app_checksum = $request->query->get("checksum");
        $exec_file_checksum = $request->query->get("checksum_exec_file");
        $platform = $request->query->get("platform");
        $result = $request->query->get("result");
        $tag = $request->query->get("tag");

        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $local_passphrase = $config["compiler_service"]["passphrase"];
        if ($local_passphrase != $passphrase) {
            return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.passphrase.not.matching')));
        }
        
        $fail_text = $this->get('translator')->trans('servicesController.msg.cbCmpCompiledAppAction');
        $status = ($result != "true" ? "compilation_failed" : "compilation_ok" );
        list($action, $window_uid, $platform) = array_pad(explode("-", $tag), 3, NULL);
        
        if (!is_null($window_uid)) {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "' . $status . '","fail_text": "' . $fail_text . '", "platform": "' . $platform . '"}}', $config), true);
            if ($res_socket["data"]["status"] != "SUCCESS") {
                return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket')));
            }
        }
        
//files are compiled, now we need to download the app.
        if ($action == "multistep" && $result == "true") {
            $download_checksum = $this->cmpDownloadApp($window_uid, $app_uid, $app_version, $app_checksum, $exec_file_checksum, $platform);
            if ($download_checksum == $exec_file_checksum) {
                $file_name = $app_checksum . "." . $config["compiler_service"]["file_extensions"][$platform];

//before we send the websocket message we must update the conf.json file with the compilation info, 
//this way we can pick up already compiled files quickly when an app is reopened (and then display the download links)
                $em = $this->getDoctrine()->getManager();
                $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneByUid($app_uid);
                $file_mgmt = $this->get('file_management');
                $file_mgmt->updateAppConfigFile($app, $config, array("latest_executable_" . $platform => $file_name));
                
                $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "ready", "filename": "' . $file_name . '", "platform": "' . $platform . '"}}', $config), true);
            } else {
                $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "failed", "fail_text": "' . $this->get('translator')->trans('servicesController.msg.cbCmpCompiledAppAction.sendWebsocketMessage') . '", "platform": "' . $platform . '"}}', $config), true);
            }
            if ($res_socket["data"]["status"] != "SUCCESS") {
                return new JsonResponse(array('result' => 'error', 'msg' => $this->get('translator')->trans('servicesController.msg.unable.update.websocket')));
            }

        }        
        
        return new JsonResponse(array('result' => 'success'));
    }
    
}
