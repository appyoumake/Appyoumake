<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\Component;

//use Symfony\Component\HttpFoundation\File\UploadedFile

/**
 * App controller.
 *
 */
class AppController extends Controller 
{

    /**
     * Lists all App entities.
     *
     */
    public function indexAction()
    {
    	$em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:App')->findAll();

        return $this->render('SinettMLABBuilderBundle:App:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    
    /**
     * Creates a new App entity.
     * It receives relevant data from a regular SYmfony form, then it will (if data is valid):
     * 1: Determine if this is based on a template or an app
     * 2: If app, copy it across
     * 3: If template, 
     * 3.1: Try to generate the new app using cordova command line options
     * 3.2: If successful, copy across base files from template
     * 4: If 2 or 3.x is successful, redirect to edit the app
     */
    public function createAction(Request $request)
    {
    	$entity = new App();
        $form = $this->createAppForm($entity);
        $form->bind($request);
       	
        if ($form->isValid()) {
        	
//store values in array for easy access
        	$app_data = $request->request->all()["form"];
//get config values
        	$config = $this->container->parameters['mlab'];
//prepare doctrine manager
        	$em = $this->getDoctrine()->getManager();
        	 
//generate the path name and get full path
        	$entity->generatePath($config["replace_in_filenames"]);
        	$entity->setVersion(1);
        	$usr= $this->get('security.context')->getToken()->getUser();
        	$entity->setUser($usr);
        	$entity->setUpdatedBy($usr);
        	foreach ($usr->getGroups() as $group) {
        		$entity->addGroup($group);
        	}
        	

        	$app_destination = $entity->calculateFullPath($config["paths"]["app"]);
        	
//check if this already exists, first check name in DB then file path
			if (file_exists($app_destination)) { 
				return new JsonResponse(array(
	        		'action' => 'ADD',
	        		'result' => 'FAILURE',
	        		'message' => 'App already exists, chose a different name'));
			} else if ($em->getRepository('SinettMLABBuilderBundle:App')->findOneByName($entity->getName())) {
				return new JsonResponse(array(
						'action' => 'ADD',
						'result' => 'FAILURE',
						'message' => 'App name already exists, chose a different name'));
        	}

//prepare file management service
		    $file_mgmt = $this->get('file_management');
		    $file_mgmt->setConfig('app');
		    
//do they want to copy an existing app?
		    if ($app_data["copy_app"] != '') {
		    	$orig_app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_data["copy_app"]);
		    	$result = false;
		    	if ($orig_app) {
		    		$result = $file_mgmt->copyDirectory($app_data["copy_app"], $app_destination);
		    	} 
		    	
		    	if ($result == false) {
		    		return new JsonResponse(array(
		    				'action' => 'ADD',
		    				'result' => 'FAILURE',
		    				'message' => 'Unable to copy app files'));
		    	} 
        		
//otherwise we use the template they specified 
        	} else if ($app_data["template"] != '') {
        		$result = $file_mgmt->createAppFromTemplate($entity->getTemplate(), $entity);
        		if ($result !== true) {
        			return new JsonResponse(array(
        					'action' => 'ADD',
        					'result' => 'FAILURE',
        					'message' => 'Unable to create app, Cordova error: ' . implode("\n", $result)));
        		}
        		
        	} else {
				return new JsonResponse(array(
						'action' => 'ADD',
						'result' => 'FAILURE',
						'message' => 'Neither app to copy nor template specified'));
        		        		
        	}
        	
        	$em->persist($entity);
        	$em->flush();
        	return new JsonResponse(array(
        			'action' => 'ADD',
        			'result' => 'SUCCESS',
        			'mlab_app_page_num' => 1,
        			'mlab_app_id' => $entity->getId(),
        			'mlab_app_version' => $entity->getVersion(),
        			'mlab_app' => $entity->getArrayFlat()));
        	 
        }
        
        return new JsonResponse(array(
        		'action' => 'ADD',
        		'result' => 'FAILURE',
        		'message' => 'Incorrect data submitted, may be a field missing'));
                    
    }

    /**
    * Creates a form to create a App entity.
    *
    * @param App $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(App $entity)
    {
        $form = $this->createForm(new AppType(), $entity, array(
            'action' => $this->generateUrl('app_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

        return $form;
    }

    public function createAppForm($entity) {
    	return $this->createFormBuilder($entity, array('attr' => array('id' => 'mlab_form_app')))
				    	->setAction($this->generateUrl("app_create"))
				    	->setMethod('POST')
				    	->add('name')
				    	->add('description')
				    	->add('iconFile', 'file')
				    	->add('splashFile', 'file')
				    	->add('keywords')
				    	->add('categoryOne')
				    	->add('categoryTwo')
				    	->add('categoryThree')
				    	->add('template', 'entity', array( 'class' => 'SinettMLABBuilderBundle:Template', 'empty_value' => ''))
				    	->add('version', "hidden")
				    	->add("copy_app", "hidden", array("mapped" => false))
				    	->add('save', 'submit')
				    	->getForm();
    }
    /**
     * Displays a form to create a new App entity.
     *
     */
    public function newAction()
    {
    	$em = $this->getDoctrine()->getManager();
    	
    	$entity = new App();
    	$apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroups($this->getUser()->getGroups());
    	$templates = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllByGroups($this->getUser()->getGroups());
    	$url_apps = $this->container->parameters['mlab']['urls']['app'];
    	$url_templates = $this->container->parameters['mlab']['urls']['template'];
    	$cordova_icon_path = $this->container->parameters['mlab']['cordova']['icon_path'];
    	
        $form = $this->createAppForm($entity);
        
        return $this->render('SinettMLABBuilderBundle:App:properties.html.twig', array(
        	'entity' => $entity,
        	'apps' => $apps,
        	'templates' => $templates,
            'form' => $form->createView(),
        	'mode' => 'add',
        	'url_templates' => $url_templates,
        	'url_apps' => $url_apps,
        	'cordova_icon_path' => $cordova_icon_path,
        ));
        
    }

    /**
     * Finds and displays a App entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find App entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:App:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing App entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find App entity.');
        }

        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroups($this->getUser()->getGroups());
        $templates = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllByGroups($this->getUser()->getGroups());
        
        $editForm = $this->createFormBuilder($entity)
								        ->setAction($this->generateUrl('app_update', array('id' => $entity->getId())))
								        ->setMethod('POST')
								        ->add('name')
								        ->add('description')
								        ->add('iconFile', 'file')
								        ->add('splashFile', 'file')
								        ->add('keywords')
								        ->add('categoryOne')
								        ->add('categoryTwo')
								        ->add('categoryThree')
								        ->add('save', 'submit', array('label' => 'Update'))
								        ->getForm();
        
        return $this->render('SinettMLABBuilderBundle:App:properties.html.twig', array(
        		'entity' => $entity,
        		'apps' => $apps,
        		'templates' => $templates,
        		'form' => $editForm->createView(),
        		'mode' => 'edit'
        ));
    }

    /**
    * Creates a form to edit a App entity.
    *
    * @param App $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(App $entity)
    {
        $form = $this->createForm(new AppType(), $entity, array(
            'action' => $this->generateUrl('app_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

        return $form;
    }
    
    /**
     * Edits an existing App entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find App entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();
            
            return new JsonResponse(array('db_table' => 'app',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:App:show.html.twig', array('entity' => $entity))));
        }
            
        return new JsonResponse(array('db_table' => 'app',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => 'Unable to create new record'));
            
    }
    
    /**
     * Deletes a App entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'app',
        							      'db_id' => $id,
        							  	  'result' => 'FAILURE',
        								  'message' => ''));
        }

        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'app',
        							  'db_id' => $id,
        							  'result' => 'SUCCESS',
        						 	  'message' => ''));
    }

    /**
     * Sends message to app store that a particular app should be removed.
     * @param unknown $id
     */
    public function removeAppStoreAction($id)
    {
    	
    }
    
    /**
     * Sends message to app store that a particular app should be recalled, 
     * this will remove it AND tell all installed versions to uninstall
     * @param unknown $id
     */
    public function recallAction($id)
    {
    	
    }

/******* EDIT FUNCTIONALITY *******/
    /**
     * Lists all App entities for management by app designer 
     * (similar to the indexAction, but adds many other actionsr)
     * 
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function builderAction()
    {
    	$em = $this->getDoctrine()->getManager();
    	$apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroups($this->getUser()->getGroups());
    	$this->getLockStatus($apps);
    	$apps[1]["locked_pages"] = array(1);
    	return $this->render('SinettMLABBuilderBundle:App:builder.html.twig', array(
    			'apps' => $apps,
    	));
    }
    
    /**
     * Opens an app on the front page:
     * 1: Check page is not locked
     * 2: Lock it
     * 3: Unlock all other pages!
     * 4: Render page
     * 5: In page use getPageHtml() call in this controller
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function buildAppAction($id, $page_num)
    {
    	$em = $this->getDoctrine()->getManager();
    	$config = $this->container->parameters['mlab'];
    	
    	$file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('component');
    	
    	unset($config["replace_in_filenames"]);
    	unset($config["verify_uploads"]);
    	 
    	$accessible_components = $em->getRepository('SinettMLABBuilderBundle:Component')->findAccessByGroups($this->getUser()->getGroups());
    	$components = $file_mgmt->loadComponents($accessible_components, $config["paths"]["component"], $config["component_files"]);
    	$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($id);
    	
        
        
    	return $this->render('SinettMLABBuilderBundle:App:build_app.html.twig', array(
    			"mlab_app_page_num" => $page_num,
    			"mlab_app_id" => $id, 
    			"mlab_app_version" => $app->getVersion(), 
    			"mlab_components" => $components,
    			"mlab_app" => $app->getArrayFlat(),
    			"mlab_config" => $config,
                "mlab_uid" => $this->getUser()->getId() . "_" . time() . "_" . rand(1000, 9999)
    	));
    }
    
    /**
     * Always called by AJAX to get the HTML content of the page that is to be edited
     * @param unknown $app_id
     * @param unknown $page_num
     * @return \Sinett\MLAB\BuilderBundle\Controller\JsonModel
     */
    public function getPageAction ($app_id, $page_num) {
    	
    	if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    		
    	}
    	
//create the path to the file to open
        $app_path = $app->calculateFullPath($this->container->parameters['mlab']['paths']['app']) . $this->container->parameters['mlab']['cordova']['asset_path'];
    	
    	if ($page_num == 'last') {
//pick up last page, get the whole array, pop off last element and get filename
    		$pages = glob ( $app_path . "/???.html" );
    		$doc = basename(array_pop($pages));
    		
    	} else if ($page_num == 'first' || $page_num == 'index') {
    		$doc = 'index.html';
    		
    	} else {
    		if ($page_num > 0 ) {
    			$doc = substr("000" . $page_num, -3) . ".html";
    		} else {
    			return new JsonResponse(array(
    					'result' => 'error',
    					'msg' => sprintf("Page not specified: %d", $page_num)));
    		
    		}
    	}

    	if (file_exists("$app_path$doc")) {
    		$html = file_get_contents("$app_path$doc");
    		return new JsonResponse(array(
    				'result' => 'success',
    				'html' => $html,
                    'page_num' => $page_num));
    		 
    	} else {
    		return new JsonResponse(array(
    				'result' => 'error',
    				'msg' => sprintf("File does not exists, contact support: %s", "$app_path$doc")));
    		 
    	}
    }
    
