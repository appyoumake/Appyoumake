<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
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
    public function editAction($component_id)
    {
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
            if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') || in_array($group->getId(), $group_access)) { //only deal with groups that we have access to
                $group_id = $group->getId();
                $group->isEnabled = "false";
                $group->credential = array();
                $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));
                if ($entity) {
//check if group is enabled, this is done by checking if a record exists for this group in the componentgroup table
                    if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($entity->getAccessState() & 1) > 0) {
                        $group->isEnabled = "true";
                    } else if (!$this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($entity->getAccessState() & 2) > 0) {
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
    public function updateGroupsAction(Request $request, $component_id)
    {
        $em = $this->getDoctrine()->getManager();
        $temp_roles = $this->getUser()->getRoles();
        $temp_groups = $this->getUser()->getGroupsArray();
        $all_groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findByRoleAndGroup($temp_roles[0], $temp_groups); //list of all thr groups the current admin is member of
        $updated_groups = $request->get('sinett_mlab_builderbundle_componentgroup'); //data coming in
        $component = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);
        
        foreach ($all_groups as $group) {
             
            $group_id = $group->getId();
            $existing_access = false;
            $isEnabled = false;
            
//first check if this entry is set, and if so, is it set to enabled?
            if (array_key_exists($group_id, $updated_groups)) {
                $isEnabled = array_key_exists('enabled', $updated_groups[$group_id]);
            }
            
//next we check if this group access setting has an existing record in the database and if the toggle bit is true or not for user (if regular admin) or admin (if super user)
            $existing_component_group = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));
            if ($existing_component_group) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_access = (($existing_component_group->getAccessState() & 1) > 0);
                } else {
                    $existing_access = (($existing_component_group->getAccessState() & 2) > 0);
                }
            }
            
//the group has been unchecked and the stored componentgroup record should be updated 
//Regular admin: basically we remove the second bit which is flipped on for user access. 
//Superadmin: switch bit 0 to 0
//If the remaining value is 0 it means admin does not have access, if it is 1 then admin has access
//this allows us to preserve admin access info between turning on an off user access
            if (!$isEnabled && $existing_access) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_component_group->setAccessState($existing_component_group->getAccessState() ^ 1);
                } else if (($existing_component_group->getAccessState() & 2) > 0) {
                    $existing_component_group->setAccessState($existing_component_group->getAccessState() ^ 2);
                }
                $em->flush();
                
//group already has access, and still has access (i.e. checkbox checked), so only need to update credentials
            } elseif ($isEnabled && $existing_access && array_key_exists('credential', $updated_groups[$group_id] )) {
                $existing_component_group->setCredential($updated_groups[$group_id]['credential']);
                $em->flush();
                
//no component_group record so did not have access before, got it now, need to create new record
            } elseif ($isEnabled && !$existing_component_group) {
                $new_entity = new ComponentGroup();
                $new_entity->setGroup($group);
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $new_entity->setAccessState(1);
                } else {
                    $new_entity->setAccessState(2);
                }
                $new_entity->setComponent($component);
                
                if (array_key_exists('credential' ,$updated_groups[$group_id] )) {
                    $new_entity->setCredential($updated_groups[$group_id]['credential']);
                }
                $em->persist($new_entity);
                $em->flush();
                
//did not have access before, got it now, need to update existing record
            } elseif ($isEnabled && !$existing_access) {
                if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
                    $existing_component_group->setAccessState($existing_component_group->getAccessState() | 1);
                } else {
                    $existing_component_group->setAccessState($existing_component_group->getAccessState() | 2);
                }
                $em->flush();
                
            }  
        }
        
//format the group access details
        $group_user_access = array();
//pick up group access names, we show admin access (bit 0 = 1) in red
        foreach ($component->getGroups() as $group) {
            $access_state = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component->getId(), 'group' => $group->getId()))->getAccessState();
            if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN') && ($access_state & 1) > 0) {
                $group_user_access[] = "<span style='color: red;'>" . $group->getName() . "</span>";
            } else if ( ($access_state & 2) > 0) {
                $group_user_access[] = $group->getName();
            }
        }
        $component->setGroupNames(implode(", ", $group_user_access));   
        
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
