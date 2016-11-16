<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/*
 * Class to pick up locale from dropdown list when first login
 * see http://symfony.com/doc/2.3/cookbook/session/locale_sticky_session.html
 */

namespace Sinett\MLAB\BuilderBundle\Listener;

use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

/**
 * Stores the locale of the user in the session after the
 * login. This can be used by the LocaleListener afterwards.
 */
class UserLocaleListener {
    /**
     * @var Session
     */
    private $session;

    public function __construct(Session $session) {
        $this->session = $session;
    }

    /**
     * Here we update the locale proeprty for the user object if it has changed
     * The $login_locale comes from an additional 
     * @param InteractiveLoginEvent $event
     */
    public function onInteractiveLogin(InteractiveLoginEvent $event) {
        $user = $event->getAuthenticationToken()->getUser();
        $request = $event->getRequest();

        $login_locale = $request->request->get('_locale');
        $saved_locale = $user->getLocale();

//update user setting if required
        if ($login_locale !== $saved_locale) {
            $user->setLocale($login_locale);
        }
        
        $this->session->set('_locale', $login_locale);

    }
}