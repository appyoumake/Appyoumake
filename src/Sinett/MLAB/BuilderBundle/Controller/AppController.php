<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Controller for all app related work, primarily the editor, but also the list of apps
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
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;

use Doctrine\ORM\EntityRepository;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Yaml\Parser;

/*use Symfony\Component\Translation\Loader\YamlFileLoader;
use Symfony\Component\Translation\Translator;
use Symfony\Component\Translation\Dumper\JsonFileDumper;
*/

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
    public function indexAction() {
    	$em = $this->getDoctrine()->getManager();
        $entities = $em->getRepository('SinettMLABBuilderBundle:App')->findAll();
        return $this->render('SinettMLABBuilderBundle:App:index.html.twig', array(
            'entities' => $entities,
        ));
        
    }
    
    
    /**
     * Lists all App entities for management by app designer 
     * (similar to the indexAction, but adds many other actionsr)
     * 
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function builderAction()
    {
        $em = $this->getDoctrine()->getManager();
    	$apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroupsSortUpdated($this->getUser()->getGroups());
        return $this->render('SinettMLABBuilderBundle:App:builder.html.twig', array(
    			'apps' => $apps,
                'app_url' => $this->container->getParameter('mlab')["urls"]["app"],
                'app_icon' => $this->container->getParameter('mlab_app')["filenames"]["app_icon"]
    	));
    }

    /**
     * Displays a form to create a new App entity.
     *
     */
    public function newAction() {
    	$em = $this->getDoctrine()->getManager();
    	$entity = new App();
        $entity->setActiveVersion(1); 
    	$file_mgmt = $this->get('file_management');
        $temp_groups = $this->getUser()->getGroups();
        $backgrounds = $file_mgmt->getBackgrounds();
        $foregrounds = $file_mgmt->getForegrounds();
        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroups($temp_groups);
    	$templates = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllByGroups($temp_groups);
        $url_apps = $this->container->getParameter('mlab')['urls']['app'];
    	$url_templates = $this->container->getParameter('mlab')['urls']['template'];
    	$app_icon_path = $this->container->getParameter('mlab_app')['filenames']['app_icon'];
        $tags = '';
        $tag_level_1 = array("<option></option>");
        
//this loop will get the predefined categories for all the groups the current user is a member of
//it will store all entries in a string (they are stored as JSON objects in the DB) + preload the top level entries to put in the first drop down box
        foreach ($temp_groups as $temp_group) {
            $cat = trim($temp_group->getCategories());
            if ($cat) {
                if (strlen($tags)) { $tags .= ','; };
                $tags .= $cat;
                $cat_obj = json_decode($cat);
                foreach ($cat_obj as $tag_tree) {
                    $txt = $tag_tree->text;
                    $tag_level_1[] = "<option value='$txt'>$txt</option>";
                }
            }
        }
        $tags = '[' . $tags . ']';
        
        $form = $this->createAppForm($entity, 'create');
        return $this->render('SinettMLABBuilderBundle:App:properties.html.twig', array(
            'entity' => $entity,
            'apps' => $apps,
            'templates' => $templates,
            'form' => $form->createView(),
            'mode' => 'create',
            'url_templates' => $url_templates,
            'url_apps' => $url_apps,
            'app_icon_path' => $app_icon_path,
            'backgrounds' => $backgrounds,
            'foregrounds' => $foregrounds,
            'icon_font_url' => $this->container->getParameter('mlab')['urls']['icon_font'],
            'icon_text_maxlength' => $this->container->getParameter('mlab_app')['icon_text_maxlength'],
            'icon_default' => $this->container->getParameter('mlab_app')['compiler_service']['default_icon'],
            'tags' => $tags,
            'tag_level_1' => $tag_level_1,
        ));
        
    }

    
    /**
     * Creates a new App entity.
     * It receives relevant data from a regular SYmfony form, then it will (if data is valid):
     * 1: Determine if this is based on a template or an app
     * 2: If app, copy it across
     * 3: If template, 
     * 3.1: Try to create the relevant folder
     * 3.2: If successful, copy across base files from template
     * 4: Redirects to edit the app
     */
    public function createAction(Request $request) {
    	$entity = new App();
        $form = $this->createAppForm($entity, 'create');
        $form->handleRequest($request);

        if ($form->isValid()) {
//store values in array for easy access
            $temp_app_data = $request->request->all();
        	$app_data = $temp_app_data["form"];
            
//get config values, we use the variable in different places below, so pick up both config.yml and parameters.yml entities
        	$config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

//prepare doctrine manager
        	$em = $this->getDoctrine()->getManager();
        	 
//check if they already use this name, if so, quit
            $exists = $em
               ->getRepository('Sinett\MLAB\BuilderBundle\Entity\App')
               ->createQueryBuilder('a')
               ->where('upper(a.name) = upper(:name)')
               ->setParameter('name', $entity->getName())
               ->getQuery()
               ->execute();
            
            
            if ($exists) {
				return new JsonResponse(array(
						'action' => 'ADD',
						'result' => 'FAILURE',
						'message' =>  $this->get('translator')->trans('appController.msg.createAction.1')));
        	}
        	
//prepare file management service
		    $file_mgmt = $this->get('file_management');
		    $file_mgmt->setConfig('app');
		    
//generate the path name and get full path
            $guid = $file_mgmt->GUID_v4();
        	$entity->setPath($guid);
            $entity->setActiveVersion(1);
            $entity->setEnabled(1);
            $temp_app_version = new \Sinett\MLAB\BuilderBundle\Entity\AppVersion();
            $temp_app_version->setVersion(1);
            $temp_app_version->setEnabled(1);
            $temp_app_version->setApp($entity);
            $entity->addAppVersion($temp_app_version);
        	$app_destination = $entity->calculateFullPath($config["paths"]["app"]);
            
//check if GUID is already used for a folder, if so re-generate it
			while (file_exists($app_destination)) { 
                $guid = $file_mgmt->GUID_v4();
                $entity->setPath($guid);
                $app_destination = $entity->calculateFullPath($config["paths"]["app"]);
            }
            
            $entity->setUid($config["compiler_service"]["app_creator_identifier"] . ".$guid");
        	$usr = $this->get('security.token_storage')->getToken()->getUser();
        	$entity->setUser($usr);
        	$entity->setUpdatedBy($usr);
        	
            foreach ($usr->getGroups() as $group) {
        		$entity->addGroup($group);
        	}

//do they want to copy an existing app?
            switch ($temp_app_data["select_base"]) {
               case "existing_app":
                    $orig_app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_data["copyApp"]);
                    $result = false;
                    if ($orig_app) {
                        $result = $file_mgmt->copyAppFiles($app_data["copyApp"], $app_destination);
                    } 

                    if ($result == false) {
                        return new JsonResponse(array(
                                'action' => 'ADD',
                                'result' => 'FAILURE',
                                'message' => $this->get('translator')->trans('appController.msg.unable.copy.app.files')));
                    } 

//update the title of the app in the conf.json file
                    if (file_exists($app_destination . "conf.json")) {
                        $app_conf = json_decode(file_get_contents($app_destination . "conf.json"), true);
                        $app_conf["title"] = $entity->getName();
                    } else {
                        $app_conf = array("title" => $entity->getName());
                    }
                    file_put_contents($app_destination . "conf.json", json_encode($app_conf));
                    break;
        
//otherwise we use the template they specified 
                case "template":
                    $result = $file_mgmt->createAppFromTemplate($entity->getTemplate(), $entity);
                    if ($result !== true) {
                        return new JsonResponse(array(
                                'action' => 'ADD',
                                'result' => 'FAILURE',
                                'message' => $this->get('translator')->trans('appController.msg.createAction.2')));
                    }
                    break;

                case "office_file":
                    break;

                default:
                    return new JsonResponse(array(
                            'action' => 'ADD',
                            'result' => 'FAILURE',
                            'message' => $this->get('translator')->trans('appController.msg.createAction.4')));
        		        		
        	}
        	
            
//now we store the splash file and the icon file (if created)
            if (null != $entity->getSplashFile() && $entity->getSplashFile()->isValid()) {
                $splash_filename = $config["filenames"]["app_splash_screen"] . "." . $entity->getSplashFile()->getClientOriginalExtension();
                if (!move_uploaded_file($entity->getSplashFile()->getPathname(), "$app_destination/$splash_filename")) {
                    return new JsonResponse(array(
                            'action' => 'ADD',
                            'result' => 'FAILURE',
                            'message' => $this->get('translator')->trans('appController.msg.unable.store.splach.screen')));
                }
            }
            
//store icon creatd or use default icon
            if (null != $entity->getIconFile()) {
                $encoded_image = str_replace(' ', '+', $entity->getIconFile());
            } else {
                $encoded_image = str_replace(' ', '+', $config["compiler_service"]["default_icon"]);
            }
            $encoded_image = str_replace("data:image/png;base64,", "", $encoded_image);
            $png_image = base64_decode($encoded_image);

//this will fail both if file = 0 bytes and if it fails to write file.
            if (!file_put_contents("$app_destination/" . $config["filenames"]["app_icon"], $png_image)) {
                return new JsonResponse(array(
                        'action' => 'ADD',
                        'result' => 'FAILURE',
                        'message' => $this->get('translator')->trans('appController.msg.unable.store.icon')));
            }
            
//update the unique APP ID meta tag, stored in index.html so it follows the app as it is copied
            $file_mgmt->func_sed(array("$app_destination/index.html"), $config["compiler_service"]["app_uid_metatag_placeholder"], $entity->getUid());
                        
//finally we save the database record
        	$em->persist($entity);
        	$em->flush();

        	return new JsonResponse(array(
        			'action' => 'ADD',
        			'result' => 'SUCCESS',
        			'mlab_app_page_num' => 1,
        			'mlab_app_id' => $entity->getId(),
        			'mlab_app_version' => $entity->getActiveVersion(),
        			'mlab_app' => $entity->getArrayFlat($config["paths"]["template"]),
                    'html' =>  $this->renderView('SinettMLABBuilderBundle:App:list.html.twig', array('app' => $entity->getArray(), 'app_url' => $config["urls"]["app"], 'app_icon' => $config["filenames"]["app_icon"])))
            );
        }
        
        return new JsonResponse(array(
        		'action' => 'ADD',
        		'result' => 'FAILURE',
                'temp' => $form->getErrors(),
        		'message' => $this->get('translator')->trans('appController.msg.createAction.5')));
                    
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
        $form = $this->createForm(AppType::class, $entity, array(
            'action' => $this->generateUrl('app_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Create'));

        return $form;
    }

    public function createAppForm($entity, $mode) {
        if ($mode == 'create'){
            $action = $this->generateUrl('app_create');
        } else {
            $action = $this->generateUrl('app_update', array('id' => $entity->getId()));
        }
        
        $em = $this->getDoctrine()->getManager();
    	return $this->createFormBuilder($entity, array('attr' => array('id' => 'mlab_form_app')))
				    	->setAction($action)
				    	->setMethod('POST')
				    	->add('name', null, array('required' => true))
				    	->add('description', null, array('required' => true))
				    	->add('splashFile', FileType::class, array('required' => false))
                        ->add('importFile', FileType::class, array('required' => false))
                        ->add('iconFile', HiddenType::class, array('required' => false))
                        ->add('uid', HiddenType::class, array('required' => false))
                        ->add('copyApp', EntityType::class, array( 'class' => 'SinettMLABBuilderBundle:App', 'placeholder' => '', 'required' => true))
				    	->add('keywords', null, array('required' => true))
				    	->add('template', EntityType::class, array( 'class' => 'SinettMLABBuilderBundle:Template', 'placeholder' => '', 'required' => true))
				    	->add('active_version')
				    	->add("copy_app", HiddenType::class, array("mapped" => false))
                        ->add("tags", HiddenType::class)
				    	->add('save', SubmitType::class)
				    	->getForm();
    }
