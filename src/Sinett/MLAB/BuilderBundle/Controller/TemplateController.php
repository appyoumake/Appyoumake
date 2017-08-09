<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Simple controller that manages templates, inluding giving access and uploading.
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\TemplateGroupData;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

/**
 * Template controller.
 *
 */
class TemplateController extends Controller
{

    /**
     * Lists all Template entities (if superadmin) or just enabled in current user's groups if regular admin.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();
        
        if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
            $entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllCheckDeleteable();
            foreach ($entities as $entity) {
                $group_user_access = array();
//pick up group access names, we show admin access (bit 0 = 1) in red
                foreach ($entity->getGroups() as $group) {
                    $template_group_data = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $entity->getId(), 'group_id' => $group->getId()));
                    if ($template_group_data) {
                        $access_state = $template_group_data->getAccessState();
                        if ( ($access_state & 1) > 0) {
                            $group_user_access[] = "<span style='color: red;'>" . $group->getName() . "</span>";
                        } else if ( ($access_state & 2) > 0) {
                            $group_user_access[] = $group->getName();
                        }
                    }
                }
                $entity->setGroupNames(implode(", ", $group_user_access));
            }
                
        } else {
            
            $temp_entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllEnabledCheckDeleteable();
//now we need to filter out the ones that the current user does not have group access to 
//group access can be set with the parameter admin_only, but here we don't worry about this, whether access is given to 
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
                        $template_group_data = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $entity->getId(), 'group_id' => $group->getId()));
                        if ($template_group_data) {
                            $access_state = $template_group_data->getAccessState();
                            if ( ($access_state & 1) > 0 && !in_array($entity, $entities)) {
                                $add_entity = true;
                            } 

//if bit 1 = 1 we have user access, so we add this group name to the list
                            if ( ($access_state & 2) > 0) {
                                $group_user_access[] = $group->getName();
                            }
                        }
                    }
                }
                if ($add_entity) {
                    $entities[] = $entity;
                    $entities[sizeof($entities) - 1]->setGroupNames(implode(", ", $group_user_access));
                }
            }            
            
        }

        return $this->render('SinettMLABBuilderBundle:Template:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new Template entity, only allowed for superadmin
     * Basically uploads a zip file with template as part of the creation
     *
     */
    public function createAction(Request $request)
    {
    	$this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
        $entity = new Template();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

//here we handle the uploaded file and test it's validity (type/size) and 
//if correct we unzip it and check content
        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            
            $file_mgmt = $this->get('file_management');
            $file_mgmt->setConfig('template');
            $res = $file_mgmt->handleUpload($entity);
            
            if ($res["result"]) {
	            $em->persist($entity);
	            $em->flush();
                
//here we add initial admin access for the groups that were created
                foreach($entity->getGroups() as $group) {
                    $new_entity = new TemplateGroupData();
                    $new_entity->setGroupId($group->getId());
                    $new_entity->setTemplateId($entity->getId());
                    if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                        $new_entity->setAccessState(1);
                    } else {
                        $new_entity->setAccessState(2);
                    }
                    $em->persist($new_entity);
                    $em->flush();                    
                }

//format the group access details
                $group_user_access = array();
//pick up group access names, we show admin access (bit 0 = 1) in red
                foreach ($entity->getGroups() as $group) {
                    $access_state = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $entity->getId(), 'group_id' => $group->getId()))->getAccessState();
                    if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($access_state & 1) > 0) {
                        $group_user_access[] = "<span style='color: red;'>" . $group->getName() . "</span>";
                    } else if ( ($access_state & 2) > 0) {
                        $group_user_access[] = $group->getName();
                    }
                }
                $entity->setGroupNames(implode(", ", $group_user_access));   

	            return new JsonResponse(array('db_table' => 'template',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
            
            } else {
            	return new JsonResponse(array('db_table' => 'template',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => $res["message"],
                    'data_in' => $entity));
            }
            
        }
        
    	return new JsonResponse(array('db_table' => 'template',
			'db_id' => 0,
			'result' => 'FAILURE',
			'message' => $this->get('translator')->trans('templateController.msg.createAction'),
            'data_in' => $entity));
    }

    /**
    * Creates a form to create a Template entity.
    *
    * @param Template $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Template $entity)
    {
        $form = $this->createForm(TemplateType::class, $entity, array(
            'action' => $this->generateUrl('template_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.templates.new.create.button'));

        return $form;
    }

    /**
     * Displays a form to create a new Template entity.
     *
     */
    public function newAction()
    {
        $entity = new Template();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:Template:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Template entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
        }

        

        return $this->render('SinettMLABBuilderBundle:Template:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a custom form to edit an existing Template entity.
     * To manipulate the access_data information correctly, and differentiate between admin and super admin modes we do this manually
     *
     */
    public function editAction($id)
    {
        
        $em = $this->getDoctrine()->getManager();
        $template_entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);
        $groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findAll();
        $group_access = $this->getUser()->getGroupsIdArray();
        $groups_to_edit = array();
    
        
//set group to enabled if it is in the group entities
        foreach ($groups as $group) {
            if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') || in_array($group->getId(), $group_access)) { //only deal with groups that we have access to
                $group->isEnabled = "false";
                $entity = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $template_entity->getId(), 'group_id' => $group->getId()));
                if ($entity) {
//check if group is enabled, this is done by checking if a record exists for this group in the componentgroup table
                    if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($entity->getAccessState() & 1) > 0) {
                        $group->isEnabled = "true";
                    } else if (!$this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($entity->getAccessState() & 2) > 0) {
                        $group->isEnabled = "true";
                    }
                }
                
                $groups_to_edit[] = $group;
            }
        }
       
        return $this->render('SinettMLABBuilderBundle:Template:edit_admin.html.twig', array(
            'template_id'  => $template_entity->getId(),
            'entity'       => $template_entity,
            'groups'       => $groups_to_edit,
        ));

