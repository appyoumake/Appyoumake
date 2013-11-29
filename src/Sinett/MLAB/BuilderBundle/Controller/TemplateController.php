<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;

/**
 * Template controller.
 *
 */
class TemplateController extends Controller
{

    /**
     * Lists all Template entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAll();

        return $this->render('SinettMLABBuilderBundle:Template:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new Template entity.
     *
     */
    public function createAction(Request $request)
    {
    	
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

	            return new JsonResponse(array('db_table' => 'template',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
            
            } else {
            	return new JsonResponse(array('db_table' => 'template',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to upload template'));
            }
            
        }
        
    	return new JsonResponse(array('db_table' => 'template',
			'db_id' => 0,
			'result' => 'FAILURE',
			'message' => 'Unable to upload template'));
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
        $form = $this->createForm(new TemplateType(), $entity, array(
            'action' => $this->generateUrl('template_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

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
            throw $this->createNotFoundException('Unable to find Template entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:Template:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Template entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Template entity.');
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Template:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
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
        $form = $this->createForm(new TemplateType(), $entity, array(
            'action' => $this->generateUrl('template_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

        return $form;
    }
    /**
     * Edits an existing Template entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Template entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
        	
        	$file_mgmt = $this->get('file_management');
        	$file_mgmt->setConfig('template');
        	$res = $file_mgmt->handleUpload($entity);

        	if ($res["result"]) {
        	 
            	$em->flush();
        		return new JsonResponse(array('db_table' => 'template',
	        			'action' => 'UPDATE',
	        			'db_id' => $entity->getId(),
	        			'result' => 'SUCCESS',
	        			'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
	        	
        	} else {
        		return new JsonResponse(array('db_table' => 'template',
        				'db_id' => 0,
        				'result' => 'FAILURE',
        				'message' => 'Unable to upload template'));
        	
        	}
    	
    	}
    	
    	return new JsonResponse(array('db_table' => 'template',
    			'db_id' => 0,
    			'result' => 'FAILURE',
    			'message' => 'Unable to upload template'));
    }
    
    /**
     * Deletes a Template entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);
        
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'template',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'template',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }


}