/*TODO: Erase
                        ->add('tagOne', ChoiceType::class, array( 'choices'  => array('Select' => null)))
                        ->add('tagTwo', ChoiceType::class, array( 'choices'  => array('Select' => null)))
                        ->add('tagThree', ChoiceType::class, array( 'choices'  => array('Select' => null)))
 * 
 */
    /**
     * Finds and displays a App entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('appController.createNotFoundException.app'));
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
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        $file_mgmt = $this->get('file_management');
        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('appController.createNotFoundException.app'));
        }

        $backgrounds = $file_mgmt->getBackgrounds();
        $foregrounds = $file_mgmt->getForegrounds();
        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAllByGroups($this->getUser()->getGroups());
    	$templates = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllByGroups($this->getUser()->getGroups());
        $url_apps = $this->container->getParameter('mlab')['urls']['app'];
    	$url_templates = $this->container->getParameter('mlab')['urls']['template'];
    	$app_icon_path = $this->container->getParameter('mlab_app')['filenames']['app_icon'];
        
        $editForm = $this->createAppForm($entity, 'update');
        
        return $this->render('SinettMLABBuilderBundle:App:properties.html.twig', array(
            'entity' => $entity,
            'apps' => $apps,
            'templates' => $templates,
            'form' => $editForm->createView(),
            'mode' => 'update',
            'url_templates' => $url_templates,
            'url_apps' => $url_apps,
            'app_icon_path' => $app_icon_path,
            'backgrounds' => $backgrounds,
            'foregrounds' => $foregrounds,
            'icon_font_url' => $this->container->getParameter('mlab')['urls']['icon_font'],
            'icon_text_maxlength' => $this->container->getParameter('mlab_app')['icon_text_maxlength'],
            'icon_default' => $this->container->getParameter('mlab_app')['compiler_service']['default_icon'],
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
        $form = $this->createForm(AppType::class, $entity, array(
            'action' => $this->generateUrl('app_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Update'));

        return $form;
    }
    
    /**
     * Edits an existing App entity.
     *
     */
    public function updateAction(Request $request, $id) {
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);
        
        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('appController.createNotFoundException.app'));
        }
        
        $editForm = $this->createAppForm($entity, 'update');
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {

//get config values
        	$config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
            
//prepare file management service
		    $file_mgmt = $this->get('file_management');
		    $file_mgmt->setConfig('app');
        	 
//store old name and version, if these are changed we will need to rename folders, etc
            $old_entity = $entity->getArrayFlat($config["paths"]["template"]);
            $old_version = $old_entity["version"];
            $old_path = $old_entity["path"];
        	$entity->generatePath($config["replace_in_filenames"]);
            $app_destination = $entity->calculateFullPath($config["paths"]["app"]);
            
            $new_path = $entity->getPath();
            $new_version = $entity->getVersion();
            $changed_name = $old_path != $new_path;
            $changed_version = $old_version != $new_version;
            
//if name is changed we need to see if this app already exists WITH the same version number as before
            if ($changed_name || $changed_version) { 
                if (file_exists($app_destination)) {
                    return new JsonResponse(array(
                        'action' => 'ADD',
                        'result' => 'FAILURE',
                        'message' => $this->get('translator')->trans('appController.msg.updateAction.1')));
                } else if ($em->getRepository('SinettMLABBuilderBundle:App')->findOneByName($entity->getName())) {
                    return new JsonResponse(array(
                            'action' => 'ADD',
                            'result' => 'FAILURE',
                            'message' => $this->get('translator')->trans('appController.msg.updateAction.1')));
                }
                
//todo move app
//
//update the unique APP ID meta tag, stored in index.html so it follows the app as it is copied
                $file_mgmt->func_sed(array("$app_destination/index.html"), $config["compiler_service"]["app_creator_identifier"] . $old_path, $config["compiler_service"]["app_creator_identifier"] . $new_path);
            }
            
        	$usr = $this->get('security.token_storage')->getToken()->getUser();
        	$entity->setUpdatedBy($usr);
            $entity->setUid($config["compiler_service"]["app_creator_identifier"] . "." . $entity->getPath());
		    
//now we store the splash file and the icon file (if created)
            if (null != $entity->getSplashFile() && $entity->getSplashFile()->isValid()) {
                $splash_filename = $config["filenames"]["app_splash_screen"] . "." . $entity->getSplashFile()->getClientOriginalExtension();
                if (!move_uploaded_file($entity->getSplashFile()->getPathname(), "$app_destination/$splash_filename")) {
                    return new JsonResponse(array(
                            'action' => 'ADD',
                            'result' => 'FAILURE',
                            'message' => $this->get('translator')->trans('appController.msg.unable.store.splach.screen')));
                }
            }
            
//store icon creatd or use default icon
            if (null != $entity->getIconFile()) {
                $encoded_image = str_replace(' ', '+', $entity->getIconFile());
            } else {
                $encoded_image = str_replace(' ', '+', $config["compiler_service"]["default_icon"]);
            }
            $encoded_image = str_replace("data:image/png;base64,", "", $encoded_image);
            $png_image = base64_decode($encoded_image);

//this will fail both if file = 0 bytes and if it fails to write file.
            if (!file_put_contents("$app_destination/" . $config["filenames"]["app_icon"], $png_image)) {
                return new JsonResponse(array(
                        'action' => 'ADD',
                        'result' => 'FAILURE',
                        'message' => $this->get('translator')->trans('appController.msg.unable.store.icon')));
            }
            
                        
//finally we save the database record 
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
        		'message' => $this->get('translator')->trans('appController.msg.updateAction.2')));
            
    }
    
    /**
     * Deletes a App entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($id);
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'app',
        							      'db_id' => $id,
        							  	  'result' => 'failure',
        								  'message' => $this->get('translator')->trans('appController.msg.deleteAction.1')));
        }

        if ($entity->getPublished() != $entity::MARKET_NOT_PUBLISHED) {
            return new JsonResponse(array('db_table' => 'app',
        							      'db_id' => $id,
        							  	  'result' => 'failure',
        								  'message' => $this->get('translator')->trans('appController.msg.deleteAction.2')));
        }
        
        $app_path = $entity->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);
        $app_path = dirname($app_path);
        
        try {
//first we need to remove all groups that have access to this app using the removeGroup
            foreach($entity->getGroups() as $group) {
                $entity->removeGroup($group);
            }

//same for the versions an app can have
            foreach($entity->getAppVersions() as $version) {
                $em->remove($version);
            }
            
//finally delete app directory
            $em->remove($entity);
            $em->flush();
            
//finally delete the actual files, need to do N_cache folders first as we are not able to get hold of broken symlinks
            foreach(glob($app_path . '/*cache') as $cache_folder) { 
                $this->rmdir($cache_folder);
            }
            $this->rmdir($app_path);
            
        } catch (Exception $e) {
            return new JsonResponse(array('db_table' => 'app',
        							  'db_id' => $id,
        							  'result' => 'failure',
        						 	  'message' => $e->getMessage()));
        } 
        
        return new JsonResponse(array('db_table' => 'app',
        							  'db_id' => $id,
        							  'result' => 'success',
        						 	  'message' => ''));
    }

/******* EDIT FUNCTIONALITY *******/
    
