<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\Component;

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
			if (!file_exists($app_destination)) { //TODO
				return new JsonResponse(array(
	        		'action' => 'ADD',
	        		'result' => 'FAILURE',
	        		'message' => 'App path already exists, chose a different name'));
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
        		$result = true; //TODO
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
    public function buildAppAction($id, $version, $page_num)
    {
    	$em = $this->getDoctrine()->getManager();
    	$config = $this->container->parameters['mlab'];
    	
    	$file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('component');
    	
    	unset($config["app"]);
    	unset($config["replace_in_filenames"]);
    	unset($config["verify_uploads"]);
    	
    	 
    	 
    	$accessible_components = $em->getRepository('SinettMLABBuilderBundle:Component')->findAccessByGroups($this->getUser()->getGroups());
    	$components = $file_mgmt->loadComponents($accessible_components, $config["paths"]["component"], $config["component_files"]);
    	$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($id);
    	
    	return $this->render('SinettMLABBuilderBundle:App:build_app.html.twig', array(
    			"mlab_app_page_num" => $page_num,
    			"mlab_app_id" => $id, 
    			"mlab_app_version" => $version, 
    			"mlab_components" => $components,
    			"mlab_app" => $app->getArrayFlat(),
    			"mlab_config" => $config,
    	));
    }
    
    /**
     * Always called by AJAX to get the HTML content of the page that is to be edited
     * @param unknown $app_id
     * @param unknown $version
     * @param unknown $page_num
     * @return \Sinett\MLAB\BuilderBundle\Controller\JsonModel
     */
    public function getPageAction ($app_id, $version, $page_num) {
    	
    	if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Application ID not specified: %d", $app_id)));
    		
    	}
    	
//create the path to the file to open
        if ($version > 0) {
    		$app_path = $this->container->parameters['mlab']['paths']['app'] .
    					$app->getPath() . 
    					"/" . 
    					$version . 
    					$this->container->parameters['mlab']['cordova']['asset_path'];
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf("Version not specified: %d", $version)));
    		
    	}
    	
    	if ($page_num == 'last') {
    		$pages = glob ( $app_path . "/???.html" );
    		$doc = explode("/", array_pop($pages));
    		$doc = array_pop($doc);
    		
    	} else if ($page_num == 'first') {
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
    				'html' => $html));
    		 
    	} else {
    		return new JsonResponse(array(
    				'result' => 'error',
    				'msg' => sprintf("File does not exists, contact support: %s", "$app_path$doc")));
    		 
    	}
    }
    
    /**
     * Will look through all folders nad see if page is locked, will update the locked_pages array for each app, 
     * see Sinett\MLAB\BuilderBundle\Entity\App->getArray()
     * @param unknown $apps
     */
    public function getLockStatus(&$apps) {
    	
    }
    
}
