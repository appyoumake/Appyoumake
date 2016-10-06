<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Yaml\Parser;

use Sinett\MLAB\BuilderBundle\Entity\ComponentGroup;
use Sinett\MLAB\BuilderBundle\Form\ComponentGroupType;

/**
 * ComponentGroup controller.
 *
 */
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
        $form = $this->createForm(new ComponentGroupType(), $entity, array(
            'action' => $this->generateUrl('componentgroup_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

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
        
        
        $config = $this->container->getParameter('mlab');
        $comp_config_path = $config["paths"]["component"] . $comp_entity->getPath() . "/conf.yml";
        
        $groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findAll();
    
//set group to enabled if it is in the componentGroup enteties
        foreach ($groups as $group) {
            $group_id = $group->getId();
            $group->isEnabled = "false";
            $group->credential = array();
            $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));
            if ($entity) {
                //$entity_group_id = $entity->getGroup()->getId();
                
//check if group is enabled, this is done by checking if a record exists for this group in the componentgroup table
               
                    $group->isEnabled = "true";
                    $cred = $entity->getCredential();
            } else {
                 $cred = array();
            }
                
//next load credentials either from databse record OR from original YAML config file for component

                $group->credential = $cred;
                if ( empty( $group->credential ) ){
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
                 
            
        }

       
        $component_entity = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);
        

        return $this->render('SinettMLABBuilderBundle:ComponentGroup:edit.html.twig', array(
            'component_id'     => $component_id,
            'component_entity' => $component_entity,
            'groups'           => $groups,
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
        $form = $this->createForm(new ComponentGroupType(), $entity, array(
            'action' => $this->generateUrl('componentgroup_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

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
     * Updates the ComponentGroup enteties for a component.
     *
     */
    public function updateGroupsAction(Request $request, $component_id)
    {
        $em = $this->getDoctrine()->getManager();
        $groups = $em->getRepository('SinettMLABBuilderBundle:Group')->findAll();
        $updated_groups = $request->get('sinett_mlab_builderbundle_componentgroup');
        $component = $em->getRepository('SinettMLABBuilderBundle:Component')->find($component_id);
        
        foreach ($groups as $group) {
             
            $group_id = $group->getId();
            $isEnabled = array_key_exists('enabled', $updated_groups[$group_id]);
            $entity = $em->getRepository('SinettMLABBuilderBundle:ComponentGroup')->findOneBy(array('component' => $component_id, 'group' => $group_id));

            
//the group has been unchecked and the stored componentgroup record should be deleted
            if (empty($isEnabled) && $entity) {
                $em->remove($entity);
                $em->flush();
                
//group alread has access, and still has access (i.e. checkbox checked), so only need to update credentials
            } elseif ($isEnabled && $entity && array_key_exists('credential', $updated_groups[$group_id] )) {
                
                $entity->setCredential($updated_groups[$group_id]['credential']);
                $em->flush();
                
//did not have access before, got it now, need to create new record
            } elseif ($isEnabled && !$entity) {
                $new_entity = new ComponentGroup();
                $new_entity->setGroup($group);
                $new_entity->setComponent($component);
                
                if (array_key_exists('credential' ,$updated_groups[$group_id] )) {
                    $new_entity->setCredential($updated_groups[$group_id]['credential']);
                }
                $em->persist($new_entity);
                $em->flush();
            }  
        }
        
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
            ->add('submit', 'submit', array('label' => 'Delete'))
            ->getForm()
        ;
    }
}