    /**
     * This is the function that stores a page in the app
     * @param type $app_id
     * @param type $page_num
     */
    public function putPageAction (Request $request, $app_id, $page_num) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    	}
        
        if ($page_num > 0 ) {
            $page_name = substr("000" . $page_num, -3) . ".html";
        } else {
            return new JsonResponse(array(
                    'result' => 'error',
                    'msg' => sprintf("Page not specified: %d", $page_num)));
        }
        
        $html = $request->request->all()["html"];
        $file_mgmt = $this->get('file_management');
        $res = $file_mgmt->savePage($app, $page_num, $html);
        if ($res === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => "Unable to save file, please try again"));
        }

        return new JsonResponse(array(
            'result' => 'success'));

    }
    
    /**
     * New page is created by copying the standard page.html from the template
     * @param type $app_id
     */
    public function newPageAction (Request $request, $app_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    		
    	}
        
//copy the template file to the app
        $title = $request->request->all()["title"];
        $file_mgmt = $this->get('file_management');
        $new_page_num = $file_mgmt->newPage($app, $title);
        if ($new_page_num === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => "Unable to create a new file, maximum app size of 999 pages reached!"));
        }
        
    	return $this->redirect($this->generateUrl('app_builder_page_get', array('app_id' => $app_id, 'page_num' => $new_page_num)));
    }

    /**
     * Copy a page.
     * @param type $app_id
     * @param type $page_num
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function copyPageAction ($app_id, $page_num) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    	}
    	
//create the name of the file to create
	    $file_mgmt = $this->get('file_management');
        $new_page_num = $file_mgmt->copyPage($app, $page_num);
        if ($new_page_num === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => "Unable to copy the page, please try again"));
        }	 
    	return $this->redirect($this->generateUrl('app_builder_page_get', array('app_id' => $app_id, 'page_num' => $new_page_num)));
        
    }
    
    /**
     * Will look through all folders nad see if page is locked, will update the locked_pages array for each app, 
     * see Sinett\MLAB\BuilderBundle\Entity\App->getArray()
     * @param unknown $apps
     */
    public function getLockStatus(&$apps) {
    	
    }
    
    /**
     * Handles a file being uploaded
     * @param \Symfony\Component\HttpFoundation\Request $request
     * @param type $app_id
     * @param type $comp_id
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function componentUploadAction(Request $request, $app_id, $comp_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    	} else {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    	}

        if ( !isset($comp_id) ) {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf("Component type not specified: %s", $comp_id)));
        }

        $path_app = $app->calculateFullPath($this->container->parameters['mlab']['paths']['app']) . $this->container->parameters['mlab']['cordova']['asset_path'];
        $replace_chars = $this->container->parameters['mlab']['replace_in_filenames'];
        
//loop through list of files and place it in relevant folder based on mime type, move file and then return the file path
        foreach($request->files as $uploadedFile) {
            $width = $height = $type = $attr = null;
            $orig_name = $uploadedFile->getClientOriginalName();
//TODO fix hack so keep extension properly
            $ext = $uploadedFile->getClientOriginalExtension();
            $file_name = str_replace("_$ext", ".$ext", preg_replace(array_values($replace_chars), array_keys($replace_chars), $orig_name)) ;
            $sub_folder = false;
            foreach ($this->container->parameters['mlab']['uploads_allowed'] as $folder => $formats) {
                if (in_array($uploadedFile->getMimeType(), $formats)) {
                    $sub_folder = $folder;
                    break;
                }
            }
            
            if ( !$sub_folder ) {
                return new JsonResponse(array(
                    'result' => 'failure',
                    'msg' => 'File type not allowed, please convert to another format'));
            }
            
            if ($sub_folder == "img") {
                //list($width, $height, $type, $attr) = getimagesize($uploadedFile["tmp_name"]);
            }
            
//url of file to return
            $url = $app->calculateFullPath($this->container->parameters['mlab']['urls']['app']) .  $this->container->parameters['mlab']['cordova']['asset_path'] . $sub_folder . "/" . $file_name;
        
            $uploadedFile->move($path_app . $sub_folder, $file_name);
            /*{
                return new JsonResponse(array(
                    'result' => 'failure',
                    'msg' => 'Unable to copy uploaded file to app folder'));
            }*/
            
            
            return new JsonResponse(array(
                    'result' => 'success',
                    "url" => $url,
                    "file_name" => $orig_name,
                    "file_width" => $width,
                    "file_height" => $height,
                    "file_type" => $type));
        }
    }

    /**
     * Whenever a component is added on the front end this function is called to copy files if required and run the exec_php code
     * @param type $app_id
     * @param type $comp_id
     * @return \Sinett\MLAB\BuilderBundle\Controller\JsonModel|\Symfony\Component\HttpFoundation\JsonResponse
     */
    public function componentAddedAction($app_id, $comp_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    	} else {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    	}
        
        if ( !isset($comp_id) ) {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf("Component type not specified: %s", $comp_id)));
        }

        $path_component = $this->container->parameters['mlab']['paths']['component'] . $comp_id . "/";
        $path_app = $app->calculateFullPath($this->container->parameters['mlab']['paths']['app']);
        $path_app_assets = $path_app . $this->container->parameters['mlab']['cordova']['asset_path'];
        $path_app_js = $path_app_assets . "js/";
        
