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
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            die("OK");
        	$em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

        }

        die("notOK");
        
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
    	
        $form = $this->createFormBuilder($entity)
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
									      ->add('save', 'submit')
        								  ->getForm();
        
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
    	$components = $em->getRepository('SinettMLABBuilderBundle:Component')->findAllByGroups($this->getUser()->getGroups());
    	$app = $em->getRepository('SinettMLABBuilderBundle:App')->findById($id);
    	$url_templates = $this->container->parameters['mlab']['urls']['template'];
    	$url_css = $this->container->parameters['mlab']['urls']['css'];
    	$component_icon_path = $this->container->parameters['mlab']['filenames']['component_icon'];
    	
    	
    	return $this->render('SinettMLABBuilderBundle:App:build_app.html.twig', array(
    			"mlab_app_page_num" => $page_num,
    			"mlab_app_id" => $id, 
    			"mlab_app_version" => $version, 
    			"mlab_components" => $components,
    			"mlab_app" => $app,
    			"mlab_url_templates" => $url_templates,
    			"mlab_url_css" => $url_css,
    			"mlab_component_icon_path" => $component_icon_path,
    	));
    }
    
    /**
     * Will look through all folders nad see if page is locked, will update the locked_pages array for each app, 
     * see Sinett\MLAB\BuilderBundle\Entity\App->getArray()
     * @param unknown $apps
     */
    public function getLockStatus(&$apps) {
    	
    }
    
}
