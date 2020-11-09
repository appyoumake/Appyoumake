<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
@license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

*******************************************************************************************************************************/

// file: src/Sinett/MLAB/BuilderBundle/Listener/DoctrineExtensionListener.php

namespace Sinett\MLAB\BuilderBundle\Listener;

use Symfony\Component\HttpKernel\Event\GetResponseEvent;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

class DoctrineExtensionListener implements ContainerAwareInterface
{
    /**
     * @var ContainerInterface
     */
    protected $container;

    public function setContainer(ContainerInterface $container = null)
    {
        $this->container = $container;
    }

    public function onLateKernelRequest(GetResponseEvent $event)
    {
        $translatable = $this->container->get('gedmo.listener.translatable');
        $translatable->setTranslatableLocale($event->getRequest()->getLocale());
    }

    public function onKernelRequest(GetResponseEvent $event)
    {
        $securityTokenStorage = $this->container->get('security.token_storage', ContainerInterface::NULL_ON_INVALID_REFERENCE);
        $securityAuthorisation = $this->container->get('security.authorization_checker', ContainerInterface::NULL_ON_INVALID_REFERENCE);
        if (null !== $securityTokenStorage && null !== $securityTokenStorage->getToken() && $securityAuthorisation->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $loggable = $this->container->get('gedmo.listener.loggable');
            $loggable->setUsername($securityTokenStorage->getToken()->getUsername());
        }
    }
}
