<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Component;
use Sinett\MLAB\BuilderBundle\Form\ComponentType;

//also get list of apps, see indexAction
use Sinett\MLAB\BuilderBundle\Entity\App;

/**
 * Component controller.
 *
 */
class ComponentController extends Controller
{

    /**
     * Lists all Component entities, in addition find out which have been used and do NOT allow them to be deleted
     *
     */
    public function indexAction()
    {

        $em = $this->getDoctrine()->getManager();
        
//First we get all paths of all apps and check to see what components they use, 
//we do this by looping through the path of all of them and use the xidel command which extracts attributes
//we look at the data-mlab-type attribute. 
//These are returned as a json array, so we mainly merge them all and then send the array through to the render
        $cmd = "xidel %PATH%* -e //div/@data-mlab-type -q --output-format=json-wrapped"; 
        $app_root = $this->container->parameters['mlab']["paths"]["app"];
        $asset_path = $this->container->parameters['mlab']["cordova"]["asset_path"];
        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAll();
        $all_comps_used = array();

        foreach ($apps as $app) {
            $app_path = $app->calculateFullPath($app_root) . $asset_path . "/";
            foreach (glob("$app_path*.html") as $filename) {
                if (filesize($filename) > 0) {
                    $temp_cmd = str_replace("%PATH%", $filename, $cmd);
                    $extracted_data = shell_exec($temp_cmd);
                    $temp_comp = json_decode($extracted_data);
                    if (!is_null($temp_comp[0])) {
                        if (!is_array($temp_comp[0])) {
                            $all_comps_used[] = $temp_comp[0];
                        } else {
                            $all_comps_used = array_merge($all_comps_used, $temp_comp[0]);
                        }
                    }
                }
            }
        }
        $all_comps_used = array_unique($all_comps_used);
        
//now pick up the components, and set canDelete for those who have not been used
        $entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findAllCheckDeleteable($all_comps_used);

        return $this->render('SinettMLABBuilderBundle:Component:index.html.twig', array(
            'entities' => $entities
        ));
    }
    
    /**
     * Creates a new Component entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Component();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            
            $file_mgmt = $this->get('file_management');
            $file_mgmt->setConfig('component');
            $res = $file_mgmt->handleUpload($entity);
            
            if ($res["result"]) {
            
	            $em->persist($entity);
	            $em->flush();
	
	            return new JsonResponse(array('db_table' => 'component',
	            		'action' => 'ADD',
	            		'db_id' => $entity->getId(),
	            		'result' => 'SUCCESS',
	            		'record' => $this->renderView('SinettMLABBuilderBundle:Component:show.html.twig', array('entity' => $entity))));
	        } else {
	        	return new JsonResponse(array('db_table' => 'component',
	        			'db_id' => 0,
	        			'result' => 'FAILURE',
	        			'message' => 'Unable to upload component'));
	        }
	             
        }

        return new JsonResponse(array('db_table' => 'component',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to upload component'));
    }

    /**
    * Creates a form to create a Component entity.
    *
    * @param Component $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Component $entity)
    {
        $form = $this->createForm(new ComponentType(), $entity, array(
            'action' => $this->generateUrl('component_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'app.admin.components.new.create.button'));

        return $form;
    }

    /**
     * Displays a form to create a new Component entity.
     *
     */
    public function newAction()
    {
        $entity = new Component();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:Component:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Component entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Component entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:Component:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Component entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Component entity.');
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Component:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Component entity.
    *
    * @param Component $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Component $entity)
    {
        $form = $this->createForm(new ComponentType(), $entity, array(
            'action' => $this->generateUrl('component_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'app.admin.components.edit.groups.update.button'));

        return $form;
    }
    /**
     * Edits an existing Component entity, this will include an upload
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Component entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            
//check if they have uploaded a file
            if (null === $entity->getZipFile()) {
                $res = array("result" => true);
            } else {
                $file_mgmt = $this->get('file_management');
                $file_mgmt->setConfig('component');
                $res = $file_mgmt->handleUpload($entity, true);
            }
            if ($res["result"]) {
            	$em->flush();

            	return new JsonResponse(array('db_table' => 'component',
            			'action' => 'UPDATE',
            			'db_id' => $id,
            			'result' => 'SUCCESS',
            			'record' => $this->renderView('SinettMLABBuilderBundle:Component:show.html.twig', array('entity' => $entity))));
            	
        	} else {
        		return new JsonResponse(array('db_table' => 'component',
        				'db_id' => $id,
        				'result' => 'FAILURE',
        				'message' => 'Unable to upload component'));
        		
        	}
        	
        }
        
        return new JsonResponse(array('db_table' => 'component',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => 'Unable to upload component'));
        	 
    }
    /**
     * Deletes a Component entity + the directory where the files are stored.
     * The UI is not showing the delete icon for components that are used, so this is safe.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'component',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }

//here we remove the directory for the component files
        $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('component');
        $res = $file_mgmt->removeTempCompFiles($entity, 'component');
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'component',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }

    /**
     * Toggle the enabled flag for a record
     * @param type $id
     */
    public function toggleStateAction($id) {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'component',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => 'Unable to locate component record'));
            
        }

        $entity->setEnabled(!$entity->getEnabled());
            
        $em->flush();
        return new JsonResponse(array('db_table' => 'component',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:Component:show.html.twig', array('entity' => $entity))));
	        	
    }
    
}
