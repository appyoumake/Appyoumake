<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Category
 */
class Category
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $name;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $children;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Category
     */
    private $parent;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->children = new \Doctrine\Common\Collections\ArrayCollection();
    }
    
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
     * Set name
     *
     * @param string $name
     * @return Category
     */
    public function setName($name)
    {
        $this->name = $name;
    
        return $this;
    }

    /**
     * Get name
     *
     * @return string 
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Add children
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $children
     * @return Category
     */
    public function addChildren(\Sinett\MLAB\BuilderBundle\Entity\Category $children)
    {
        $this->children[] = $children;
    
        return $this;
    }

    /**
     * Remove children
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $children
     */
    public function removeChildren(\Sinett\MLAB\BuilderBundle\Entity\Category $children)
    {
        $this->children->removeElement($children);
    }

    /**
     * Get children
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * Set parent
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $parent
     * @return Category
     */
    public function setParent(\Sinett\MLAB\BuilderBundle\Entity\Category $parent = null)
    {
        $this->parent = $parent;
    
        return $this;
    }

    /**
     * Get parent
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Category 
     */
    public function getParent()
    {
        return $this->parent;
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
    
    
    /**
     * @var boolean
     */
    private $system;


    /**
     * Set system
     *
     * @param boolean $system
     * @return Category
     */
    public function setSystem($system)
    {
        $this->system = $system;
    
        return $this;
    }

    /**
     * Get system
     *
     * @return boolean 
     */
    public function getSystem()
    {
        return $this->system;
    }
}