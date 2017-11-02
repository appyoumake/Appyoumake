<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme firstname.lastname at ffi.no 

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/*
 * @abstract Admin related code to maintain/upload templates, components and apps as well as user related management
 */
namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

// load all relevant database entities & forms
use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;
use Sinett\MLAB\BuilderBundle\Entity\Component;
use Sinett\MLAB\BuilderBundle\Form\ComponentType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;

use Sinett\MLAB\BuilderBundle\Entity\User;
use Sinett\MLAB\BuilderBundle\Form\UserType;
use Sinett\MLAB\BuilderBundle\Entity\Group;
use Sinett\MLAB\BuilderBundle\Form\GroupType;

class AdminController extends Controller
{

/**
 * Action that deals with app/template etc management, it is all done via AJAX calls to various table specific CRUD
 * @return \Symfony\Component\HttpFoundation\Response
 */
	public function appsAction()
    {
    	$tabs = array(
    			"component" => $this->get('translator')->trans('app.admin.components'),
                "template" => $this->get('translator')->trans('app.admin.templates'),
    			);
    	
    	return $this->render('SinettMLABBuilderBundle:Admin:admin.html.twig', array("tabs" => $tabs));
    }

/**
 * Action that deals with user management, as above it is all done via AJAX calls to various table specific CRUD
 * We use identical code, just different names of tabs and URLs to load :-)
 * @return \Symfony\Component\HttpFoundation\Response
 */
    public function usersAction()
    {
    	$tabs = array(
    			"user" => $this->get('translator')->trans('app.admin.users'),
    			"group" => $this->get('translator')->trans('app.admin.groups')
    			);
    	
    	return $this->render('SinettMLABBuilderBundle:Admin:admin.html.twig', array("tabs" => $tabs));
    }
    
/**
 * Action that deals with user management, as above it is all done via AJAX calls to various table specific CRUD
 * We use identical code, just different names of tabs and URLs to load :-)
 * @return \Symfony\Component\HttpFoundation\Response
 */
    public function systemAction()
    {
    	$tabs = array(
    			"help" => $this->get('translator')->trans('app.system.admin.help')
    	);
    	 
    	return $this->render('SinettMLABBuilderBundle:Admin:admin.html.twig', array("tabs" => $tabs));
    }
    
}
