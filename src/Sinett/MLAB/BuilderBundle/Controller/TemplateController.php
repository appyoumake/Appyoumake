<?php
/**
 * @author Arild Bergh @ Sinett 3.0 programme <firstname.lastname@ffi.no>
 * @copyright (c) 2013-2016, Norwegian Defence Research Institute (FFI)
 * @license http://www.gnu.org/licenses/agpl-3.0.html GNU Affero General Public License
 *
 * Simple controller that manages templates, inluding giving access and uploading.
 */

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

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

        $entities = $em->getRepository('SinettMLABBuilderBundle:Template')->findAllCheckDeleteable();

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
