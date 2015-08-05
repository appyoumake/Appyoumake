<?php

//compiler services calls

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\Component;

use Symfony\Component\Yaml\Parser;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\HttpFoundation\Response;

class ServicesController extends Controller
{
    
    private function hybi10Decode($data)
    {
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
        $host = $config["ws_socket"]["host"];
        $port = $config["ws_socket"]["port"];
        $url = $config["ws_socket"]["url"] . "0";
        if ( in_array("HTTPS", $_SERVER) && $_SERVER["HTTPS"] ) {
            $proto = "https://";
        } else {
            $proto = "http://";
        }
        $local = $proto . $_SERVER["HTTP_HOST"] . ":" . $_SERVER["SERVER_PORT"];  //url where this script run
        $head = "GET $url HTTP/1.1"."\r\n" .
                "Upgrade: WebSocket"."\r\n" .
                "Connection: Upgrade"."\r\n" .
                "Origin: $local"."\r\n" .
                "Host: $host"."\r\n" .
                "Sec-WebSocket-Version: 13"."\r\n".
                "Sec-WebSocket-Key: asdasdaas76da7sd6asd6as7d"."\r\n".
                "Content-Length: " . strlen($msg) . "\r\n" . "\r\n" ;


//WebSocket handshake & data transmission
        $sock = fsockopen($host, $port, $errno, $errstr, 2);
        fwrite($sock, $head ) or die('error:'.$errno.':'.$errstr);
        $headers = fread($sock, 2000);
        fwrite($sock, $this->hybi10Encode($msg) ) or die('error:'.$errno.':'.$errstr);
        $wsdata = fread($sock, 2000);  //receives the data included in the websocket package "\x00MSG\xff"
        fclose($sock);     
        return $this->hybi10Decode($wsdata);
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

/**
 * Uses the compiler services' getAppStatus API call to get info about one or more apps
 * 
 * @param type $app_id
 * @param type $app_version
 * @param type $platform
 * @return type
 */
    public function cmpGetAppStatusAction($window_uid, $app_id = NULL, $app_version = NULL, $platform = NULL) {
        $config = $this->container->parameters['mlab'];
        $passphrase = $config["compiler_service"]["passphrase"];
        $protocol = $config["compiler_service"]["protocol"];
        $url = $protocol . "://" . $config["compiler_service"]["url"] . "/getAppStatus?passphrase=" . urlencode($passphrase);

        if ($app_id != NULL) {
            $em = $this->getDoctrine()->getManager();
            $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (isnull($app)) {
                return new JsonResponse(array('result' => 'error', 'message' => 'Unable to retrieve app database entry: ' . $app_id));
            }
            $app_uid = $app->getUid();
        } else {
            $app_uid = NULL;
        }
            
//build URL params & fetch options
        $opts = array($protocol =>
            array(
                'method' => 'GET',
                'max_redirects' => '0',
                'ignore_errors' => '1'
            )
        );

//connect to API, if app (and potentially other attributes) are specified, then we need to generate additional params for the URL
        $context = stream_context_create($opts);
        if (is_null($app_uid)) {
            $status = file_get_contents($url, false, $context);
        } else if (is_null($app_version)) {
            $url .= "&app_uid=" . $app_uid;
            $status = file_get_contents($url, false, $context);
        } else if (is_null($platform)) {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version;
            $status = file_get_contents($url, false, $context);
        } else {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version . "&platform=" . $platform;
            $status = file_get_contents($url, false, $context);
        }
        
        return new JsonResponse(array('result' => 'success', 'app_status' => json_decode($status, true)));
            
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
    public function cmpGetAppAction($window_uid, $app_id, $app_version, $platform) {
//check for valid variables first
        $config = $this->container->parameters['mlab'];

        if (intval($app_id) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => 'App ID not specified: ' . $app_id));
        }
        
        if (floatval($app_version) <= 0) {
            return new JsonResponse(array('result' => 'error', 'msg' => 'App version not specified: ' . $app_version));
        }
        
        if ($platform == "") {
            return new JsonResponse(array('result' => 'error', 'msg' => 'Platform not specified: ' . $platform));
        } else if (!in_array($platform, $config['compiler_service']["supported_platforms"])) {
            return new JsonResponse(array('result' => 'error', 'msg' => 'Platform not supported for compilation: ' . $platform));
        }
        
//get the app database record
        $file_mgmt = $this->get('file_management');
        $em = $this->getDoctrine()->getManager();
        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        if (is_null($app)) {
            return new JsonResponse(array('result' => 'error', 'msg' => 'Unable to retrieve app database entry: ' . $app_id));
        }
        
//prepare variables & get current app checksum
        $app_uid = $app->getUid();
        $app_checksum = $file_mgmt->getAppMD5($app, $config['filenames']["app_config"]);
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $path_app_config = $app_path . $config['filenames']["app_config"];
        $compiled_app_path = substr_replace($app_path, "_compiled/", -1); 


//see if app is already downloaded, apps are stored in folders called {version}_compiled/{platform}_{checksum}.ext where ext = .apk or .ipa
//if it has been compiled we send a message via the websocket server
        if (file_exists($compiled_app_path . $app_checksum . $config["compiler_service"]["file_extensions"][$platform])) {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "ready", "checksum": "' . $app_checksum . '"}}', $config), true);
            if ($res_socket["data"]["status"] != "connected") {
                return new JsonResponse(array('result' => 'error'));
            } else {
                return new JsonResponse(array('result' => 'success'));
            }
        }
        
//run the precompile process, it will return the same whether it runs the whole process, or if the app has already been processed
        $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "precompilation"}}', $config), true);
        if ($res_socket["data"]["status"] != "connected") {
            return new JsonResponse(array('result' => 'error'));
        }
        
        $res = $file_mgmt->preCompileProcessingAction($app, $config);
        if ($res["result"] != "success") {
            $res_socket = json_decode($this->sendWebsocketMessage('{"destination_id": "' . $window_uid . '", "data": {"status": "ready", "error": "' . $res["msg"] . '"}}', $config), true);
            return new JsonResponse(array('result' => 'error', 'msg' => $res["msg"]));
        }
        
//now we run rsync
        
        
        
//all well, return success
        return new JsonResponse(array('result' => 'success'));
    }

}
