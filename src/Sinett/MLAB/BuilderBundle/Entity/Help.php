<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Help
 */
class Help
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $bundle;

    /**
     * @var string
     */
    private $controller;

    /**
     * @var string
     */
    private $action;

    /**
     * @var string
     */
    private $message;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set bundle
     *
     * @param string $bundle
     * @return Help
     */
    public function setBundle($bundle)
    {
        $this->bundle = $bundle;
    
        return $this;
    }

    /**
     * Get bundle
     *
     * @return string 
     */
    public function getBundle()
    {
        return $this->bundle;
    }

    /**
     * Set controller
     *
     * @param string $controller
     * @return Help
     */
    public function setController($controller)
    {
        $this->controller = $controller;
    
        return $this;
    }

    /**
     * Get controller
     *
     * @return string 
     */
    public function getController()
    {
        return $this->controller;
    }

    /**
     * Set action
     *
     * @param string $action
     * @return Help
     */
    public function setAction($action)
    {
        $this->action = $action;
    
        return $this;
    }

    /**
     * Get action
     *
     * @return string 
     */
    public function getAction()
    {
        return $this->action;
    }

    /**
     * Set message
     *
     * @param string $message
     * @return Help
     */
    public function setMessage($message)
    {
        $this->message = $message;
    
        return $this;
    }

    /**
     * Get message
     *
     * @return string 
     */
    public function getMessage()
    {
        return $this->message;
    }
}