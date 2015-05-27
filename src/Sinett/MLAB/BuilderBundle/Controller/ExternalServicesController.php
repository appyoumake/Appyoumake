<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;

use Symfony\Component\Yaml\Parser;

//use Symfony\Component\HttpFoundation\File\UploadedFile

/**
 * App controller.
 *
 */
class ExternalServicesController extends Controller 
{
    
    /**
 * Uses the compiler services' getAppStatus API call to get info about one or more apps
 * 
 * @param type $app_id
 * @param type $app_version
 * @param type $platform
 * @return type
 */
    public function csGetAppStatusAction($app_id = NULL, $app_version = NULL, $platform = NULL) {
        $config = $this->container->parameters['mlab'];
        $passphrase = $config["compiler_service"]["passphrase"];
        $url = $config["compiler_service"]["url"] . "/getAppStatus?passphrase=" . urlencode($passphrase);

        if ($app_id != NULL) {
            $em = $this->getDoctrine()->getManager();
            $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            $config_path = $app->calculateFullPath($config['paths']['app']) . $config["compiler_service"]['config_path'];
        
            $file_mgmt = $this->get('file_management');
            $file_mgmt->setConfig('app');
            $app_uid = $file_mgmt->readCordovaConfiguration($config_path, $config["compiler_service"]["config_uid_tag"], $config["compiler_service"]["config_uid_attribute"]);
        } else {
            $app_uid = NULL;
        }
            
//build URL params & fetch options
        $opts = array('http' =>
            array(
                'method' => 'GET',
                'max_redirects' => '0',
                'ignore_errors' => '1'
            )
        );

//connect to API, if app (and potentially other attributes) are specified, then we need to generate additional params for the URL
        $context = stream_context_create($opts);
        if (is_null($app_uid)) {
            $status = file_get_contents($url);
        } else if (is_null($app_version)) {
            $url .= "&app_uid=" . $app_uid;
            $status = file_get_contents($url);
        } else if (is_null($platform)) {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version;
            $status = file_get_contents($url);
        } else {
            $url .= "&app_uid=" . $app_uid . "&app_version=" . $app_version . "&platform=" . $platform;
            $status = file_get_contents($url);
        }
        
        return new JsonResponse(array('result' => 'success', 'app_status' => json_decode($status)));
    }
    
    public function csAppCreatedCallbackAction() {
        
    }

/**
 * Called from compiler service after it is invoked through the createApp call
 */
    public function csAppVerifiedCallbackAction() {
        
    }
    
/**
 * Called from compiler service after it is invoked through the createApp call
 */
    public function csAppCompiledCallbackAction() {
        
    }

/**
 * Called from compiler service after it is invoked through the createApp call
 */
    public function csAppReadyCallbackAction() {
        
    }
    
}