//check if path to component and app exists
            if ( is_dir($path_component) && is_dir($path_app) && is_dir($path_app_assets) ) {
            
//1: Copy JS file
                if (file_exists( $path_component . $comp_id  . ".js") && !file_exists( $path_app_js . $comp_id . ".js")) {
                    if (!@copy($path_component . $comp_id  . ".js", $path_app_js . $comp_id . ".js")) {
                        return new JsonResponse(array(
                            'result' => 'failure',
                            'msg' => sprintf("Unable to copy JavaScript file for this component: %s", $comp_id)));
                    }
                }

//2: Add rights to the manifest file
                if (file_exists($path_component . "permissions.txt")) {
                    if (!file_exists( $path_app . "AndroidManifest.xml")) {
                        touch($path_app . "AndroidManifest.xml");
                    }
                    $xml = simplexml_load_file($path_app . "AndroidManifest.xml");

                    $new_permissions = file($path_component . "permissions.txt", FILE_IGNORE_NEW_LINES);
                    $existing_permissions = array();
                    foreach($xml->{'uses-permission'} as $permission) {
                        $existing_permissions[] = (string) $permission->attributes('http://schemas.android.com/apk/res/android');
                    }

                    $add_permissions = array_diff($new_permissions, $existing_permissions);

//only add permissions if it is not already there
                    if (count($add_permissions) > 0) {
                        foreach ($add_permissions as $add_permission) {
                            $perm = $xml->addChild('uses-permission');
                            $perm->addAttribute("android:name", $add_permission, 'http://schemas.android.com/apk/res/android');
                        }

                        if (!$xml->asXML($path_app . "AndroidManifest.xml")) {
                            return new JsonResponse(array(
                                'result' => 'failure',
                                'msg' => "Unable to update the permissions for this application"));
                        }
                    }
                }

//3: run the exec.php file if it exists
                if (file_exists($path_component . "exec.php")) {
                    if (!@(include($path_component . "exec.php"))) {
                        return new JsonResponse(array(
                                'result' => 'failure',
                                'msg' => "Unable to load exec.php file"));
                    } else {
                        if (!onInit($path_app, $path_app_assets, $path_component, $comp_id)) {
                            return new JsonResponse(array(
                                'result' => 'failure',
                                'msg' => "Unable to run application on server"));
                        }
                    }
                }

                return new JsonResponse(array('result' => 'success'));
            
            } else {
                    $error = "";
                    if (!is_dir($path_component)) { $error .= "Component not found\n"; }
                    if (!is_dir($path_app)) { $error .= "App not found\n"; }
                    return new JsonResponse(array(
                                'result' => 'failure',
                                'msg' => $error));
            }
    }
}
