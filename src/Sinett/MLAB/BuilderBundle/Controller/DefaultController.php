<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
@license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)

*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;


class DefaultController extends Controller
{
    public function indexAction()
    {
        $securityContext = $this->container->get('security.authorization_checker');
        if ($securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            // authenticated REMEMBERED, FULLY will imply REMEMBERED (NON anonymous)
            return $this->redirect($this->generateUrl('app_builder_index'));
        }
        
        return $this->render('SinettMLABBuilderBundle:Default:index.html.twig');
    }
}
