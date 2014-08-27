<?php

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
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository('SinettMLABBuilderBundle:Category');
        
        //$arrayTree = $repo->childrenHierarchy();
        
//this is called from two different locations, /system and /admin/apps. 
//if called from system the user can edit all elements
        if (basename($this->getRequest()->headers->get('referer')) == "system") {
            $options = array(
        		'decorate' => true,
        		'rootOpen' => '<ul>',
        		'rootClose' => '</ul>',
        		'childOpen' => '<li>',
        		'childClose' => '</li>',
        		'nodeDecorator' => function($node) {
        			return "<div class='treeview " . ($node['system'] ? " system " : "") . "' id='row_category_{$node['id']}'><a href='" . $this->generateUrl('category_edit', array('id' => $node['id'])) . "'>" . $node['name'] . "</a>" .
          			"<a class='tree_add' href='" . $this->generateUrl('category_new', array('id' => $node['id'])) . "'>Add sub-category</a>" . 
          			"<a class='tree_delete' href='" . $this->generateUrl('category_delete', array('id' => $node['id'])) . "'>Delete</a></div>";
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
                                    ($node['system'] ? $node['name'] : "<a href='" . $this->generateUrl('category_edit', array('id' => $node['id'])) . "'>" . $node['name'] . "</a>") . 
                                    "<a class='tree_add' href='" . $this->generateUrl('category_new', array('id' => $node['id'])) . "'>Add sub-category</a>" . 
                                    ($node['system'] ? "" : "<a class='tree_delete' href='" . $this->generateUrl('category_delete', array('id' => $node['id'])) . "'>Delete</a>") .
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
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'category',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:Category:show.html.twig', array('entity' => $entity))));
        }

        return new JsonResponse(array('db_table' => 'category',
        			'db_id' => 0,
        			'result' => 'FAILURE',
        			'message' => 'Unable to create new record'));
        
    }

    /**
    * Creates a form to create a Category entity.
    *
    * @param Category $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(Category $entity, $parent_id = 0)
    {
        $form = $this->createForm(new CategoryType(), $entity, array(
            'action' => $this->generateUrl('category_create'),
            'method' => 'POST',
       		'parent_category_id' => $parent_id
        ));

        $form->add('submit', 'submit', array('label' => 'Create'));

        return $form;
    }

    /**
     * Displays a form to create a new Category entity.
     *
     */
    public function newAction($id)
    {
        $entity = new Category();
        $form   = $this->createCreateForm($entity, $id);

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
            throw $this->createNotFoundException('Unable to find Category entity.');
        }

        

        return $this->render('SinettMLABBuilderBundle:Category:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing Category entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Category')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find Category entity.');
        }

        $editForm = $this->createEditForm($entity);
        

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
    private function createEditForm(Category $entity)
    {
        $form = $this->createForm(new CategoryType(), $entity, array(
            'action' => $this->generateUrl('category_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));

        $form->add('submit', 'submit', array('label' => 'Update'));

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
            throw $this->createNotFoundException('Unable to find Category entity.');
        }

        
        $editForm = $this->createEditForm($entity);
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
        		'message' => 'Unable to create new record'));
        
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

 
}
