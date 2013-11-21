<?php
/**
 * Admin related code to maintain/upload templates, components and apps
 * as well as user related management
 * @author utvikler
 *
 */
namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Symfony\Component\HttpFoundation\Request;

// load all relevant database entities & forms
use Sinett\MLAB\BuilderBundle\Entity\App;
use Sinett\MLAB\BuilderBundle\Form\AppType;
use Sinett\MLAB\BuilderBundle\Entity\Template;
use Sinett\MLAB\BuilderBundle\Form\TemplateType;
use Sinett\MLAB\BuilderBundle\Entity\Component;
use Sinett\MLAB\BuilderBundle\Form\ComponentType;
use Sinett\MLAB\BuilderBundle\Entity\Category;
use Sinett\MLAB\BuilderBundle\Form\CategoryType;

use Sinett\MLAB\BuilderBundle\Entity\User;
use Sinett\MLAB\BuilderBundle\Form\UserType;
use Sinett\MLAB\BuilderBundle\Entity\Group;
use Sinett\MLAB\BuilderBundle\Form\GroupType;

class AdminController extends Controller
{
    public function appsAction()
    {
    	//die($this->container->parameters['mlab']['paths']['apps']);
    	$tabs = array(
    			"app" => "Apps",
    			"template" => "Templates",
    			"component" => "Components",
    			"category" => "Categories",
    			);
    	
    	return $this->render('SinettMLABBuilderBundle:Admin:apps.html.twig', array("tabs" => $tabs));
    }

    public function usersAction()
    {
    }
}
