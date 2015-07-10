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
    public function cmpGetAppStatusAction($app_id = NULL, $app_version = NULL, $platform = NULL) {
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

    public function cmpCreateAppAction($app_id, $app_version) {
    }

    public function cmpUploadFilesAction($app_id, $app_version) {
    }

    public function cmpVerifyAppAction($app_id, $app_version, $checksum) {
    }

    public function cmpCompileAppAction($app_id, $app_version, $checksum, $platform) {
    }

    public function cmpGetAppAction($user_uid, $app_id, $app_version, $checksum, $platform) {
    }

}
