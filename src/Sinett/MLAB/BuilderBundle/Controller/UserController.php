<?php
/**
 * @author Arild Bergh @ Sinett 3.0 programme <firstname.lastname@ffi.no>
 * @copyright (c) 2013-2016, Norwegian Defence Research Institute (FFI)
 * @license http://www.gnu.org/licenses/agpl-3.0.html GNU Affero General Public License
 *
 * Basi user management, most of the user stuf is done by the FOSUserBundle library.
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\User;
use Sinett\MLAB\BuilderBundle\Form\UserType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

/**
 * User controller.
 *
 */
class UserController extends Controller
{

    /**
     * Lists all User entities.
     *
     */
    public function indexAction()
    {
    	$em = $this->getDoctrine()->getManager();
        $temp_roles = $this->getUser()->getRoles();
        $entities = $em->getRepository('SinettMLABBuilderBundle:User')->findByRole($temp_roles[0]);

        return $this->render('SinettMLABBuilderBundle:User:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new User entity.
     *
     */
    public function createAction(Request $request)
    {
        $entity = new User();
        $form = $this->createCreateForm($entity);
        $form->handleRequest($request);
        $em = $this->getDoctrine()->getManager();
        
        $existing_user = $em->getRepository('SinettMLABBuilderBundle:User')->findByEmail($entity->getEmail());
        if (!$existing_user && $form->isValid()) {
            $em->persist($entity);
            $em->flush();

            return new JsonResponse(array('db_table' => 'user',
            		'action' => 'ADD',
            		'db_id' => $entity->getId(),
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:User:show.html.twig', array('entity' => $entity))));
        }

        if ($existing_user) {
            return new JsonResponse(array('db_table' => 'user',
                        'db_id' => 0,
                        'result' => 'FAILURE',
                        'message' => $this->get('translator')->trans('userController.msg.email.exists')));
        } else {
            return new JsonResponse(array('db_table' => 'user',
                        'db_id' => 0,
                        'result' => 'FAILURE',
                        'message' => $this->get('translator')->trans('userController.msg.unable.create.record')));
        }
    }

    /**
    * Creates a form to create a User entity.
    *
    * @param User $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createCreateForm(User $entity)
    {
        $temp_roles = $this->getUser()->getRoles();
        $form = $this->createForm(UserType::class, $entity, array(
            'action' => $this->generateUrl('user_create'),
            'method' => 'POST',
        	'current_user_role' => $temp_roles[0], 
            'attr' => array('autocomplete' => 'off'),
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.users.new.create.button'));

        return $form;
    }

    /**
     * Displays a form to create a new User entity.
     *
     */
    public function newAction()
    {
        $entity = new User();
        $form   = $this->createCreateForm($entity);

        return $this->render('SinettMLABBuilderBundle:User:new.html.twig', array(
            'entity' => $entity,
            'form'   => $form->createView(),
        ));
    }

    /**
     * Finds and displays a User entity.
     *
     */
    public function showAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('userController.createNotFoundException'));
        }

        

        return $this->render('SinettMLABBuilderBundle:User:show.html.twig', array(
            'entity'      => $entity,
                    ));
    }

    /**
     * Displays a form to edit an existing User entity.
     *
     */
    public function editAction($id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);
        if (!$entity) {
            throw $this->createNotFoundException($this->get('translator')->trans('userController.createNotFoundException'));
        }
        
        $temp_roles = $this->getUser()->getRoles();
        if ($temp_roles[0] == "ROLE_SUPER_ADMIN") {
        	$can_edit = true;
        } else {
                $temp_roles = $entity->getRoles();
        	$can_edit = ($temp_roles[0] != "ROLE_SUPER_ADMIN");
        }
        
        if (!$can_edit) {
            return new JsonResponse($this->get('translator')->trans('userController.editAction.response'));
        }

        $editForm = $this->createEditForm($entity);
        

        return $this->render('SinettMLABBuilderBundle:User:edit.html.twig', array(
            'entity'      => $entity,
            'edit_form'   => $editForm->createView(),
            
        ));
    }

    /**
    * Creates a form to edit a User entity.
    *
    * @param User $entity The entity
    *
    * @return \Symfony\Component\Form\Form The form
    */
    private function createEditForm(User $entity)
    {
        $temp_roles = $this->getUser()->getRoles();
        $form = $this->createForm(UserType::class, $entity, array(
            'action' => $this->generateUrl('user_update', array('id' => $entity->getId())),
            'method' => 'PUT',
            'current_user_role' => $temp_roles[0], 
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.users.edit.update.button'));

        return $form;
    }
    /**
     * Edits an existing User entity.
     *
     */
    public function updateAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
            throw $this->createNotFoundException('Unable to find User entity.');
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
            $this->get('fos_user.user_manager')->updateUser($entity, false);
            $em->flush();
            
            return new JsonResponse(array('db_table' => 'user',
            		'action' => 'UPDATE',
            		'db_id' => $id,
            		'result' => 'SUCCESS',
            		'record' => $this->renderView('SinettMLABBuilderBundle:User:show.html.twig', array('entity' => $entity))));
        }
        
        return new JsonResponse(array('db_table' => 'user',
        		'db_id' => $id,
        		'result' => 'FAILURE',
        		'message' => $this->get('translator')->trans('userController.msg.unable.create.record')));
            
    }
    /**
     * Deletes a User entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'user',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'user',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
    }
    
     /**
     * Toggle the enabled flag for a record
     * @param type $id
     */
    public function toggleStateAction($id) {
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:User')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'user',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('userController.msg.unable.find.record')));
            
        }

        $entity->setEnabled(!$entity->getEnabled());
        $em->flush();
            
        return new JsonResponse(array('db_table' => 'user',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:User:show.html.twig', array('entity' => $entity))));
	        	
    }

}
