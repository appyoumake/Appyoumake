<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract  basic code to load and store help text from the help table
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Help;
use Sinett\MLAB\BuilderBundle\Form\HelpType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

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
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
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
        $form = $this->createForm(HelpType::class, $entity, array(
            'action' => $this->generateUrl('help_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.system.admin.help.new.create.button'));
        $form->add('route', ChoiceType::class, array(
              'choices' => $routes
        ));
        return $form;
    }

    public function getRoutes() {
        $availableApiRoutes = array();
        foreach ($this->get('router')->getRouteCollection()->all() as $name => $route) {
            $route = $route->compile();
            $emptyVars = array();
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
            throw $this->createNotFoundException($this->get('translator')->trans('helpController.createNotFoundException'));
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
            throw $this->createNotFoundException($this->get('translator')->trans('helpController.createNotFoundException'));
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
        $form = $this->createForm(HelpType::class, $entity, array(
            'action' => $this->generateUrl('help_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.system.admin.help.edit.update.button'));
        $form->add('route', ChoiceType::class, array(
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
            throw $this->createNotFoundException($this->get('translator')->trans('helpController.createNotFoundException'));
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
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
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
    
/**
 * 
 * @param \Symfony\Component\HttpFoundation\Request $request
 * @param string $route = unique symfony name on the route, as found in /resources/config/routing files
 */
    public function getHtmlAction($route) {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Help')->findOneByRoute($route);

        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'help',
        			'db_id' => $route,
        			'result' => 'FAILURE',
        			'html' => ''));
        }
        
        return new JsonResponse(array('db_table' => 'help',
        		'db_id' => $route,
        		'result' => 'SUCCESS',
        		'html' => $entity->getMessage()));
        
    }
    
    public function getComponentHelpfileAction($comp_id) {
        if ($comp_id == "") {
            return new JsonResponse(array(
        			'result' => 'FAILURE',
        			'message' => $this->get('translator')->trans('controller.help.msg.comp_id.empty')));
        }
        
        $config = array_merge_recursive($this->container->getParameter('mlab'), $this->container->getParameter('mlab_app'));
        $help_basename = $config["paths"]["component"] . "/" . $comp_id . "/extended_tip";
        $help_generic = $help_basename . ".html";
        $help_locale = $help_basename . "_" . $this->container->getParameter('locale') . ".html";
        
        if (file_exists($help_locale)) {
            $html = file_get_contents($help_locale);
        } else if (file_exists($help_generic)) {
            $html = file_get_contents($help_generic);
        } else {
            return new JsonResponse(array(
        			'result' => 'FAILURE',
        			'message' => $this->get('translator')->trans('controller.help.msg.file.notfound') . " [" . $help_locale . "]"));
        }
        
                
        return new JsonResponse(array(
        		'result' => 'SUCCESS',
        		'html' => $html));
        
    }

}
