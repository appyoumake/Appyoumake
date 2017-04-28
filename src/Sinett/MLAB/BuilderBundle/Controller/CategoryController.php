<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Manages the categories that are used for the apps
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Monolog\Handler\error_log;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

use Sinett\MLAB\BuilderBundle\Entity\Category;
use Sinett\MLAB\BuilderBundle\Form\CategoryType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;


/**
 * Category controller.
 *
 */
class CategoryController extends Controller
{

    /**
     * Lists all Category entities.
     * See https://github.com/l3pp4rd/DoctrineExtensions/blob/master/doc/tree.md
     */
    public function indexAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository('SinettMLABBuilderBundle:Category');
        
        //$arrayTree = $repo->childrenHierarchy();
        
//this is called from two different locations, /system and /admin/apps. 
//if called from system the user can edit all elements
        if (basename($request->headers->get('referer')) == "system") {
            $options = array(
        		'decorate' => true,
        		'rootOpen' => '<ul>',
        		'rootClose' => '</ul>',
        		'childOpen' => '<li>',
        		'childClose' => '</li>',
        		'nodeDecorator' => function($node) {
        			return "<div class='treeview " . ($node['system'] ? " system " : "") . "' id='row_category_{$node['id']}'><a class='tree_text' href='" . $this->generateUrl('category_edit', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.edit') . "'>" . $node['name'] . "</a>" .
          			"<a class='tree_delete' href='" . $this->generateUrl('category_delete', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.delete') . " - " . $node['name'] . "'>Delete</a>" .
                    "<a class='tree_add' href='" . $this->generateUrl('category_new', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.new.sub') . " - " . $node['name'] . "'>Add sub-category</a>" . 
                    "</div>";
        		}
            );
        } else {
            $options = array(
                    'decorate' => true,
                    'rootOpen' => '<ul>',
                    'rootClose' => '</ul>',
                    'childOpen' => '<li>',
                    'childClose' => '</li>',
                    'nodeDecorator' => function($node) {
                        return "<div class='treeview " . ($node['system'] ? " mlab_category_system " : "") . "' id='row_category_{$node['id']}'>" . 
                                    ($node['system'] ? $node['name'] : "<a class='tree_text' href='" . $this->generateUrl('category_edit', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.edit') . "'>" . $node['name'] . "</a>") .
                                    ($node['system'] ? "<span class='tree_not_delete'> &nbsp;a</span>" : "<a class='tree_delete' href='" . $this->generateUrl('category_delete', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.delete') . " - " . $node['name'] . "'>Delete</a>") .
                                    "<a class='tree_add' href='" . $this->generateUrl('category_new', array('id' => $node['id'])) . "' title='" . $this->get('translator')->trans('app.admin.categories.tooltip.new.sub') . " - " . $node['name'] . "'>Add sub-category</a>" . 
                                "</div>";
                    }
            );
        }
        
        $htmlTree = $repo->childrenHierarchy(
        		null, /* starting from root nodes */
        		false, /* true: load all children, false: only direct */
        		$options
        );
        
        
        return $this->render('SinettMLABBuilderBundle:Category:index.html.twig', array(
            'category_tree' => $htmlTree,
        ));
    }
    /**
     * Creates a new Category entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new Category();
        $form = $this->createCreateForm($request, $entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirect($this->generateUrl('category'));
            
        }

        return new JsonResponse(array('db_table' => 'category',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
        
    }

    /**
    * Creates a form to create a Category entity.
    *
    * @param Category $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Request $request, Category $entity, $parent_id = 0)
    {
        $request = $this->container->get('request');
        
//we call the same code from two different places, regular admin and system admin, if regular admin we do not display the system option to create system categories
        if (basename($request->headers->get('referer')) == "system") {
            $system_class = "";
        } else {
            $system_class = "hidden";
        }
        $form = $this->createForm(CategoryType::class, $entity, array(
            'action' => $this->generateUrl('category_create'),
            'method' => 'POST',
       		'parent_category_id' => $parent_id,
            'class' => $system_class
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.categories.new.create.button'));

        return $form;
    }

    /**
     * Displays a form to create a new Category entity.
     *
     */
    public function newAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = new Category();
        $form = $this->createCreateForm($request, $entity, $em->getRepository('SinettMLABBuilderBundle:Category')->find($id));

        return $this->render('SinettMLABBuilderBundle:Category:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView()
        ));
    }

    /**
     * Finds and displays a Category entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Category')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('categoryController.createNotFoundException'));
        }

        

        return $this->render('SinettMLABBuilderBundle:Category:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Category entity.
     *
     */
    public function editAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Category')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Category entity.');
        }

        $editForm = $this->createEditForm($request, $entity);
        

        return $this->render('SinettMLABBuilderBundle:Category:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a Category entity.
    *
    * @param Category $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(Request $request, Category $entity)
    {
        
//we call the same code from two different places, regular admin and system admin, if regular admin we do not display the system option to create system categories
        if (basename($request->headers->get('referer')) == "system") {
            $system_class = "";
        } else {
            $system_class = "hidden";
        }
        
        
        $form = $this->createForm(CategoryType::class, $entity, array(
            'action' => $this->generateUrl('category_update', array('id' => $entity->getId())),
            'method' => 'PUT',
            'class' => $system_class
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.categories.edit.update.button'));

        return $form;
    }
    /**
     * Edits an existing Category entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Category')->find($id);
        
        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('categoryController.createNotFoundException'));
        }

        
        $editForm = $this->createEditForm($request, $entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $em->flush();
            
            return new JsonResponse(array('db_table' => 'category',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Category:show.html.twig', array('entity' => $entity))));
        }
        
        return new JsonResponse(array('db_table' => 'category',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => $this->get('translator')->trans('controller.msg.unable.create.record')));
        
    }

    /**
     * Deletes a Category entity.
     * Must have role_super_admin rights to delete system ones 
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Category')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'category',
        							      'db_id' => $id,
        							  	  'result' => 'FAILURE',
        								  'message' => ''));
        }

        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'category',
        							  'db_id' => $id,
        							  'result' => 'SUCCESS',
        							  'message' => ''));
    }

    public function loadCategoriesAction($id, $level) {
    	$em = $this->getDoctrine()->getManager();
        $entities = $em->getRepository('SinettMLABBuilderBundle:Category')->findByParent($id);
        
        return new JsonResponse(array('level' => $level,
        							  'result' => 'SUCCESS',
        							  'categories' => $this->renderView('SinettMLABBuilderBundle:Category:list.html.twig', array('categories' => $entities))));
        
    }
 
}
