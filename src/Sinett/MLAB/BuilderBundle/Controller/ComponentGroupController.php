<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
@license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

*******************************************************************************************************************************/

/**
 * @abstract ComponentGroup controller, manages data for access to components by group membership.
 *
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Yaml\Parser;

use Sinett\MLAB\BuilderBundle\Entity\ComponentGroup;
use Sinett\MLAB\BuilderBundle\Form\ComponentGroupType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;


class ComponentGroupController extends Controller
{

    /**
     * Lists all ComponentGroup entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findAll();

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new ComponentGroup entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new ComponentGroup();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirect($this->generateUrl('componentgroup_show', array('id' => $entity->getId())));
        }

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Creates a form to create a ComponentGroup entity.
     *
     * @param ComponentGroup $entity The entity
     *
     * @return \Symfony\Component\Form\Form The form
     */
    private function createCreateForm(ComponentGroup $entity)
    {
        $form = $this->createForm(ComponentGroupType::class, $entity, array(
            'action' => $this->generateUrl('componentgroup_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Create'));

        return $form;
    }

    /**
     * Displays a form to create a new ComponentGroup entity.
     *
     */
    public function newAction()
    {
        $entity = new ComponentGroup();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }
    
    /**
     * Displays a form to create a new ComponentGroup entity.
     *
     */
    public function adminNewAction()
    {
        $entity = new ComponentGroup();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }
    
    /**
     * Finds and displays a ComponentGroup entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find ComponentGroup entity.');
        }

        $deleteForm = $this->createDeleteForm($id);

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:show.html.twig', array(
            'entity'      => $entity,
            'delete_form' => $deleteForm->createView(),
        ));
    }

    /**
     * Displays a form to edit an existing ComponentGroup entity.
     *
     */
    public function editAction($component_id, $access)
    {
        $accessRights = [
            'admin' => ComponentGroup::ACCESS_STATE_ADMIN,
            'user' => ComponentGroup::ACCESS_STATE_USER,
        ];

        $em = $this->getDoctrine()->getManager();
        $yaml = new Parser();
        $comp_entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);
        
        
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $comp_config_path = $config["paths"]["component"] . $comp_entity->getPath() . "/conf.yml";
        
        $groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findAll();
        $group_access = $this->getUser()->getGroupsIdArray();
        $groups_to_edit = array();
    
        
//set group to enabled if it is in the componentGroup entities
        foreach ($groups as $group) {
            if ($this->get('security.authorization_checker')->isGranted('ROLE_SUPER_ADMIN') || in_array($group->getId(), $group_access)) { //only deal with groups that we have access to
                $group_id = $group->getId();
                $group->isEnabled = "false";
                $group->credential = array();
                $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));
                if ($entity) {
                    $access_state = $entity->getAccessState();
                    if ($access_state >= $accessRights[$access]) {
                        $group->isEnabled = "true";
                    }
                    $cred = $entity->getCredential();
                } else {
                     $cred = array();
                }

//next load credentials either from database record OR from original YAML config file for component
                $group->credential = $cred;
                if ( empty( $group->credential ) ) {
                    try {
                        $tmp_yaml = $yaml->parse(@file_get_contents($comp_config_path));
                        if (is_array($tmp_yaml) && array_key_exists( 'credentials', $tmp_yaml)) {
                            $group->credential = array_fill_keys($tmp_yaml['credentials'], "");
                        } else {
                            $group->credential = array();
                        }
                    } catch (\Exception $e) {
                        $group->credential = array();
                    }  
                } 
                
//for super admin we only edit admin access
                $groups_to_edit[] = $group;
            }
        }
       
        $component_entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:edit.html.twig', array(
            'access'           => $access,
            'component_id'     => $component_id,
            'component_entity' => $component_entity,
            'groups'           => $groups_to_edit,
        ));
    }
    /**
    * Creates a form to edit a ComponentGroup entity.
    *
    * @param ComponentGroup $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(ComponentGroup $entity)
    {
        $form = $this->createForm(ComponentGroupType::class, $entity, array(
            'action' => $this->generateUrl('componentgroup_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Update'));

        return $form;
    }
    /**
     * Edits an existing ComponentGroup entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find ComponentGroup entity.');
        }

        $deleteForm = $this->createDeleteForm($id);
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();

            return $this->redirect($this->generateUrl('componentgroup_edit', array('id' => $id)));
        }

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            'delete_form' => $deleteForm->createView(),
        ));
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
    public function updateGroupsAction(Request $request, $component_id, $access)
    {
        $accessRights = [
            'admin' => ComponentGroup::ACCESS_STATE_ADMIN,
            'user' => ComponentGroup::ACCESS_STATE_USER,
        ];

        $em = $this->getDoctrine()->getManager();
        $temp_roles = $this->getUser()->getRoles();
        $temp_groups = $this->getUser()->getGroupsArray();
        $all_groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findByRoleAndGroup($temp_roles[0], $temp_groups); //list of all thr groups the current admin is member of
        $updated_groups = $request->get('sinett_mlab_builderbundle_componentgroup'); //data coming in
        $updated_groups = $updated_groups ? $updated_groups : [];
        $component = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);
        $userGroupAccess = [];
        
        foreach ($all_groups as $group) {
             
            $group_id = $group->getId();
            $existing_access = false;
            $isEnabled = false;
            $userGroupAccess[] = $group->getName();

//first check if this entry is set, and if so, is it set to enabled?
            if (array_key_exists($group_id, $updated_groups)) {
                $isEnabled = array_key_exists('enabled', $updated_groups[$group_id]);
            }

            
//next we check if this group access setting has an existing record in the database and if the toggle bit is true or not for user (if regular admin) or admin (if super user)
            $existing_component_group = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));
            if ($existing_component_group) {
                if($access == 'user') {
                    if($isEnabled) {
                        $accessState = ComponentGroup::ACCESS_STATE_USER;
                    } else {
                        $accessState = min(ComponentGroup::ACCESS_STATE_ADMIN, $existing_component_group->getAccessState());
                    }
                } elseif ($access == 'admin') {
                    if($isEnabled) {
                        $accessState = max(ComponentGroup::ACCESS_STATE_ADMIN, $existing_component_group->getAccessState());
                    } else {
                        $accessState = ComponentGroup::ACCESS_STATE_SUPERADMIN;
                    }
                }

                $existing_component_group->setAccessState($accessState);
                $em->flush();

            } elseif ($isEnabled && $this->get('security.authorization_checker')->isGranted('ROLE_SUPER_ADMIN')) {
                $new_entity = new ComponentGroup();
                $new_entity->setGroup($group);
                $new_entity->setAccessState($accessRights[$access]);
                $new_entity->setComponent($component);
                
                if (array_key_exists('credential' ,$updated_groups[$group_id] )) {
                    $new_entity->setCredential($updated_groups[$group_id]['credential']);
                }
                $em->persist($new_entity);
                $em->flush();
            }
        }
//format the group access details
        $group_admin_access = array();
        $group_user_access = array();
        $groupsWithAccess = $component->getGroups()->filter(function($group) use ($userGroupAccess){
            return in_array($group->getName(), $userGroupAccess);
        });
        foreach ($groupsWithAccess as $group) {
            $access_state = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component->getId(), 'group' => $group->getId()))->getAccessState();
            if ($access_state >= ComponentGroup::ACCESS_STATE_ADMIN) {
                $group_admin_access[] = $group->getName();
            }

            if ($access_state >= ComponentGroup::ACCESS_STATE_USER) {
                $group_user_access[] = $group->getName();
            }
        }
        $component->setGroupNamesAdmin(implode(", ", $group_admin_access));   
        $component->setGroupNamesUser(implode(", ", $group_user_access));   
        
        return new JsonResponse(array('db_table' => 'component',
                    'action' => 'UPDATE',
                    'db_id' => $component_id,
                    'result' => 'SUCCESS',
                    'record' => $this->renderView('SinettMLABBuilderBundle:Component:show_admin.html.twig', array('entity' => $component))));
    }
    
    
    /**
     * Deletes a ComponentGroup entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $form = $this->createDeleteForm($id);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->find($id);

            if (!$entity) {
                throw $this->createNotFoundException('Unable to find ComponentGroup entity.');
            }

            $em->remove($entity);
            $em->flush();
        }

        return $this->redirect($this->generateUrl('componentgroup'));
    }

    /**
     * Creates a form to delete a ComponentGroup entity by id.
     *
     * @param mixed $id The entity id
     *
     * @return \Symfony\Component\Form\Form The form
     */
    private function createDeleteForm($id)
    {
        return $this->createFormBuilder()
            ->setAction($this->generateUrl('componentgroup_delete', array('id' => $id)))
            ->setMethod('DELETE')
            ->add('submit', SubmitType::class, array('label' => 'Delete'))
            ->getForm()
        ;
    }
}