/**
 * Runs the pre-compile processing function required for final HTML pages, and then redirects to show the cached files
 * @param type $app_id
 * @return \Symfony\Component\HttpFoundation\Response
 */
    public function appPreviewAction($app_id) {
        if ($app_id < 1) {
    		return new Response("No app id specified");
    	}
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        $request = $this->container->get('request');

        $file_mgmt = $this->get('file_management');
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $res = $file_mgmt->preCompileProcessingAction($app, $config);
        
        if ($res["result"] == "success") {
            return $this->redirect($request->getSchemeAndHttpHost() . $config["urls"]["app"] . $app->getPath() . "/" . $app->getActiveVersion() . "_cache/index.html");
        } else {
            return new Response( "Unable to pre-process app: " . implode("<br>",$res) );
        }
    }
    
/**
 * Opens the app page editor, loads initial app and various config details
 * @param type $id
 * @param type $page_num
 */
    public function buildAppAction($id, $page_num) {
/*
    	
// pick up config from parameters.yml, we use this mainly for paths
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
    	unset($config["replace_in_filenames"]);
    	unset($config["verify_uploads"]);

//load all the components        
    	$file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('component');*/
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }
        
        $yaml = new Parser();
        $temp = $yaml->parse(@file_get_contents($this->get('kernel')->getRootDir() . '/../src/Sinett/MLAB/BuilderBundle/Resources/translations/messages.' . $this->getUser()->getLocale() . '.yml'));

    	return $this->render('SinettMLABBuilderBundle:App:build_app.html.twig', array(
    			"mlab_app_page_num" => $page_num,
    			"mlab_app_id" => $id, 
                "mlab_appbuilder_root_url" => $this->generateUrl('app_builder_index'),
                "mlab_translations" => json_encode($temp)
    	));
    }
    
    
