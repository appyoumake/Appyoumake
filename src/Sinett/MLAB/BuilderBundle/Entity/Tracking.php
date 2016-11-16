<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Tracking
 */
class Tracking
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var \DateTime
     */
    private $created;

    /**
     * @var string
     */
    private $action;

    /**
     * @var string
     */
    private $payload;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Component
     */
    private $component;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\User
     */
    private $user;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\App
     */
    private $app;


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
     * Set created
     *
     * @param \DateTime $created
     * @return Tracking
     */
    public function setCreated($created)
    {
        $this->created = $created;
    
        return $this;
    }

    /**
     * Get created
     *
     * @return \DateTime 
     */
    public function getCreated()
    {
        return $this->created;
    }

    /**
     * Set action
     *
     * @param string $action
     * @return Tracking
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
     * Set payload
     *
     * @param string $payload
     * @return Tracking
     */
    public function setPayload($payload)
    {
        $this->payload = $payload;
    
        return $this;
    }

    /**
     * Get payload
     *
     * @return string 
     */
    public function getPayload()
    {
        return $this->payload;
    }

    /**
     * Set component
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Component $component
     * @return Tracking
     */
    public function setComponent(\Sinett\MLAB\BuilderBundle\Entity\Component $component = null)
    {
        $this->component = $component;
    
        return $this;
    }

    /**
     * Get component
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Component 
     */
    public function getComponent()
    {
        return $this->component;
    }

    /**
     * Set user
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $user
     * @return Tracking
     */
    public function setUser(\Sinett\MLAB\BuilderBundle\Entity\User $user = null)
    {
        $this->user = $user;
    
        return $this;
    }

    /**
     * Get user
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\User 
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Set app
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $app
     * @return Tracking
     */
    public function setApp(\Sinett\MLAB\BuilderBundle\Entity\App $app = null)
    {
        $this->app = $app;
    
        return $this;
    }

    /**
     * Get app
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\App 
     */
    public function getApp()
    {
        return $this->app;
    }
    
    /**
     * Get display value
     *
     * @return \String
     */
    public function __toString()
    {
    	return $this->name;
    }
    
}