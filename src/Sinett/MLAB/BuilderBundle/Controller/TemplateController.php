<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Simple controller that manages templates, inluding giving access and uploading.
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Entity\TemplateGroupData;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

/**
 * Template controller.
 *
 */
class TemplateController extends Controller
{

    /**
     * Lists all Template entities (if superadmin) or just enabled in current user's groups if regular admin.
     *
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();
        
        if ($this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
            $entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllCheckDeleteable();
        } else {
            $temp_entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllEnabledCheckDeleteable();
//now we need to filter out the ones that the current user does not have group access to 
//group access can be set with the parameter admin_only, but here we don't worry about this, whether access is given to 
            $group_access = $this->getUser()->getGroupsIdArray();
            $entities = array();
            foreach ($temp_entities as $entity) {
                foreach ($entity->getGroups() as $group) {
                    if (in_array($group->getId(), $group_access)) { // only deal with groups that we have access to
                        $entities[] = $entity;
                    }
                }
            }
        }

        return $this->render('SinettMLABBuilderBundle:Template:index.html.twig', array(
            'entities' => $entities,
        ));
    }
    /**
     * Creates a new Template entity, only allowed for superadmin
     * Basically uploads a zip file with template as part of the creation
     *
     */
    public function createAction(Request $request)
    {
    	$this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
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
        			'message' => $res["message"],
                    'data_in' => $entity));
            }
            
        }
        
    	return new JsonResponse(array('db_table' => 'template',
			'db_id' => 0,
			'result' => 'FAILURE',
			'message' => $this->get('translator')->trans('templateController.msg.createAction'),
            'data_in' => $entity));
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
        $form = $this->createForm(TemplateType::class, $entity, array(
            'action' => $this->generateUrl('template_create'),
            'method' => 'POST',
        ));

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.templates.new.create.button'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
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
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
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
        $form = $this->createForm(TemplateType::class, $entity, array(
            'action' => $this->generateUrl('template_update', array('id' => $entity->getId())),
            'method' => 'PUT',
        ));
        
//need to create custom form for regular admin because we want to filter out and only show groups that the current admin controls.
        if (!$this->get('security.context')->isGranted('ROLE_SUPER_ADMIN')) {
            $temp_roles = $this->getUser()->getRoles();
            $temp_groups = $this->getUser()->getGroupsArray();
            $groups = $this->getDoctrine()->getManager()->getRepository('SinettMLABBuilderBundle:Group')->findByRoleAndGroup($temp_roles[0], $temp_groups);
            $form->add('groups', 'entity', array( 'choices' => $groups,
                                                  'class' => 'SinettMLABBuilderBundle:Group',
                                                  'label' => 'app.admin.users.groups',
                                                  'required' => true,
                                                  'empty_data'  => null,
                                                  'placeholder'  => '',
                                                  'multiple' => true));
        }

        $form->add('submit', SubmitType::class, array('label' => 'app.admin.templates.edit.groups.update.button'));

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
            throw $this->createNotFoundException($this->get('translator')->trans('templateController.msg.createNotFoundException'));
        }

        
        $editForm = $this->createEditForm($entity);
        $editForm->handleRequest($request);

        if ($editForm->isValid()) {
        	
//check if they have uploaded a file
            if (null === $entity->getZipFile()) {
                $res = array("result" => true);
            } else {
                $file_mgmt = $this->get('file_management');
                $file_mgmt->setConfig('template');
                $res = $file_mgmt->handleUpload($entity);
            }
            
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
        				'message' => $this->get('translator')->trans('templateController.msg.unable.upload.template')));
        	
        	}
    	
    	}
    	
    	return new JsonResponse(array('db_table' => 'template',
    			'db_id' => 0,
    			'result' => 'FAILURE',
    			'message' => $this->get('translator')->trans('templateController.msg.unable.upload.template')));
    }
    
    /**
     * Deletes a Template entity.
     *
     */
    public function deleteAction(Request $request, $id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
        $em = $this->getDoctrine()->getManager();
        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);
        
        if (!$entity) {
        	return new JsonResponse(array('db_table' => 'template',
        			'db_id' => $id,
        			'result' => 'FAILURE',
        			'message' => ''));
        }
        
//here we remove the directory for the component files
        $file_mgmt = $this->get('file_management');
        $file_mgmt->setConfig('template');
        $res = $file_mgmt->removeTempCompFiles($entity, 'template');
        
        $em->remove($entity);
        $em->flush();
        return new JsonResponse(array('db_table' => 'template',
        		'db_id' => $id,
        		'result' => 'SUCCESS',
        		'message' => ''));
        
    }


    /**
     * Toggle the enabled flag for a record
     * @param type $id
     */
    public function toggleStateAction($id) {
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN', null, 'Unable to access this page!');
        
        $em = $this->getDoctrine()->getManager();

        $entity = $em->getRepository('SinettMLABBuilderBundle:Template')->find($id);

        if (!$entity) {
            return new JsonResponse(array('db_table' => 'template',
                    'db_id' => 0,
                    'result' => 'FAILURE',
                    'message' => $this->get('translator')->trans('templateController.msg.toggleStateAction')));
            
        }

        $entity->setEnabled(!$entity->getEnabled());
        $em->flush();
        
        $temp_apps = $entity->getApps();
		$entity->setCanDelete($temp_apps->count() == 0);
            
        return new JsonResponse(array('db_table' => 'template',
                'action' => 'UPDATE',
                'db_id' => $entity->getId(),
                'result' => 'SUCCESS',
                'record' => $this->renderView('SinettMLABBuilderBundle:Template:show.html.twig', array('entity' => $entity))));
	        	
    }
    
    
}
