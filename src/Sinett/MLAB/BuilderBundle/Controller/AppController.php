<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;

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
     *
     */
    public function createAction(Request $request)
    {
        $entity = new App();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirect($this->generateUrl('app_show', array('id' => $entity->getId())));
        }

        return $this->render('SinettMLABBuilderBundle:App:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
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
        $entity = new App();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:App:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
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

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:App:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
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

//            return $this->redirect($this->generateUrl('app_edit', array('id' => $id)));
            return new JsonResponse(array('db_table' => 'app',
            		'record' => $entity,
            		'result' => 'success',
            		'message' => ''));
        }

        return $this->render('SinettMLABBuilderBundle:App:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
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

}
