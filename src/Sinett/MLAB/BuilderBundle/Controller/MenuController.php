<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Menu;
use Sinett\MLAB\BuilderBundle\Form\MenuType;

/**
 * Menu controller.
 *
 */
class MenuController extends Controller
{


	/**
     * Lists all Menu entities in a template.
     *
     */
    public function buildMenuAction($path)
    {
//TODO: Argh, terrible hack to fix path issue, the path here (as it is called from a Template) is always _fragment, 
//so we pass the path from base template.. but that includes the app.php stuff
    	$path = str_replace(array("/app_dev.php", "/app.php"), "", $path);
    	$em = $this->getDoctrine()->getManager();
		
		$menus = $em->getRepository('SinettMLABBuilderBundle:Menu')->findMenuItems($this->getUser(), $path, $this->container->getParameter('security.role_hierarchy.roles'));

		return $this->render('::menu.html.twig', array(
				'menus' => $menus,
		));
    }
	
	/**
     * Lists all Menu entities.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        $entities = $em->getRepository('SinettMLABBuilderBundle:Menu')->findMenuItemsRaw();

        return $this->render('SinettMLABBuilderBundle:Menu:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new Menu entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Menu();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'menu',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Menu:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'menu',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to create new record'));
    }

    /**
    * Creates a form to create a Menu entity.
    *
    * @param Menu $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Menu $entity)
    {
        $form = $this->createForm(new MenuType(), $entity, array(
            'action' => $this->generateUrl('menu_create'),
            'method' => 'POST',
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

        return $form;
    }

    /**
     * Displays a form to create a new Menu entity.
     *
     */
    public function newAction()
    {
        $entity = new Menu();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:Menu:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a Menu entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Menu')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Menu entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:Menu:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Menu entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Menu')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Menu entity.');
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:Menu:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Menu entity.
    *
    * @param Menu $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Menu $entity)
    {
        $form = $this->createForm(new MenuType(), $entity, array(
            'action' => $this->generateUrl('menu_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

        return $form;
    }
    /**
     * Edits an existing Menu entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Menu')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Menu entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();

            return new JsonResponse(array('db_table' => 'menu',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Menu:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'menu',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => 'Unable to create new record'));
           
    }
    /**
     * Deletes a Menu entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Menu')->find($id);
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'menu',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'menu',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }


}
