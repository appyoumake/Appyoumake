<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\User;
use Sinett\MLAB\BuilderBundle\Form\UserType;

/**
 * User controller.
 *
 */
class UserController extends Controller
{

    /**
     * Lists all User entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:User')->findByRole($this->getUser()->getRoles()[0]);

        return $this->render('SinettMLABBuilderBundle:User:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new User entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new User();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'user',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:User:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'user',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to create new record'));
    }

    /**
    * Creates a form to create a User entity.
    *
    * @param User $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(User $entity)
    {
        $form = $this->createForm(new UserType(), $entity, array(
            'action' => $this->generateUrl('user_create'),
            'method' => 'POST',
        	'current_user_role' => $this->getUser()->getRoles()[0], 
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

        return $form;
    }

    /**
     * Displays a form to create a new User entity.
     *
     */
    public function newAction()
    {
        $entity = new User();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:User:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a User entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find User entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:User:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing User entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);
        if ($this->getUser()->getRoles()[0] == "ROLE_SUPER_ADMIN") {
        	$can_edit = ($entity->getRoles()[0] != "ROLE_SUPER_ADMIN");
        } else {
        	$can_edit = true;
        }
        if (!$entity || !$can_edit) {
            throw $this->createNotFoundException('Unable to find User entity.');
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:User:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a User entity.
    *
    * @param User $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(User $entity)
    {
        $form = $this->createForm(new UserType(), $entity, array(
            'action' => $this->generateUrl('user_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

        return $form;
    }
    /**
     * Edits an existing User entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find User entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();

            return new JsonResponse(array('db_table' => 'user',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:User:show.html.twig', array('entity' => $entity))));
        }
        
        return new JsonResponse(array('db_table' => 'user',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => 'Unable to create new record'));
            
    }
    /**
     * Deletes a User entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'user',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'user',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
    }

}
