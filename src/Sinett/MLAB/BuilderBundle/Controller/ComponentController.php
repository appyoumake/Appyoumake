<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Takes care of basic component related work, including uploading components
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Component;
use Sinett\MLAB\BuilderBundle\Form\ComponentType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\EntityType;

//also get list of apps, see indexAction
use Sinett\MLAB\BuilderBundle\Entity\App;

/**
 * Component controller.
 *
 */
class ComponentController extends Controller
{

    /**
     * For superadmin: Lists all Component entities
     * For admin: List all component entities that are enabled and that is assigned to at least one group that the current user belongs to
     * In addition find out which components have been used and do NOT allow them to be deleted
     *
     */
    public function indexAction()
    {

        $em = $this->getDoctrine()->getManager();
        
//First we get all paths of all apps and check to see what components they use, 
//we do this by looping through the path of all of them and use the xidel command which extracts attributes
//we look at the data-mlab-type attribute. 
//These are returned as a json array, so we mainly merge them all and then send the array through to the render
        
        $app_root = $this->container->getParameter('mlab')["paths"]["app"];
        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAll();
        $file_mgmt = $this->get('file_management');
        $all_comps_used = $file_mgmt->getComponentsUsed($apps);
        
//now pick up the components, and set canDelete for those who have not been used
        
//for superadmin we list all components
        if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
            if (is_array($all_comps_used)) {
                $entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findAllCheckDeleteable($all_comps_used);
            } else {
                $entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findAll();
            }
            
            foreach ($entities as $entity) {
                $group_user_access = array();
//pick up group access names, we show admin access (bit 0 = 1) in red
                foreach ($entity->getGroups() as $group) {
                    $access_state = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $entity->getId(), 'group' => $group->getId()))->getAccessState();
                    if ( ($access_state & 1) > 0) {
                        $group_user_access[] = "<span style='color: red;'>" . $group->getName() . "</span>";
                    } else if ( ($access_state & 2) > 0) {
                        $group_user_access[] = $group->getName();
                    }
                }
                $entity->setGroupNames(implode(", ", $group_user_access));
            }
            
//for regular admin only list the ones they have access to through group membership
        } else {
            if (is_array($all_comps_used)) {
                $temp_entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findAllEnabledCheckDeleteable($all_comps_used);
            } else {
                $temp_entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findByEnabled(1);
            }
            
//now we need to filter out the ones that the current user does not have group access to 
//group access can be set with the field access_state, if this is 1 or 3 (binary 01 is set) then it means we have access at the admin level
//this stops overlappping group access from enabling access for a particular user
            $group_access = $this->getUser()->getGroupsIdArray();
            $entities = array();
            
            foreach ($temp_entities as $entity) {
                $add_entity = false;
                $group_user_access = array();
                $sub_groups = $entity->getGroups();
                foreach ($sub_groups as $group) {
                    if (in_array($group->getId(), $group_access)) { // only deal with groups that we have access to

//here we check what sort of access record this is.
//if bit 0 = 1 we have admin access, so we list it
                        $access_state = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $entity->getId(), 'group' => $group->getId()))->getAccessState();
                        if ( ($access_state & 1) > 0 && !in_array($entity, $entities)) {
                            $add_entity = true;
                        } 

//if bit 1 = 1 we have user access, so we add this group name to the list
                        if ( ($access_state & 2) > 0) {
                            $group_user_access[] = $group->getName();
                        }
                    }
                }
                if ($add_entity) {
                    $entities[] = $entity;
                    $entities[sizeof($entities) - 1]->setGroupNames(implode(", ", $group_user_access));
                }
            }
        }
        
//using alternative TWIG as this is called from the admin pages, and we need to use a link to the componentgroup class to edit group access & credentials
        return $this->render('SinettMLABBuilderBundle:Component:index_admin.html.twig', array(
            'entities' => $entities
        ));
    }
    
    /**
     * Creates a new Component entity, only allowed for superadmin
     * Basically uploads a zip file with component as part of the creation
     */
    public function createAction(Request $request)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
        $entity = new Component();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            
            $file_mgmt = $this->get('file_management');
            $file_mgmt->setConfig('component');
            $res = $file_mgmt->handleUpload($entity);
            
            if ($res["result"]) {

//set up admin access initially
                foreach($entity->getComponentGroups() as $group) {
                    $group->setAccessState(1);
                }
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
	        			'message' => $this->get('translator')->trans('compController.msg.unable.upload.comp') . ": " . $res["message"] ) );
	        }
	             
        }

        return new JsonResponse(array('db_table' => 'component',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => $this->get('translator')->trans('compController.msg.unable.upload.comp')));
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
        $form = $this->createForm(ComponentType::class, $entity, array(
            'action' => $this->generateUrl('component_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.components.new.create.button'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('compController.createNotFoundException.comp'));
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
            throw $this->createNotFoundException($this->get('translator')->trans('compController.createNotFoundException.comp'));
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
        $form = $this->createForm(ComponentType::class, $entity, array(
            'action' => $this->generateUrl('component_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.components.edit.groups.update.button'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('compController.createNotFoundException.comp'));
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
        				'message' => $this->get('translator')->trans('compController.msg.unable.upload.comp')));
        		
        	}
        	
        }
        
        return new JsonResponse(array('db_table' => 'component',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => $this->get('translator')->trans('compController.msg.unable.upload.comp')));
        	 
    }
    /**
     * Deletes a Component entity + the directory where the files are stored.
     * The UI is not showing the delete icon for components that are used, so this is safe.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
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
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'component',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('compController.msg.toggleStateAction')));   
        }

        $entity->setEnabled(!$entity->getEnabled());
            
        $em->flush();
        $apps = $em->getRepository('SinettMLABBuilderBundle:App')->findAll();
        $file_mgmt = $this->get('file_management');
        $all_comps_used = $file_mgmt->getComponentsUsed($apps);
        $entity->setCanDelete( ! in_array($entity->getPath(), $all_comps_used) );
        
        return new JsonResponse(array('db_table' => 'component',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:Component:show.html.twig', array('entity' => $entity))));
	        	
    }
    
}
