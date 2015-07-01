<?php

//compiler services calls

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

//this class is used to store new functions that will process embedded variables in the index.html file
//one example is a class to 
class CustomPreProcessing {
    
    public function getNumberOfPages($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);

   		$pages = glob ( $app_path . "/???.html" );
   		$page_num = intval(basename(array_pop($pages)));
        
        return $page_num;
    }
    
}

class ServicesController extends Controller
{
    
/**
 * Function that will go through each page in an app and run various processing functions
 * @param type $app_id
 */
    public function preCompileProcessing($config, $app, $file_mgmt) {
        
//get all components
        $components = $file_mgmt->loadComponents(array(), $config["paths"]["component"], $config["component_files"], $app->getId());
        
//loop through all pages
        $pages = glob ( $app_path . "/???.html" );
        foreach ($pages as $page) {
            $content = file_get_contents($page);

//process placeholders, can be either functions to run, or components to install
            preg_match_all('~%%(.+?)%%~', $str, $placeholders);

            foreach ($placeholders[1] as $placeholder) {
                $func_name = str_replace("MLAB_CT_", "", $placeholder);
                print "<br>";
                if (function_exists($func_name)) {
                    print "$func_name outputs: ";
                    $func_name("testy");
                } else {
                    print "$func_name is not a function";
                }
            }
            
        }

        $str = '<meta name="mlab:app_uid" content="%%APP_UID%%" />\nmlab.api.navigation.initialise(0, %%MLAB_CT_GETNUMBEROFPAGES%%);';

        
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
