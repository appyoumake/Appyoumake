<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract UNUSED! This code will store tracking information about usage. 
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Tracking;
use Sinett\MLAB\BuilderBundle\Form\TrackingType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

/**
 * Tracking controller.
 *
 */
class TrackingController extends Controller
{

    /**
     * Lists all Tracking entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Tracking')->findAll();

        return $this->render('SinettMLABBuilderBundle:Tracking:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new Tracking entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Tracking();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirect($this->generateUrl('tracking_show', array('id' => $entity->getId())));
        }

        return $this->render('SinettMLABBuilderBundle:Tracking:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
    * Creates a form to create a Tracking entity.
    *
    * @param Tracking $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Tracking $entity)
    {
        $form = $this->createForm(TrackingType::class, $entity, array(
            'action' => $this->generateUrl('tracking_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Create'));

        return $form;
    }

    /**
     * Displays a form to create a new Tracking entity.
     *
     */
    public function newAction()
    {
        $entity = new Tracking();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:Tracking:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Tracking entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Tracking')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('trackingController.createNotFoundException'));
        }

        

        return $this->render('SinettMLABBuilderBundle:Tracking:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Tracking entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Tracking')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('trackingController.createNotFoundException'));
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Tracking:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Tracking entity.
    *
    * @param Tracking $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Tracking $entity)
    {
        $form = $this->createForm(TrackingType::class, $entity, array(
            'action' => $this->generateUrl('tracking_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Update'));

        return $form;
    }
    /**
     * Edits an existing Tracking entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Tracking')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('trackingController.createNotFoundException'));
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();

            return $this->redirect($this->generateUrl('tracking_edit', array('id' => $id)));
        }

        return $this->render('SinettMLABBuilderBundle:Tracking:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }
    /**
     * Deletes a Tracking entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Tracking')->find($id);

            if (!$entity) {
        	return new JsonResponse(array('db_table' => 'tracking',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'tracking',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        			'message' => ''));
    
    }

}
