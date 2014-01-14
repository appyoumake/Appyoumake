<?php
namespace Sinett\MLAB\BuilderBundle\Handler;

use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\SecurityContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Router;

class AuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{   
    protected $router;
    protected $security;
    protected $container;

    public function __construct(Router $router, SecurityContext $security, $container)
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
        $paths = $this->container->parameters['mlab']['paths'];
        foreach ($paths as $path) {
            if (!file_exists($path)) {
                if (!mkdir($path, 0777, true)) {
                    die("Unable to create folder $path, please check your installation and permissions");
                }
            }            
        }
        return new RedirectResponse($request->getSession()->get('_security.main.target_path', null));
        
    } 
}