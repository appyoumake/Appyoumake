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
     * @var boolean
     */
    private $system;

    /**
     * @var integer
     */
    private $lft;

    /**
     * @var integer
     */
    private $rgt;

    /**
     * @var integer
     */
    private $root;

    /**
     * @var integer
     */
    private $lvl;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $children;

    /**
     * @var \Entity\Category
     */
    private $parent;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $appsCategory1;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $appsCategory2;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $appsCategory3;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $usersCategory1;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $usersCategory2;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $usersCategory3;

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

    /**
     * Set lft
     *
     * @param integer $lft
     * @return Category
     */
    public function setLft($lft)
    {
        $this->lft = $lft;
    
        return $this;
    }

    /**
     * Get lft
     *
     * @return integer 
     */
    public function getLft()
    {
        return $this->lft;
    }

    /**
     * Set rgt
     *
     * @param integer $rgt
     * @return Category
     */
    public function setRgt($rgt)
    {
        $this->rgt = $rgt;
    
        return $this;
    }

    /**
     * Get rgt
     *
     * @return integer 
     */
    public function getRgt()
    {
        return $this->rgt;
    }

    /**
     * Set root
     *
     * @param integer $root
     * @return Category
     */
    public function setRoot($root)
    {
        $this->root = $root;
    
        return $this;
    }

    /**
     * Get root
     *
     * @return integer 
     */
    public function getRoot()
    {
        return $this->root;
    }

    /**
     * Set lvl
     *
     * @param integer $lvl
     * @return Category
     */
    public function setLvl($lvl)
    {
        $this->lvl = $lvl;
    
        return $this;
    }

    /**
     * Get lvl
     *
     * @return integer 
     */
    public function getLvl()
    {
        return $this->lvl;
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
    private $enabled;


    /**
     * Set enabled
     *
     * @param boolean $enabled
     * @return Category
     */
    public function setEnabled($enabled)
    {
        $this->enabled = $enabled;
    
        return $this;
    }

    /**
     * Get enabled
     *
     * @return boolean 
     */
    public function getEnabled()
    {
        return $this->enabled;
    }

    /**
     * Add appsCategory1
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory1
     * @return Category
     */
    public function addAppsCategory1(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory1)
    {
        $this->appsCategory1[] = $appsCategory1;
    
        return $this;
    }

    /**
     * Remove appsCategory1
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory1
     */
    public function removeAppsCategory1(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory1)
    {
        $this->appsCategory1->removeElement($appsCategory1);
    }

    /**
     * Get appsCategory1
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAppsCategory1()
    {
        return $this->appsCategory1;
    }

    /**
     * Add appsCategory2
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory2
     * @return Category
     */
    public function addAppsCategory2(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory2)
    {
        $this->appsCategory2[] = $appsCategory2;
    
        return $this;
    }

    /**
     * Remove appsCategory2
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory2
     */
    public function removeAppsCategory2(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory2)
    {
        $this->appsCategory2->removeElement($appsCategory2);
    }

    /**
     * Get appsCategory2
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAppsCategory2()
    {
        return $this->appsCategory2;
    }

    /**
     * Add appsCategory3
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory3
     * @return Category
     */
    public function addAppsCategory3(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory3)
    {
        $this->appsCategory3[] = $appsCategory3;
    
        return $this;
    }

    /**
     * Remove appsCategory3
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsCategory3
     */
    public function removeAppsCategory3(\Sinett\MLAB\BuilderBundle\Entity\App $appsCategory3)
    {
        $this->appsCategory3->removeElement($appsCategory3);
    }

    /**
     * Get appsCategory3
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAppsCategory3()
    {
        return $this->appsCategory3;
    }

    /**
     * Add usersCategory1
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory1
     * @return Category
     */
    public function addUsersCategory1(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory1)
    {
        $this->usersCategory1[] = $usersCategory1;
    
        return $this;
    }

    /**
     * Remove usersCategory1
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory1
     */
    public function removeUsersCategory1(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory1)
    {
        $this->usersCategory1->removeElement($usersCategory1);
    }

    /**
     * Get usersCategory1
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getUsersCategory1()
    {
        return $this->usersCategory1;
    }

    /**
     * Add usersCategory2
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory2
     * @return Category
     */
    public function addUsersCategory2(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory2)
    {
        $this->usersCategory2[] = $usersCategory2;
    
        return $this;
    }

    /**
     * Remove usersCategory2
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory2
     */
    public function removeUsersCategory2(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory2)
    {
        $this->usersCategory2->removeElement($usersCategory2);
    }

    /**
     * Get usersCategory2
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getUsersCategory2()
    {
        return $this->usersCategory2;
    }

    /**
     * Add usersCategory3
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory3
     * @return Category
     */
    public function addUsersCategory3(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory3)
    {
        $this->usersCategory3[] = $usersCategory3;
    
        return $this;
    }

    /**
     * Remove usersCategory3
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $usersCategory3
     */
    public function removeUsersCategory3(\Sinett\MLAB\BuilderBundle\Entity\User $usersCategory3)
    {
        $this->usersCategory3->removeElement($usersCategory3);
    }

    /**
     * Get usersCategory3
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getUsersCategory3()
    {
        return $this->usersCategory3;
    }
}