/* LOADING DIFFERENT INFO FOR BUILDER, ALL CALLED FROM AJAX, RETURNING JSON */
    
/**
 * Returns basic variables from config file and app
 * @param type $app_id
 * @param type $page_num
 */
    public function loadBuilderVariablesAction($app_id, $page_num) {
    	$em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

    	
// pick up config from parameters.yml, we use this mainly for paths
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('app');

//get app details + list of pages
        $app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
        $app_path = $app->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);

        $mlab_app_data = $app->getArrayFlat($config["paths"]["template"]);
        $mlab_app_data["page_names"] = $file_mgmt->getPageIdAndTitles($app);

//get checksum for app, excluding the file we just opened
        $current_page_file_name = $file_mgmt->getPageFileName($app_path, $page_num);
        $mlab_app_checksum = $file_mgmt->getAppMD5($app, $current_page_file_name);
        
//pick up previously compiled files
        $comp_files = array();
        foreach ($config["compiler_service"]["supported_platforms"] as $platform) {
            $compiled_app = $file_mgmt->getAppConfigValue($app, $config, "latest_executable_" . $platform);
            if ($compiled_app !== false) {
                $comp_files[$platform] = $compiled_app;
            }
        }

//dont need everything in config file when return config settings
    	unset($config["replace_in_filenames"]);
    	unset($config["verify_uploads"]);

        return new JsonResponse(array(
                "result" => "success",
    			"mlab_app_page_num" => $page_num,
    			"mlab_app" => $mlab_app_data,
    			"mlab_config" => $config,
                "mlab_uid" => $this->getUser()->getId() . "_" . time() . "_" . rand(1000, 9999),
                "mlab_current_user_email" => $this->getUser()->getEmail(),
                "mlab_app_checksum" => $mlab_app_checksum,
                "mlab_compiled_files" => $comp_files,
                
                "mlab_urls" => array (  "new" => $this->generateUrl('app_create'),
                                        "edit" => $this->generateUrl('app_edit', array('id' => '_ID_')),
                                        "page_save" => $this->generateUrl('app_builder_page_save',  array('app_id' => '_ID_', 'page_num' => '_PAGE_NUM_', 'old_checksum' => '_CHECKSUM_')),
                                        "component_added" => $this->generateUrl('app_builder_component_added',  array('comp_id' => '_COMPID_', 'app_id' => '_APPID_')),
                                        "component_upload_file" => $this->generateUrl('app_builder_component_upload',  array('comp_id' => '_COMPID_', 'app_id' => '_APPID_')),
                                        "component_helpfile" => $this->generateUrl('help_get_component_helpfile',  array('comp_id' => '_COMPID_')),
                                        "uploaded_files" => $this->generateUrl('app_builder_get_uploaded_files',  array('file_type' => '_FILETYPE_', 'app_id' => '_APPID_')),
                                        "editor_closed" => $this->generateUrl('app_builder_editor_closed',  array('uid' => '_UID_')),
                                        "app_unlock" => $this->generateUrl('app_builder_app_unlock'),
                                        "page_get" => $this->generateUrl('app_builder_page_get',  array('app_id' => '_ID_', 'page_num' => '_PAGE_NUM_', 'uid' => '_UID_', 'app_open_mode' => 'false')),
                                        "app_open" => $this->generateUrl('app_builder_page_get',  array('app_id' => '_ID_', 'page_num' => '_PAGE_NUM_', 'uid' => '_UID_', 'app_open_mode' => '_OPEN_MODE_')),
                                        "page_new" => $this->generateUrl('app_builder_page_new',  array('app_id' => '_ID_', 'uid' => '_UID_')),
                                        "page_copy" => $this->generateUrl('app_builder_page_copy',  array('app_id' => '_ID_', 'page_num' => '_PAGE_NUM_', 'uid' => '_UID_')),
                                        "page_delete" => $this->generateUrl('app_builder_page_delete',  array('app_id' => '_ID_', 'page_num' => '_PAGE_NUM_', 'uid' => '_UID_')),
                                        "page_reorder" => $this->generateUrl('app_builder_page_reorder',  array('app_id' => '_ID_', 'from_page' => '_FROM_PAGE_', 'to_page' => '_TO_PAGE_', 'uid' => '_UID_')),
                                        "file_import" => $this->generateUrl('app_import_file'),
                                        "feature_add" => $this->generateUrl('app_builder_feature_add',  array('app_id' => '_APPID_', 'comp_id' => '_COMPID_')),
                                        "storage_plugin_add" => $this->generateUrl('app_builder_storage_plugin_add',  array('app_id' => '_APPID_', 'storage_plugin_id' => '_STORAGE_PLUGIN_ID_')),
                                        "app_preview" => $this->generateUrl('app_preview',  array('app_id' => '_APPID_')),
                    
                                        "mkt_get_tagged_users" => $this->generateUrl('mkt_get_tagged_users', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'tag' => '_TAG_')), 
                                        "mkt_submit_app_details" => $this->generateUrl('mkt_submit_app_details', array('window_uid' => '_WINDOW_UID_', 'app_details' => '_APP_DETAILS_')), 
                                        "mkt_upload_app_file" => $this->generateUrl('mkt_upload_app_file', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'app_uid' => '_APP_UID_', 'replace_existing' => '_REPLACE_EXISTING_')), 
                                        "mkt_publish_app" => $this->generateUrl('mkt_publish_app', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'app_uid' => '_APP_UID_', 'version' => '_VERSION_')), 
                                        "mkt_unpublish_app" => $this->generateUrl('mkt_unpublish_app', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'app_uid' => '_APP_UID_', 'version' => '_VERSION_', 'action' => '_ACTION_')), 
                                        "mkt_login" => $this->generateUrl('mkt_login', array('window_uid' => '_WINDOW_UID_', 'username' => '_USERNAME_', 'password' => '_PASSWORD_')), 
                                        "mkt_create_user" => $this->generateUrl('mkt_create_user', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'user_details' => '_USER_DETAILS_')), 
                                        "mkt_get_new_users" => $this->generateUrl('mkt_get_new_users', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_')), 
                                        "mkt_set_user_state" => $this->generateUrl('mkt_set_user_state', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'app_uid' => '_APP_UID_', 'state' => '_STATE_')), 
                                        "mkt_set_tagged_users_state" => $this->generateUrl('mkt_set_tagged_users_state', array('window_uid' => '_WINDOW_UID_', 'token' => '_TOKEN_', 'tag' => '_TAG_', 'state' => '_STATE_')), 
                    
                                        "cmp_get_app_status" => $this->generateUrl('cmp_get_app_status',  array('window_uid' => '_WINDOW_UID_', 'app_id' => '_ID_', 'app_version' => '_VERSION_', 'platform' => '_PLATFORM_')),
                                        "cmp_get_app_source" => $this->generateUrl('cmp_get_app_source',  array('window_uid' => '_WINDOW_UID_', 'app_id' => '_ID_', 'app_version' => '_VERSION_')),
                                        "cmp_upload_website" => $this->generateUrl('cmp_upload_website',  array('window_uid' => '_WINDOW_UID_', 'app_id' => '_ID_', 'app_version' => '_VERSION_')),
                                        "cmp_get_app_process" => $this->generateUrl('cmp_get_app_process', array('window_uid' => '_WINDOW_UID_', 'app_id' => '_ID_', 'app_version' => '_VERSION_', 'platform' => '_PLATFORM_')), 
                    
                                        "components_root_url" =>  $config["urls"]["component"]
                                    )
    	));
    }
    
