<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * ComponentGroup
 */
class ComponentGroup
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Component
     */
    private $component;
    
    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Group
     */
    private $group;

    /**
     * @var string
     */
    private $credential;


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
     * Set component
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Component $component
     * @return this
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
     * Set group
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $group
     * @return this
     */
    public function setGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $group = null)
    {
        $this->group = $group;
    
        return $this;
    }

    /**
     * Get group
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Group 
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * Set credential
     *
     * @param string $credential
     * @return ComponentGroup
     */
    public function setCredential($credential)
    {
        $this->credential = $credential;
    
        return $this;
    }

    /**
     * Get credential
     *
     * @return string 
     */
    public function getCredential()
    {
        return $this->credential;
    }
    
}
