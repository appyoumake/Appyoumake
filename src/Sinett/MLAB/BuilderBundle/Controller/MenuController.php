<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract  REDUNDANT! Menus were initially stored in the database, but over time the amount of menus have shrunk so no need for this.
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Menu;
use Sinett\MLAB\BuilderBundle\Form\MenuType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

// additional entities used to return data
use Sinett\MLAB\BuilderBundle\Entity\App;
/**
 * Menu controller.
 *
 */
class MenuController extends Controller
{
    
    /**
     * Utility function to get name of app specified in URL
     */
    private function getAppName($path) {
        $elements = explode("/", $path);
        $em = $this->getDoctrine()->getManager();
		
		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($elements[3]);
        if ($app) {
            return $app->getName();
        }
    }

    /**
     * Utility function to get name of app specified in URL
     */
    private function getAppPages($path) {
        $elements = explode("/", $path);
        $em = $this->getDoctrine()->getManager();
		
		$app = $em->getRepository('SinettMLABBuilderBundle:App')->findOneById($elements[3]);
        if ($app) {
            $file_mgmt = $this->get('file_management');
		    $file_mgmt->setConfig('app');
    		$pages = $file_mgmt->getPageIdAndTitles($app);
            return $this->renderView('SinettMLABBuilderBundle:App:pages.html.twig', array('app_id' => $elements[3], 'pages' => $pages));
        }
    }


	/**
     * Lists all Menu entities in a template.
     *
     */
    public function buildMenuAction($path)
    {
//TODO: Argh, terrible hack to fix path issue, the path here (as it is called from a Template) is always _fragment, 
//so we pass the path from base template.. but that includes the app.php stuff
    	$filter_path = str_replace(array("/app_dev.php", "/app.php"), "", $path);
        preg_match("/^\/app_.*?\.php/", $path, $url_prefix);
        if (!empty($url_prefix)) {
            $url_prefix = $url_prefix[0];
        } else {
            $url_prefix = "";
        }
        
    	$em = $this->getDoctrine()->getManager();
		$menus = $em->getRepository('SinettMLABBuilderBundle:Menu')->findMenuItems($this->getUser(), $filter_path, $this->container->getParameter('security.role_hierarchy.roles'));

//loop through and proces menus, we prepend environment part of URL if required and update the content
        foreach ($menus as $key => $menu) {
    		if (isset($menu["url"]) && !empty($menu["url"]) && substr($menu["url"], 0, 10) != "javascript") {
                $menu["url"] = $url_prefix . $menu["url"];
            }
    		if (isset($menu["contentPhp"]) && !empty($menu["contentPhp"])) {
				$menus[$key]["contentHtml"] = $this->{$menu["contentPhp"]}($filter_path);
			}
            
            if (isset($menu["children"])) {
                foreach ($menu["children"] as $sub_key => $sub_menu) {
                    if (isset($sub_menu["url"]) && !empty($sub_menu["url"]) && substr($sub_menu["url"], 0, 10) != "javascript") {
                        $menus[$key]["children"][$sub_key]["url"] = $url_prefix . $menus[$key]["children"][$sub_key]["url"];
                    }
                    
                    if (isset($sub_menu["contentPhp"]) && !empty($sub_menu["contentPhp"])) {
                        $menus[$key]["children"][$sub_key]["contentHtml"] = $this->{$sub_menu["contentPhp"]}($filter_path);
                    }
                }
            }
        }

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
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
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
        $form = $this->createForm(MenuType::class, $entity, array(
            'action' => $this->generateUrl('menu_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Create'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('menuController.createNotFoundException'));
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
            throw $this->createNotFoundException($this->get('translator')->trans('menuController.createNotFoundException'));
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
        $form = $this->createForm(MenuType::class, $entity, array(
            'action' => $this->generateUrl('menu_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'Update'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('menuController.createNotFoundException'));
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
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
           
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
