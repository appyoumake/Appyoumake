<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Group
 */
class Group extends \FOS\UserBundle\Model\Group
{
    /**
     * @var integer
     */
    protected $id;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    private $description;

    /**
     * @var boolean
     */
    private $isDefault;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $users;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $menus;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $apps;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $templates;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $components;
    
    /**
     * @var boolean
     */
    private $enabled;

    
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->users = new \Doctrine\Common\Collections\ArrayCollection();
        $this->menus = new \Doctrine\Common\Collections\ArrayCollection();
        $this->apps = new \Doctrine\Common\Collections\ArrayCollection();
        $this->templates = new \Doctrine\Common\Collections\ArrayCollection();
        $this->components = new \Doctrine\Common\Collections\ArrayCollection();
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
     * @return Group
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
     * Set description
     *
     * @param string $description
     * @return Group
     */
    public function setDescription($description)
    {
        $this->description = $description;
    
        return $this;
    }

    /**
     * Get description
     *
     * @return string 
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * Set isDefault
     *
     * @param boolean $isDefault
     * @return Group
     */
    public function setIsDefault($isDefault)
    {
        $this->isDefault = $isDefault;
    
        return $this;
    }

    /**
     * Get isDefault
     *
     * @return boolean 
     */
    public function getIsDefault()
    {
        return $this->isDefault;
    }

    /**
     * Add users
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $users
     * @return Group
     */
    public function addUser(\Sinett\MLAB\BuilderBundle\Entity\User $users)
    {
        $this->users[] = $users;
    
        return $this;
    }

    /**
     * Remove users
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $users
     */
    public function removeUser(\Sinett\MLAB\BuilderBundle\Entity\User $users)
    {
        $this->users->removeElement($users);
    }

    /**
     * Get users
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getUsers()
    {
        return $this->users;
    }

    /**
     * Add menus
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Menu $menus
     * @return Group
     */
    public function addMenu(\Sinett\MLAB\BuilderBundle\Entity\Menu $menus)
    {
        $this->menus[] = $menus;
    
        return $this;
    }

    /**
     * Remove menus
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Menu $menus
     */
    public function removeMenu(\Sinett\MLAB\BuilderBundle\Entity\Menu $menus)
    {
        $this->menus->removeElement($menus);
    }

    /**
     * Get menus
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getMenus()
    {
        return $this->menus;
    }

    /**
     * Add apps
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $apps
     * @return Group
     */
    public function addApp(\Sinett\MLAB\BuilderBundle\Entity\App $apps)
    {
        $this->apps[] = $apps;
    
        return $this;
    }

    /**
     * Remove apps
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $apps
     */
    public function removeApp(\Sinett\MLAB\BuilderBundle\Entity\App $apps)
    {
        $this->apps->removeElement($apps);
    }

    /**
     * Get apps
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getApps()
    {
        return $this->apps;
    }

    /**
     * Add templates
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Template $templates
     * @return Group
     */
    public function addTemplate(\Sinett\MLAB\BuilderBundle\Entity\Template $templates)
    {
        $this->templates[] = $templates;
    
        return $this;
    }

    /**
     * Remove templates
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Template $templates
     */
    public function removeTemplate(\Sinett\MLAB\BuilderBundle\Entity\Template $templates)
    {
        $this->templates->removeElement($templates);
    }

    /**
     * Get templates
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getTemplates()
    {
        return $this->templates;
    }

    /**
     * Add components
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Component $components
     * @return Group
     */
    public function addComponent(\Sinett\MLAB\BuilderBundle\Entity\Component $components)
    {
        $this->components[] = $components;
    
        return $this;
    }

    /**
     * Remove components
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Component $components
     */
    public function removeComponent(\Sinett\MLAB\BuilderBundle\Entity\Component $components)
    {
        $this->components->removeElement($components);
    }

    /**
     * Get components
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getComponents()
    {
        return $this->components;
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
     * Set enabled
     *
     * @param boolean $enabled
     * @return Group
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
    
}