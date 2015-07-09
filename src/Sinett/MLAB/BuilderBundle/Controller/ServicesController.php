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

//this class is used to store new functions that will process embedded variables in the index.html file
//one example is a class to 
class CustomPreProcessing {
    
    public function getnumberofpages($config, $app, $app_path) {
   		$pages = glob ( $app_path . "/???.html" );
   		$page_num = intval(basename(array_pop($pages))) + 1;
        return $page_num;
    }
    
}

class ServicesController extends Controller
{
    
/**
 * Function that will go through each page in an app and run various processing functions
 * 
 * NB!!!!! This will not be suitable for components that are interactive at designtime, 
           such as a map that requires settings to be chosen.
 * @param type $app_id
 * 
 * TEST $str = '<meta name="mlab:app_uid" content="%%APP_UID%%" />\nmlab.api.navigation.initialise(0, %%MLAB_CT_GETNUMBEROFPAGES%%);'; 
 * 
<?php

$h = "<!DOCTYPE html><html><head>
<title>basic</title>
</head>
<body id='page_body'>
  <!-- The CONTENT of the page - are filled in via the App builder -->
  <div data-role='content' id='mlab_content'>
    <div class='INFO_FOR_TEST'>
      %%MLAB_CT_COMP_H1%%
      <br>
      Number of pages: %%MLAB_CT_FUNC_GETNUMBEROFPAGES%%
    </div>
    <div id='content'>
      <div id='mlab_editable_area' class='mlab_editable_area'>
        <div data-mlab-type='h1' style='display: block;' class='ui-droppable ui-sortable'>
          <h1>Min første app</h1>
        </div>
        <div data-mlab-type='ul' style='display: block;' class='ui-droppable ui-sortable'>
          <ul>
            <li>Test</li>
            <li>Test2</li>
            <ul><li>Test3</li><li><br></li></ul>
          </ul>
        </div>
      </div>
    </div>
  </div><!-- /Content -->
</div>   
</body></html>";

 * 
 */
    public function preCompileProcessingAction($app_id) {
        
//get basic objects and variables ready
    	$em = $this->getDoctrine()->getManager();
        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        $config = $this->container->parameters['mlab'];
    	$file_mgmt = $this->get('file_management');
        $components = $file_mgmt->loadComponents(array(), $config["paths"]["component"], $config["component_files"], $app->getId());
        $app_path = $app->calculateFullPath($config['paths']['app']);
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        
//prepare processing class
        $process = new CustomPreProcessing();

//first process index.html file, this can have special variables in it, for the other pages we only execute the onCompile function
        $frontpage_content = file_get_contents($app_path . "index.html");

//get list of all placeholders, each placeholder is surrounded by double percentage (%) signs
        preg_match_all('~%%(.+?)%%~', $frontpage_content, $placeholders);
        $placeholders = array_unique($placeholders[1]);

//we use two separate loops to check for function or component placeholders. Reason for this is that a component may well have a function placeholder.

//start with the component placeholders
        foreach ($placeholders as $placeholder) {
//Functions are kept in the CustomPreProcessing class, where all names are in lower case (i.e. no CamelCase or similar)
            if (strpos($placeholder, "MLAB_CT_COMP_") !== false) {
                $comp_name = strtolower(str_replace("MLAB_CT_COMP_", "", $placeholder));
                if (array_key_exists($comp_name, $components)) {
                    
//here we insert the html of the component in place of the placeholder
//this is a two step process, first insert the content of the component and then run the backend code (if any)
                    $frontpage_content = str_replace("%%$placeholder%%", $components[$comp_name]["html"], $frontpage_content);
                    $res = $file_mgmt->componentAdded($app_id, $app, $comp_id, $config);
                    if ($res["result"] != "success") {
                        error_log("Failed to execute backend code for $comp_name");
                    }
                } else {
                    error_log("$comp_name is not a component installed on this server");
                }
            }
        }

        
//now check for functions to be run. starts with MLAB_CT_FUNC_. 
        foreach ($placeholders as $placeholder) {
//Functions are kept in the CustomPreProcessing class, where all names are in lower case (i.e. no CamelCase or similar)
            if (strpos($placeholder, "MLAB_CT_FUNC_") !== false) {
                $func_name = strtolower(str_replace("MLAB_CT_FUNC_", "", $placeholder));
                if (method_exists($process, $func_name)) {
                    
//here we run the function and obtain the result
                    $value = call_user_func_array(array($process, $func_name), array($config, $app, $app_path));
                    
//to avoid javascript errors we set empty values to -1
//(for instance code may be: var x = %%MLAB_CT_FUNC_GET_NUM%%; , with an empty value this would cause all javascript below to fail at runtime
                    if (empty($value)) {
                        $value = -1;
                    }
                    
                    $frontpage_content = str_replace("%%$placeholder%%", $value, $frontpage_content);
                } else {
                    error_log("$func_name is not a function in class CustomPreProcessing in " . __FILE__);
                }
                
            } else if (strpos($placeholder, "MLAB_CT_") === false) {
                error_log("Placeholder $placeholder was not processed");
            }
        }
        
        if (!file_exists($cached_app_path)) {
            mkdir($cached_app_path);
        }
        
//loop through all pages to process the components that have a matching onCompile function
        $pages = glob ( $app_path . "???.html" );
        array_unshift($pages, $app_path . "index.html"); //fake placeholder to make loop below work neater

        foreach ($pages as $page) {
//parse pages and loop through the components for each page
            $doc = new \DOMDocument("1.0", "utf-8");
            libxml_use_internal_errors(true);
            $doc->validateOnParse = true;
            if (substr($page, -10) == "index.html") {
                $doc->loadHTML($frontpage_content);
            } else {
                $doc->loadHTMLFile($page);
            }
            
            libxml_clear_errors();
            $xpath = new \DOMXPath($doc);
            $page_components = $doc->getElementById($config["app"]["content_id"])->childNodes;

            foreach ($page_components as $page_component) {
                
//check if this component has a server_code.php file and if it has a onCompile class, 
//if so we send the inside of the DIV node object and the html version of this to the function to be manipulated. 
//We get plain HTML back
                if (get_class($page_component) == "DOMElement") {
                    $comp_name = $page_component->getAttribute("data-mlab-type");
                    if ($comp_name != "") {
                        $path_component = $comp_dir . $comp_name . "/";
                        if (file_exists($path_component . "server_code.php")) {
                            if (!@(include($path_component . "server_code.php"))) {
                                return array(
                                        'result' => 'failure',
                                        'msg' => "Unable to load server_code.php file");
                            } else {
                                if (class_exists("mlab_ct_" . $comp_name)) {
                                    $temp_class_name = "mlab_ct_" . $comp_name;
                                    $component_class = new $temp_class_name();
                                    if (method_exists($component_class, "onCompile")) {
                                        $result_html = $component_class->onCompile($page_component->childNodes[0], $page_component->childNodes[0]->saveHTML());
                                        if (!$result_html) {
                                            return array(
                                                'result' => 'failure',
                                                'msg' => "Unable to run application on server");
                                        }
                                    }
                                }
                            }
                        }

                    }
                }
            }

            $doc->saveHTMLFile($cached_app_path . basename($page));
        }
        
        $other_files = glob($app_path . "*");
        foreach ($other_files as $other_file) {
            if (!substr($other_file, -5) == ".html") {
                $file_name = basename($other_file);
                symlink($other_file, $cached_app_path . $file_name);
            }
        }
        
//TODO: finally update include.js
        //MLAB_RT_VARIABLES = {num_pages: 6, app_title: "My app"};
        
        return new Response("'s okey");
        
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
