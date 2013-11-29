<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Component;
use Sinett\MLAB\BuilderBundle\Form\ComponentType;

/**
 * Component controller.
 *
 */
class ComponentController extends Controller
{

    /**
     * Lists all Component entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Component')->findAll();

        return $this->render('SinettMLABBuilderBundle:Component:index.html.twig', array(
            'entities' => $entities,
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

        $form->add('submit', 'submit', array('label' => 'Create'));

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

        $form->add('submit', 'submit', array('label' => 'Update'));

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
            
        	$file_mgmt = $this->get('file_management');
            $file_mgmt->setConfig('component');
            $res = $file_mgmt->handleUpload($entity, true);
        	
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
     * Deletes a Component entity.
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
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'component',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }


}