/**
 * Returns list of components
 * @param type $app_id
 */
    public function loadBuilderComponentsAction($app_id) {
    	$em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }
    	
//load all the components        
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
    	$file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('component');
        
    	$accessible_components = $em->getRepository('SinettMLABBuilderBundle:Component')->findAccessByGroups($this->getUser()->getGroups());
    	$components = $file_mgmt->loadComponents($accessible_components, $config["paths"]["component"], $config["component_files"], $app_id);
    	
    	return new JsonResponse(array("result" => "success", "mlab_components" => $components));
    }
    
/* END LOADING DIFFERENT INFO FOR BUILDER */
    
    /**
     * Always called by AJAX to get the HTML content of the page that is to be edited
     * Opens an app on the front page:
     * 1: Check page is not locked
     * 2: Lock it
     * 3: Unlock all other pages!
     * 4: Render page
     * 5: In page use getPageHtml() call in this controller
     * @param unknown $app_id
     * @param unknown $page_num
     * @return \Sinett\MLAB\BuilderBundle\Controller\JsonModel
     */
    public function getPageAction ($app_id, $page_num, $uid, $app_open_mode = false) {
    	if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    		
    	}
    	
//create the path to the file to open
        $app_path = $app->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);
    	
//calculate page number
	    $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('app');
        $doc = $file_mgmt->getPageFileName($app_path, $page_num);
        if (!$doc) {
            return new JsonResponse(array(
    					'result' => 'error',
    					'msg' => sprintf($this->get('translator')->trans('appController.msg.page.not.specified') . ": %d", $page_num)));
        }

//if a page does not eist, then go to last
        if (!file_exists("$app_path$doc")) {
            $doc = $file_mgmt->getPageFileName($app_path, "last");
        }
        
    	if (file_exists("$app_path$doc")) {
            $page = $file_mgmt->getPageContent("$app_path$doc", $uid);
            if (preg_match('/<title>(.+)<\/title>/', $page["html"], $matches)) {
                $title = $matches[1];
            } else {
                $title = "Untitled";
            }
            
            if ($app_open_mode) {
//here we pick up a list of compiled apps, this has to come here rather than when app is opened as the URL is manipualted after app is opened
//only happens if $app_open_mode = true, this is when we call this function from the mlab.dt.manage,ent.app_open function

                $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
                $comp_files = array();
                foreach ($config["compiler_service"]["supported_platforms"] as $platform) {
                    $compiled_app = $file_mgmt->getAppConfigValue($app, $config, "latest_executable_" . $platform);
                    if ($compiled_app !== false) {
                        $comp_files[$platform] = $compiled_app;
                    }
                }
            }
            
    		return new JsonResponse(array(
    				'result' => 'success',
    				'html' => $page["html"],
    				'lock_status' => $page["lock_status"],
                    'page_num_sent' => $page_num,
                    'page_num_real' => intval($doc),
                    'app_id' => $app_id,
                    'page_title' => $title,
                    'only_index' => !file_exists("$app_path" . "001.html"),
                    "compiled_files" => $comp_files
                ));
    		 
    	} else {
    		return new JsonResponse(array(
    				'result' => 'error',
    				'msg' => sprintf($this->get('translator')->trans('appController.msg.getPageAction') . ": %s", "$app_path$doc")));
    		 
    	}
    }
    
/**
 * This is the function that stores a page in the app
 * @param type $app_id
 * @param type $page_num
 */
    public function putPageAction (Request $request, $app_id, $page_num, $old_checksum) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}

        if (!$page_num) {
            return new JsonResponse(array(
    					'result' => 'error',
    					'msg' => sprintf($this->get('translator')->trans('appController.msg.page.not.specified') . ": %d", $page_num)));
        }

//create the path to the file to open
        $app_path = $app->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);
        
//create file management object
	    $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('app');

        $temp_data = $request->request->all();
        $html = $temp_data["html"];
        $title = $temp_data["title"];
        $res = $file_mgmt->savePage($app, $page_num, $title, $html);
        if ($res === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => $this->get('translator')->trans('appController.msg.putPageAction')));
        }
        
/* Returns data about the app that may have been changed by another user working on the same app
   see loadBuilderVariablesAction for more on what happens here */

//we now use the file management plugin to obtain the checksum, 
//for this checksum we exclude the current file as we are the only ones who can change it
        $current_page_file_name = $file_mgmt->getPageFileName($app_path, $page_num);
        $mlab_app_checksum = $file_mgmt->getAppMD5($app, $current_page_file_name);
        $mlab_app_data = $app->getArrayFlat($this->container->getParameter('mlab')["paths"]["template"]);

//we do not scan for further changes if no files were changed
        if ($mlab_app_checksum != $old_checksum) {
            $mlab_app_data["page_names"] = $file_mgmt->getPageIdAndTitles($app);
            $app_info = array(
                "result" => "file_changes",
    			"mlab_app" => $mlab_app_data,
                "mlab_app_checksum" => $mlab_app_checksum
            );
        } else {
            $app_info = array(
                "result" => "no_file_changes",
    			"mlab_app" => $mlab_app_data
            );
        }

        $app->setUpdated(new \DateTime());
        $em->flush();
                
        return new JsonResponse(array(
            'result' => 'success',
            'app_info' => $app_info));

    }
    
    /**
     * Removes all locks by the specified uid
     * @param type $uid
     */
    public function closeEditorAction($uid) {
        $file_mgmt = $this->get('file_management');
        $file_mgmt->clearLocks($uid);
        return new JsonResponse( array( 'result' => 'success' ) );
    }
    
    /**
     * New page is created by just making an empty file with the right name, this makes sure that if more than one person works on 
     * the app it will not create two with the same name
     * @param type $app_id
     */
    public function newPageAction (Request $request, $app_id, $uid) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    		
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        
//copy the template file to the app
// not required anymore        $title = $request->request->all()["title"];
        $file_mgmt = $this->get('file_management');
        $new_page_num = $file_mgmt->newPage($app);
        if ($new_page_num === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => $this->get('translator')->trans('appController.msg.app.id.not.specified')));
        }
        
