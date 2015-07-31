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
    /**
     * This function uses basic PHP socket functions to send a message to the web socket server where the 
     * front end Javascript is listening to messages from the compilation services
     * @param type $uid
     * @param type $msg
     * @param type $config
     */
    private function sendWebsocketMessage($uid, $msg, $config) {
//prepare variables
        $host = $config["ws_socket"]["host"];
        $port = $config["ws_socket"]["port"];
        $url = $config["ws_socket"]["url"] . $uid;
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
                "Content-Length: " . strlen($msg) . "\r\n" . "\r\n" ;


//WebSocket handshake & data transmission
        $sock = fsockopen($host, $port, $errno, $errstr, 2);
        fwrite($sock, $head ) or die('error:'.$errno.':'.$errstr);
        $headers = fread($sock, 2000);
        fwrite($sock, "\x00$msg\xff" ) or die('error:'.$errno.':'.$errstr);
        $wsdata = fread($sock, 2000);  //receives the data included in the websocket package "\x00MSG\xff"
        fclose($sock);     
        error_log($wsdata);
        return $wsdata;
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

//
        die($this->sendWebsocketMessage($window_uid, '{"state": "completed", "checksum": "' . $app_checksum . '"}', $config));

//see if app is already downloaded, apps are stored in folders called {version}_compiled/{platform}_{checksum}.ext where ext = .apk or .ipa
//if it has been compiled we send a message via the websocket server
        if (file_exists($compiled_app_path . $app_checksum . $config["compiler_service"]["file_extensions"][$platform])) {
            $this->sendWebsocketMessage($window_uid, '{"state": "completed", "checksum": "' . $app_checksum . '"}', $config);
            return new JsonResponse(array('result' => 'success', 'msg' => "Already compiled"));
        }
        
//run the precompile process, it will return the same wheterh it runs the whole process, or if the app has already been processed
        $res = $file_mgmt->preCompileProcessingAction($app, $config);
        if ($res["result"] != "success") {
            return new JsonResponse(array('result' => 'error', 'msg' => $res["msg"]));
        }
        
//now we run rsync
        
        
    }

}
