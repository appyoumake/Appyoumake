<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/*
 * Class that makes the locale selected by the user sticky,
 * see http://symfony.com/doc/2.3/cookbook/session/locale_sticky_session.html
 */

namespace Sinett\MLAB\BuilderBundle\Listener;

use Symfony\Component\HttpKernel\Event\GetResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpFoundation\Cookie;

class LocaleListener implements EventSubscriberInterface
{
    private $defaultLocale;

    public function __construct($defaultLocale = 'en_GB')
    {
        $this->defaultLocale = $defaultLocale;
    }

/**
 * Sets the locale setting for the request based on session variable 
 * (this var is set in onInteractiveLogin in /src/Sinett/MLAB/BuilderBundle/Listener/UserLocaleListener.php)
 * @param \Symfony\Component\HttpKernel\Event\GetResponseEvent $event
 * @return type
 */
    public function onKernelRequest(GetResponseEvent $event) {
        $request = $event->getRequest();
        if (!$request->hasPreviousSession()) {
            return;
        }

// try to see if the locale has been set as a _locale routing parameter
        $locale = $request->attributes->get('_locale');
        if ($locale) {
            $request->getSession()->set('_locale', $locale);
        } else {
// if no explicit locale has been set on this request, use one from the session
            $request->setLocale($request->getSession()->get('_locale', $this->defaultLocale));
        }
    }
    

/**
 * Using this to set a cookie that lasts inbetween logins, 
 * otherwise we will not know what they want to use, and they have to select everytime they log in
 * @param \Sinett\MLAB\BuilderBundle\Listener\FilterResponseEvent $event
 */
    public function onKernelResponse(FilterResponseEvent $event) {
        $request = $event->getRequest();
        if ($request->get('_route') == "fos_user_security_check") {
            $response = $event->getResponse();
            $locale = $request->getSession()->get('_locale');
            $response->headers->setCookie(new Cookie('mlab_persistent_locale', $locale, time() + (10 * 365 * 24 * 60 * 60) ) );
        }
    }

    public static function getSubscribedEvents()
    {
        return array(
// must be registered after the default Locale listener
            KernelEvents::REQUEST => array(array('onKernelRequest', 15)),
            KernelEvents::RESPONSE => array(array('onKernelResponse')),
        );
    }
}