//update file counter variable in JS
        /* TODO: Remove and replace with precompile processing 
         * $total_pages = $file_mgmt->getTotalPageNum($app);
         
        $file_mgmt->updateAppParameter($app, "mlabrt_max", $total_pages);
*/
    	return $this->redirect($this->generateUrl('app_builder_page_get', array('app_id' => $app_id, 'page_num' => $new_page_num, 'uid' => $uid, 'app_open_mode' => 'false')));
    }

    /**
     * Copy a page.
     * @param type $app_id
     * @param type $page_num
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function copyPageAction ($app_id, $page_num, $uid) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
    	
//create the name of the file to create
	    $file_mgmt = $this->get('file_management');
        $new_page_num = $file_mgmt->copyPage($app, $page_num);
        if ($new_page_num === false) {
            return new JsonResponse(array(
                'result' => 'failure',
                'msg' => $this->get('translator')->trans('appController.msg.copyPageAction')));
        }
        
//update file counter variable in JS
        $total_pages = $file_mgmt->getTotalPageNum($app);
        /*$file_mgmt->updateAppParameter($app, "mlabrt_max", $total_pages);*/

    	return $this->redirect($this->generateUrl('app_builder_page_get', array('app_id' => $app_id, 'page_num' => $new_page_num, 'uid' => $uid, 'app_open_mode' => 'false')));
        
    }
    
    /**
     * Delete a page. Will fail if someone has a page open that has a number higher than page to delete
     * @param type $app_id
     * @param type $page_num
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function deletePageAction ($app_id, $page_num, $uid) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
    	
//get the name of the file to delete
	    $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('app');
        
//delete file, returns number of file to open if successful
        $res = $file_mgmt->deletePage($app, $page_num, $uid);
        if ($res === false) {
            return new JsonResponse(array(
                    'result' => 'error',
                    'msg' => $this->get('translator')->trans('appController.msg.deletePageAction')));
        } else {
            
//update file counter variable in JS
            $total_pages = $file_mgmt->getTotalPageNum($app);
            /*$file_mgmt->updateAppParameter($app, "mlabrt_max", $total_pages);*/
            return $this->redirect($this->generateUrl('app_builder_page_get', array('app_id' => $app_id, 'page_num' => $res, 'uid' => $uid, 'app_open_mode' => 'false')));
            
        }
    }    
    
    /**
     * imports a PPT/DOC file into current app using external python code
     * 
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function importFileAction (Request $request) {
        
//get config values
       	$config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        
//store values in array for easy access
        $temp_app_data = $request->request->all();
        $app_id = $temp_app_data["app_id"];

//check if they are allowed to access this app
        $em = $this->getDoctrine()->getManager();
        if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
            die($this->get('translator')->trans('appController.die.no.access'));
        }

        $entity = $em->getRepository('SinettMLABBuilderBundle:App')->find($app_id);
        if (!$entity) {
            return new JsonResponse(array('db_table' => 'app',
                    'db_id' => $id,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('appController.createNotFoundException.app')));    
        }
        $app_destination =  $entity->calculateFullPath($config["paths"]["app"]);

//check and verify the uploaded file
        $file = $request->files->get("mlabImportFile");
        $py_pth = $config["convert"]["python_bin"];
        $cv_bin = $config["convert"]["converter_bin"];
        $cv_conf = $config["convert"]["config"];
        $cv_pth = $config["convert"]["converter_path"];
        $file_name = $file->getPathname();
        $new_file_name = $file_name . "." . $file->guessExtension();
        rename($file_name, $new_file_name);

/*
python document2HTML.py -c <filbane til konfig> -i <filbane til dokument som skal konverteres> -o <katalog til output>
I tillegg kan man bruke: -t <tag det skal splittes på> -a <attributt som splitte-kriterium (f.eks. id="Tittel*")
*/
        $cmd = "$py_pth $cv_pth/$cv_bin -c $cv_pth/$cv_conf -i $new_file_name -o $app_destination";
        //$cmd = "cp /home/utvikler/workspace/mlab_elements/*.html $app_destination";
        $cmd_res = passthru($cmd);
               
        return new JsonResponse(array('action' => 'ADD', 'result' => 'SUCCESS', 'message' => $cmd_res, 'cmd' => $cmd));
    }
                    
                    
    /**
     * Moves a page to a different position
     * @param type $app_id
     * @param type $page_num
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function reorderPageAction ($app_id, $from_page, $to_page, $uid) {
        
//for the time being do not allow them to change the index page
        if ($from_page == "index" || $to_page == "index") {
            return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.cant.move.indexpage') . ": %d", $app_id)));
        }
        
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
    	
//get the name of the file to delete
	    $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('app');
        
//renames the individual page files, returns page from and to variables so frontend can update variables
        $res = $file_mgmt->reorderPage($app, $from_page, $to_page, $uid);
        if ($res === false) {
            return new JsonResponse(array(
                    'result' => 'error',
                    'msg' => $this->get('translator')->trans('appController.msg.reorderPageActionError'),
                    'from_page' => $from_page,
                    'to_page' => $to_page));
        } else {
            return new JsonResponse(array(
                    'result' => 'success',
                    'msg' => $this->get('translator')->trans('appController.msg.reorderPageActionSuccess'),
                    'from_page' => $from_page,
                    'to_page' => $to_page,
                    'page_names' => $file_mgmt->getPageIdAndTitles($app)));
        }
    }
    
    function removeLocksAction() {
	    $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('app');
        $res = $file_mgmt->clearAllLocks();
        return new JsonResponse(array());
    }
    
    /**
     * Handles a file being uploaded by a component
     * @param \Symfony\Component\HttpFoundation\Request $request
     * @param type $app_id
     * @param type $comp_id
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function componentUploadAction(Request $request, $app_id, $comp_id) {
        
//check if upload successful and validate parameters
        $test = empty($request->files->get('mlab_files'));
        if ($test) {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => $this->get('translator')->trans('appController.msg.file.upload.error') . " " . ini_get('post_max_size') ));
        }
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        if ( !isset($comp_id) ) {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.component.type.not.specified') . ": %s", $comp_id)));
        }

//load libraries
        $file_mgmt = $this->get('file_management');
        
//get paths
        $path_app = $app->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);
        $path_component = $this->container->getParameter('mlab')['paths']['component'] . $comp_id . "/";
        $replace_chars = $this->container->getParameter('mlab_app')['replace_in_filenames'];
        $urls = array();
        
//loop through list of files and determine mime type and folder, generate name and move or process file
//then return the file path
        foreach($request->files as $uploadedFile) {
            $width = $height = $type = $attr = null;
            $f_name_parts = pathinfo($uploadedFile->getClientOriginalName());
            $f_name = $f_name_parts['filename'] . "-" . md5_file($uploadedFile->getRealPath()); //$file_mgmt->GUID_v4();
            $f_ext = $uploadedFile->guessExtension();
            $f_mime = $uploadedFile->getMimeType();
            
//check to see if the mime type is allowed
            $sub_folder = false;
            foreach ($this->container->getParameter('mlab_app')['uploads_allowed'] as $folder => $formats) {
                if (in_array($f_mime, $formats)) {
                    $sub_folder = $folder;
                    break;
                }
            }
            
            if ( !$sub_folder ) {
                return new JsonResponse( array(
                    'result' => 'failure',
                    'msg' => $this->get('translator')->trans('appController.msg.componentUploadAction.1')) );
            }

//if the component has a routine to process the file, then we call this.
//otherwise we just copy the file
            $process_file = false;
            $temp_class_name = "mlab_ct_" . $comp_id;

            if (!file_exists($path_component . "server_code.php")) {
                $process_file = false;
            } else if (!class_exists($temp_class_name) && !@(include($path_component . "server_code.php"))) {
                return new JsonResponse(array(
                    'result' => 'failure',
                    'msg' => $this->get('translator')->trans('appController.msg.componentUploadAction.2')));
            }

            if (class_exists($temp_class_name)) {
                $component_class = new $temp_class_name();
                if (method_exists($component_class, "onUpload")) {
                    $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
                    $url = $component_class->onUpload($uploadedFile->getRealPath(), $f_mime, $path_app, $sub_folder, $f_name, $f_ext, $path_component, $comp_id, $config);
                    if (!$url) {
                        return new JsonResponse(array(
                            'result' => 'failure',
                            'msg' => $this->get('translator')->trans('appController.msg.componentUploadAction.3')));
                    }
                    $process_file = true;
                    $urls[] = $url;
                }
            }
            
//no onupload processing, so we just copy the file            
            if (!$process_file) {            
                $uploadedFile->move($path_app . $sub_folder, $f_name . "." . $f_ext);
                $urls[] = $sub_folder . "/" . $f_name . "." . $f_ext;
            }
        }

//we now return an array of URLs (most of the time it will only be one)
        return new JsonResponse(array(
            'result' => 'success',
            "urls" => $urls));
    }

/**
 * Whenever a component is added on the front end this function is called to copy files if required and run the server_code code
 * @param type $app_id
 * @param type $comp_id
 * @return \Sinett\MLAB\BuilderBundle\Controller\JsonModel|\Symfony\Component\HttpFoundation\JsonResponse
 */
    public function componentAddedAction($app_id, $comp_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        
        if ( !isset($comp_id) ) {
    		return new JsonResponse(array(
    			'result' => 'failure',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.component.type.not.specified') . ": %s", $comp_id)));
        }

        $file_mgmt = $this->get('file_management');
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        return new JsonResponse($file_mgmt->componentAdded($app_id, $app, $comp_id, $config));
    }
    
/**
 * This will add the HTML code for a feature to the index.html file if this is not being edited right now
 * @param type $app_id
 * @param type $comp_id
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    public function featureAddAction($app_id, $comp_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}

//get config etc
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $doc = "index.html";
        $app_path = $app->calculateFullPath($this->container->getParameter('mlab')['paths']['app']);

//load the component they want to add
	    $file_mgmt = $this->get('file_management');
    	$file_mgmt->setConfig('component');
    	$component = $file_mgmt->loadSingleComponent($app_id, $config["paths"]["component"], $comp_id, $config["component_files"]);        

//insert into index.html
    	if (file_exists("$app_path$doc") && $file_mgmt->addFeature("$app_path$doc", $comp_id, $component)) {
    		return new JsonResponse(array('result' => 'success', 'component_id' => $comp_id));
    	} else {
    		return new JsonResponse(array(
    				'result' => 'error',
    				'msg' => sprintf($this->get('translator')->trans('appController.msg.featureAddAction.1') . $comp_id . $this->get('translator')->trans('appController.msg.featureAddAction.2'))));
    	}
    }
    
/**
 * This will add the HTML code for a feature to the index.html file if this is not being edited right now
 * @param type $app_id
 * @param type $comp_id
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    public function storagePluginAddAction($app_id, $storage_plugin_id) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        
        if (empty($storage_plugin_id)) {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => get('translator')->trans('appController.msg.storagePluginAddAction.1')));
        }

//get config etc
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $path_app_js = $app->calculateFullPath($config['paths']['app']) . "/js/";
        $path_component = $config['paths']['component'] . $storage_plugin_id . "/";
        $path_app_include_file = $path_app_js . "include_comp.txt";

//check if path to component and app exists
        if ( is_dir($path_component) && is_dir($path_app_js) ) {

//1: Copy JS file, it is called code_rt.js, but needs to be renamed as all JS files for components have same name to begin with
//   We use the component name as a prefix
            if (file_exists( $path_component . "code_rt.js") && !file_exists( $path_app_js . $storage_plugin_id . "_code_rt.js")) {
                if (!@copy($path_component . "code_rt.js", $path_app_js . $storage_plugin_id . "_code_rt.js")) {
                    return new JsonResponse(array(
                        'result' => 'failure',
                        'msg' => sprintf($this->get('translator')->trans('appController.msg.storagePluginAddAction.2') . ": %s", $storage_plugin_id)));
                }

                $include_items = file($path_app_include_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if (!in_array("/js/" . $storage_plugin_id . "_code_rt.js", $include_items)) {
                    $include_items[] = "/js/" . $storage_plugin_id . "_code_rt.js";
                }
                
                file_put_contents($path_app_include_file, implode("\n", $include_items));
            }

            return new JsonResponse(array('result' => 'success', 'storage_plugin_id' => $storage_plugin_id));
        }
        
    }
    
//function to return all files of a certain type (video, audio, image) to the front end so 
//app creator can re-use already uploaded files
    public function getUploadedFilesAction($app_id, $file_type) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}

//get config etc
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $app_path = $app->calculateFullPath($config['paths']['app']) . "$file_type/";
        $file_url = $app->calculateFullPath($config["urls"]["app"]) . "$file_type/"; //we have reset the base path in the editor, so this will work
        $files = array();
        switch ($file_type) {
            case "video":
                $search = "*.png";
                break;
            case "image":
                $search = "*";
                break;
            case "audio":
                $search = "*.txt";
                break;
            default:
                $search = "*";
                break;
        }
        
        foreach (glob($app_path . $search) as $file) {
            $files[$file_url . basename($file)] = basename($file);
        }

        return new JsonResponse(array('result' => 'success', 'files' => $this->renderView('SinettMLABBuilderBundle:App:options.html.twig', array('files' => $files))));
        
    }

/**
 * Functions that are called from the app listing
 */
    
    
/**
 * This function is just updating the active_version field of the selected app. 
 * The versions are selected from a dropdown list which picks up all versions from the app_version table.
 * @param type $app_id
 * @param type $version
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    public function setActiveVersionAction($app_id, $version) {
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        
        $app->setActiveVersion($version);
        $em->flush();
        
        return new JsonResponse(array(
    			'result' => 'success',
    			'new_version' => $version));
    }
    
/**
 * This function will copy the selected version of an app and create a new version linked to the same app record
 * but with a new app_version record
 * @param type $app_id
 * @param type $increment
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
    public function createNewVersionAction($app_id, $increment) {
        $version_increment = floatval($increment);
        if ($version_increment != 0.1 && $version_increment != 1) {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => $this->get('translator')->trans('appController.msg.createNewVersionAction') . ": " . $increment));
            
        }
        
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
            $branches = $em->getRepository('SinettMLABBuilderBundle:App')->findByName($app->getName());
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}

//get config values
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

//get new version number and copy files before adding the version record 
        $file_mgmt = $this->get('file_management');
        $copy_from_version_num = $app->getActiveVersion();
        $new_version_num = $file_mgmt->getNewAppVersionNum($app, $branches, $increment);

      	$app_source = $app->calculateFullPath($config["paths"]["app"]);
        $app_destination = str_replace("/$copy_from_version_num/", "/$new_version_num/", $app_source);
        
        $result = false;
        $result = $file_mgmt->copyAppFiles($app_source, $app_destination);

        if ($result == false) {
            return new JsonResponse(array(
                    'action' => 'ADD',
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('appController.msg.unable.copy.app.files')));
        } else {

            $temp_app_version = new \Sinett\MLAB\BuilderBundle\Entity\AppVersion();
            $temp_app_version->setVersion($new_version_num);
            $temp_app_version->setEnabled(1);
            $temp_app_version->setApp($app);
            $app->addAppVersion($temp_app_version);
            $app->setActiveVersion($new_version_num);
            $em->flush();
            
            return new JsonResponse(array(
    			'result' => 'success',
    			'new_version' => $new_version_num));
        }
        
    }

    public function createNewBranchAction($app_id) {
        
        if ($app_id > 0) {
	    	$em = $this->getDoctrine()->getManager();
    		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($app_id);
            if (!$em->getRepository('SinettMLABBuilderBundle:App')->checkAccessByGroups($app_id, $this->getUser()->getGroups())) {
                die($this->get('translator')->trans('appController.die.no.access'));
            }
            $branches = $em->getRepository('SinettMLABBuilderBundle:App')->findByName($app->getName());
    	} else {
    		return new JsonResponse(array(
    			'result' => 'error',
    			'msg' => sprintf($this->get('translator')->trans('appController.msg.app.id.not.specified') . ": %d", $app_id)));
    	}
        
//now we calculate the new branch number
        $new_version_num = 0;
        foreach ($branches as $branch) {
            $check_versions = $branch->getVersionRange();
            $new_version_num = max($new_version_num, $check_versions["high"]);
        }
        $new_version_num = floor($new_version_num + 1);

//get config values
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));

//get new version number and copy files before adding the version record 
        $file_mgmt = $this->get('file_management');
        $copy_from_version_num = $app->getActiveVersion();

        $guid = $file_mgmt->GUID_v4();
        $check_app = $em->getRepository('SinettMLABBuilderBundle:App')->findByUid($config["compiler_service"]["app_creator_identifier"] . ".$guid");

        while ($check_app) { 
            $guid = $file_mgmt->GUID_v4();
            $check_app = $em->getRepository('SinettMLABBuilderBundle:App')->findByUid($config["compiler_service"]["app_creator_identifier"] . ".$guid");
        }

        $app_source = $app->calculateFullPath($config["paths"]["app"]);
        $app_destination = str_replace("/" . $app->getPath() . "/$copy_from_version_num/", "/$guid/$new_version_num/", $app_source);
        
        $result = false;
        $result = $file_mgmt->copyAppFiles($app_source, $app_destination);

        if ($result == false) {
            return new JsonResponse(array(
                    'action' => 'ADD',
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('appController.msg.unable.copy.app.files')));
        } else {
            $new_branch = new App;
            $new_branch->setTemplate($app->getTemplate());
            $new_branch->setName($app->getName());
            $new_branch->setDescription($app->getDescription());
            $new_branch->setKeywords($app->getKeywords());
            $new_branch->setEnabled($app->getEnabled());
            $new_branch->setTags($app->getTags());
            $usr = $this->get('security.token_storage')->getToken()->getUser();
        	$new_branch->setUser($usr);
        	$new_branch->setUpdatedBy($usr);
            $new_branch->setActiveVersion($new_version_num);
        	$new_branch->setPath($guid);
            $new_branch->setUid($config["compiler_service"]["app_creator_identifier"] . ".$guid");

            foreach ($usr->getGroups() as $group) {
        		$new_branch->addGroup($group);
        	}
            
            $temp_app_version = new \Sinett\MLAB\BuilderBundle\Entity\AppVersion();
            $temp_app_version->setVersion($new_version_num);
            $temp_app_version->setEnabled(1);
            $new_branch->addAppVersion($temp_app_version);
            $temp_app_version->setApp($new_branch);

            $em->persist($new_branch);
            $em->flush();

            
            return new JsonResponse(array(
    			'result' => 'success',
    			'new_version' => $new_version_num,
                'html' =>  $this->renderView('SinettMLABBuilderBundle:App:list.html.twig', array('app' => $new_branch->getArray(), 'app_url' => $config["urls"]["app"], 'app_icon' => $config["filenames"]["app_icon"]))));
        }
        
    }
    
    private function rmdir($dir) { 
        foreach(glob($dir . '/*') as $file) { 
            if (is_link($file)) {
                error_log("SYMLINK = " . $file);
                unlink($file); 
            } else if (is_dir($file)) { 
                error_log("DIR = " . $file);
                $this->rmdir($file); 
            } else {
                error_log("FILE = " . $file);
                unlink($file); 
            }
        }; 
        if (is_link($dir)) {
            error_log("SYMLINK = " . $dir);
            unlink($dir); 
        } else {
            error_log("TOPDIR = " . $dir);
            rmdir($dir);
        }
    }
    
    
}
