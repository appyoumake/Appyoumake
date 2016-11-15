<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Institute (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Manages the groups that user belong to. Groups are used to give access to apps, templates and components
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Group;
use Sinett\MLAB\BuilderBundle\Form\GroupType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

/**
 * Group controller.
 *
 */
class GroupController extends Controller
{

    /**
     * Lists all Group entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Group')->findAll();

        return $this->render('SinettMLABBuilderBundle:Group:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    
    /**
     * Creates a new Group entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Group();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            foreach($entity->getUsers() as $user){
                $user->addGroup($entity);
            }

            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'group',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Group:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'group',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
    }

    /**
    * Creates a form to create a Group entity.
    *
    * @param Group $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Group $entity)
    {
        $form = $this->createForm(GroupType::class, $entity, array(
            'action' => $this->generateUrl('group_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.groups.new.create.button'));

        return $form;
    }

    /**
     * Displays a form to create a new Group entity.
     *
     */
    public function newAction()
    {
        $entity = new Group();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:Group:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Group entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Group')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('groupController.createNotFoundException'));
        }

        

        return $this->render('SinettMLABBuilderBundle:Group:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Group entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Group')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('groupController.createNotFoundException'));
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Group:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Group entity.
    *
    * @param Group $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Group $entity)
    {
        $form = $this->createForm(GroupType::class, $entity, array(
            'action' => $this->generateUrl('group_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.groups.edit.update.button'));

        return $form;
    }
    /**
     * Edits an existing Group entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Group')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('groupController.createNotFoundException'));
        }

//remove all old groups from DB record
        foreach($entity->getUsers() as $user){
            $user->removeGroup($entity);
        }
        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            
//now add the new ones (may be identical of course)
            foreach($entity->getUsers() as $user){
                $user->addGroup($entity);
            }
            $em->flush();

            return new JsonResponse(array('db_table' => 'group',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Group:show.html.twig', array('entity' => $entity))));
        }
        
        return new JsonResponse(array('db_table' => 'group',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
    }
    
    /**
     * Deletes a Group entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Group')->find($id);
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'group',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'group',
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

        $entity = $em->getRepository('SinettMLABBuilderBundle:Group')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'group',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('controller.msg.unable.locate.record')));
            
        }

        $entity->setEnabled(!$entity->getEnabled());
        $em->flush();
            
        return new JsonResponse(array('db_table' => 'group',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:Group:show.html.twig', array('entity' => $entity))));
	        	
    }

}
