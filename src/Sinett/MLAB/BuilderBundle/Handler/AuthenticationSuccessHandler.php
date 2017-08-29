<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Handler;

use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Router;

class AuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{   
    protected $router;
    protected $security;
    protected $container;

    public function __construct(Router $router, AuthorizationChecker $security, $container)
    {
        $this->router   = $router;
        $this->security = $security;
        $this->container = $container;
    }

/**
 * When they have logged in we check if certain folders are available or try to make them
 * We put it here to avoid running this code for every page that is loaded
 * 
 * @param \Symfony\Component\HttpFoundation\Request $request
 * @param \Symfony\Component\Security\Core\Authentication\Token\TokenInterface $token
 */
    public function onAuthenticationSuccess(Request $request, TokenInterface $token)
    {   
        $paths = $this->container->getParameter('mlab')['paths'];
        $env = $this->container->getParameter('kernel.environment');
        foreach ($paths as $path) {
            if (!file_exists($path)) {
                if (!mkdir($path, 0777, true)) {
                    die("Unable to create folder $path, please check your installation and permissions");
                }
            }            
        }
        
//add env. prefix if required
        if ($env != "prod") {
            $def_url = "/app_$env.php/"; 
        } else {
            $def_url = '/';
        }
        $x = $request->getSession()->get('_security.main.target_path', $def_url);
        return new RedirectResponse($request->getSession()->get('_security.main.target_path', $def_url));
        
    } 
}