/** OLD CODE 
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Template:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
 */
    }

    /**
    * Creates a form to edit a Template entity.
    *
    * @param Template $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Template $entity)
    {
        $form = $this->createForm(TemplateType::class, $entity, array(
            'action' => $this->generateUrl('template_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));
        
//need to create custom form for regular admin because we want to filter out and only show groups that the current admin controls.
        if (!$this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
            $temp_roles = $this->getUser()->getRoles();
            $temp_groups = $this->getUser()->getGroupsArray();
            $groups = $this->getDoctrine()->getManager()->getRepository('SinettMLABBuilderBundle:Group')->findByRoleAndGroup($temp_roles[0], $temp_groups);
            $form->add('groups', 'entity', array( 'choices' => $groups,
                                                  'class' => 'SinettMLABBuilderBundle:Group',
                                                  'label' => 'app.admin.users.groups',
                                                  'required' => true,
                                                  'empty_data'  => null,
                                                  'placeholder'  => '',
                                                  'multiple' => true));
        }

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.templates.edit.groups.update.button'));

        return $form;
    }
    /**
     * Edits an existing Template entity.
     * Each group entry requires a matching record in the TemplateGroupData record where we store the access_state information
     * Access_state has bit 0 set to 1 if regular admin access, bit 1 is set to 1 for user access
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
        	
//check if they have uploaded a file
            if (null === $entity->getZipFile()) {
                $res = array("result" => true);
            } else {
                $file_mgmt = $this->get('file_management');
                $file_mgmt->setConfig('template');
                $res = $file_mgmt->handleUpload($entity);
            }
            
        	if ($res["result"]) {
        	 
            	$em->flush();

//here we update the additional access_state data in TemplateGroupData
                foreach($entity->getGroups() as $group) {
                    $current_records = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findByTemplateId($entity->getId());
                    if ($current_record) {
                        $current_record->setAccessData($current_record->getAccessData());
                    } else {
                        $new_entity = new TemplateGroupData();
                        $new_entity->setGroupId($group->getId());
                        $new_entity->setTemplateId($entity->getId());
                        if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                            $new_entity->setAccessState(1);
                        } else {
                            $new_entity->setAccessState(2);
                        }
                        $em->persist($new_entity);
                        $em->flush();                    
                        
                    }
                }

                return new JsonResponse(array('db_table' => 'template',
	        			'action' => 'UPDATE',
	        			'db_id' => $entity->getId(),
	        			'result' => 'SUCCESS',
	        			'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
	        	
        	} else {
        		return new JsonResponse(array('db_table' => 'template',
        				'db_id' => 0,
        				'result' => 'FAILURE',
        				'message' => $this->get('translator')->trans('templateController.msg.unable.upload.template')));
        	
        	}
    	
    	}
    	
    	return new JsonResponse(array('db_table' => 'template',
    			'db_id' => 0,
    			'result' => 'FAILURE',
    			'message' => $this->get('translator')->trans('templateController.msg.unable.upload.template')));
    }
    
    
    /**
      * Updates the ComponentGroup entities for a component.
      * The data coming back is NOT mapped directly to a database, thus we are updating the records manually here
      * If the user is a regular admin user we ignore the records related to groups they are not a member of
      * 
      * A key issue here is that we use a separate field called access_state to keep track of 
      * component_group records that have been created by a superadmin to give a regular access to a record
      * We us a 2 bit flag to determine the state of this, if the regular admin later gives user access we add 2 to it (binary 10)
      * This way an admin might be given access to a component through 
      *
     */
    public function updateGroupsAction(Request $request, $template_id)
    {
        $em = $this->getDoctrine()->getManager();
        $temp_roles = $this->getUser()->getRoles();
        $temp_groups = $this->getUser()->getGroupsArray();
        $all_groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findByRoleAndGroup($temp_roles[0], $temp_groups); //list of all thr groups the current admin is member of
        $updated_groups = $request->get('sinett_mlab_builderbundle_templategroup'); //data coming in
        $template = $em->getRepository('SinettMLABBuilderBundle:Template')->find($template_id);
        
        foreach ($all_groups as $group) {
             
            $group_id = $group->getId();
            $existing_access = false;
            $isEnabled = false;
            
//first check if this entry is set, and if so, is it set to enabled?
            if (array_key_exists($group_id, $updated_groups)) {
                $isEnabled = array_key_exists('enabled', $updated_groups[$group_id]);
            }
            
//next we check if this group access setting has an existing record in the database and if the toggle bit is true or not for user (if regular admin) or admin (if super user)
            $existing_template_group_data = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $template_id, 'group_id' => $group_id));
            if ($existing_template_group_data) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_access = (($existing_template_group_data->getAccessState() & 1) > 0);
                } else {
                    $existing_access = (($existing_template_group_data->getAccessState() & 2) > 0);
                }
            }
            
