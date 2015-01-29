<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Help;
use Sinett\MLAB\BuilderBundle\Form\HelpType;

/**
 * Help controller.
 *
 */
class HelpController extends Controller
{

    /**
     * Lists all Help entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Help')->findAll();
        
        return $this->render('SinettMLABBuilderBundle:Help:index.html.twig', array(
            'entities' => $entities
        ));
    }
    /**
     * Creates a new Help entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Help();
        $routes = $this->getRoutes();
        $form = $this->createCreateForm($entity, $routes);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'help',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Help:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'help',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to create new record'));
    }

    /**
    * Creates a form to create a Help entity.
    *
    * @param Help $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Help $entity, $routes)
    {
        $form = $this->createForm(new HelpType(), $entity, array(
            'action' => $this->generateUrl('help_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'app.system.admin.help.new.create.button'));
        $form->add('route', 'choice', array(
              'choices' => $routes
        ));
        return $form;
    }

    public function getRoutes() {
        $availableApiRoutes = [];
        foreach ($this->get('router')->getRouteCollection()->all() as $name => $route) {
            $route = $route->compile();
            $emptyVars = [];
            foreach( $route->getVariables() as $v ){
                $emptyVars[ $v ] = $v;
            }
            $url = $this->generateUrl( $name, $emptyVars );
            $availableApiRoutes[$name] = $url;
        }
        return $availableApiRoutes;
    }
    /**
     * Displays a form to create a new Help entity.
     *
     */
    public function newAction()
    {
        $entity = new Help();

        $routes = $this->getRoutes();
        $form   = $this->createCreateForm($entity, $routes);

        return $this->render('SinettMLABBuilderBundle:Help:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Help entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Help')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Help entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:Help:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Help entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Help')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Help entity.');
        }
        
        $routes = $this->getRoutes();
        $editForm = $this->createEditForm($entity, $routes);
        
        return $this->render('SinettMLABBuilderBundle:Help:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Help entity.
    *
    * @param Help $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Help $entity, $routes)
    {
        $form = $this->createForm(new HelpType(), $entity, array(
            'action' => $this->generateUrl('help_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'app.system.admin.help.edit.update.button'));
        $form->add('route', 'choice', array(
              'choices' => $routes
        ));

        return $form;
    }
    /**
     * Edits an existing Help entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Help')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Help entity.');
        }

        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();

            return new JsonResponse(array('db_table' => 'help',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Help:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'help',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => 'Unable to update record'));
    }
    /**
     * Deletes a Help entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Help')->find($id);

        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'help',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'help',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }


}
