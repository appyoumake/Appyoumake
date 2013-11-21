<?php

namespace Sinett\MLAB\BuilderBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;


class DefaultController extends Controller
{
    public function indexAction()
    {
        return $this->render('SinettMLABBuilderBundle:Default:index.html.twig');
    }
}