//the group has been unchecked and the stored templategroupdata record should be updated 
//Regular admin: basically we remove the second bit which is flipped on for user access. 
//Superadmin: switch bit 0 to 0
//If the remaining value is 0 it means admin does not have access, if it is 1 then admin has access
//this allows us to preserve admin access info between turning on an off user access
            if (!$isEnabled && $existing_access) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_template_group_data->setAccessState($existing_template_group_data->getAccessState() ^ 1);
                } else if (($existing_template_group_data->getAccessState() & 2) > 0) {
                    $existing_template_group_data->setAccessState($existing_template_group_data->getAccessState() ^ 2);
                }
                $em->flush();
                
//no template_group_data record so did not have access before, got it now, need to create new record
//we actually create one record directly in the TemplateGroupData table, the other we do through Doctrine by adding a new group to the $template object
            } elseif ($isEnabled && !$existing_template_group_data) {
                $new_entity = new TemplateGroupData();
                $new_entity->setGroupId($group_id);
                $new_entity->setTemplateId($template->getId());
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $new_entity->setAccessState(1);
                } else {
                    $new_entity->setAccessState(2);
                }
                $em->persist($new_entity);
                $em->flush();
                
                $group_record = $em->getRepository('SinettMLABBuilderBundle:Group')->find($group_id);
                $template->addGroup($group_record);
                $em->persist($template);
                $em->flush();
                
//did not have access before, got it now, need to update existing record
            } elseif ($isEnabled && !$existing_access) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_template_group_data->setAccessState($existing_template_group_data->getAccessState() | 1);
                } else {
                    $existing_template_group_data->setAccessState($existing_template_group_data->getAccessState() | 2);
                }
                $em->flush();
                
            }  
        }
        
//format the group access details
        $group_user_access = array();
//pick up group access names, we show admin access (bit 0 = 1) in red
        foreach ($template->getGroups() as $group) {
            $access_state = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $template->getId(), 'group_id' => $group->getId()))->getAccessState();
            if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($access_state & 1) > 0) {
                $group_user_access[] = "<span style='color: red;'>" . $group->getName() . "</span>";
            } else if ( ($access_state & 2) > 0) {
                $group_user_access[] = $group->getName();
            }
        }
        $template->setGroupNames(implode(", ", $group_user_access));   
        
        return new JsonResponse(array('db_table' => 'template',
                    'action' => 'UPDATE',
                    'db_id' => $template_id,
                    'result' => 'SUCCESS',
                    'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $template))));
    }
    
    
    
    
    
    /**
     * Deletes a Template entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);
        
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'template',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
//first remove the additional data records in TemplateGroupData table
        foreach($entity->getGroups() as $group) {
            $data_entity = $em->getRepository('SinettMLABBuilderBundle:TemplateGroupData')->findOneBy(array('template_id' => $entity->getId(), 'group_id' => $group->getId()));
            $em->remove($data_entity);
            $em->flush();                    
        }


//here we remove the directory for the component files
        $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('template');
        $res = $file_mgmt->removeTempCompFiles($entity, 'template');
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'template',
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

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'template',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('templateController.msg.toggleStateAction')));
            
        }

        $entity->setEnabled(!$entity->getEnabled());
        $em->flush();
        
        $temp_apps = $entity->getApps();
		$entity->setCanDelete($temp_apps->count() == 0);
            
        return new JsonResponse(array('db_table' => 'template',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
	        	
    }
    
    
}
