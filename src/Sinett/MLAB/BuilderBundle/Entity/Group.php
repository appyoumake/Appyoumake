<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Entity;

//next line added for Symfony_2.8
use FOS\UserBundle\Model\Group as BaseGroup;

use Doctrine\ORM\Mapping as ORM;

/**
 * Group
 */
class Group extends BaseGroup
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
    private $componentGroups;
    
    /**
     * @var boolean
     */
    private $enabled;

    
    /**
     * Categories for a group, JSON structure of nested strings (3 levels)
     * @var string
     */
    private $categories;

    
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->users = new \Doctrine\Common\Collections\ArrayCollection();
        $this->menus = new \Doctrine\Common\Collections\ArrayCollection();
        $this->apps = new \Doctrine\Common\Collections\ArrayCollection();
        $this->templates = new \Doctrine\Common\Collections\ArrayCollection();
        $this->componentGroups = new \Doctrine\Common\Collections\ArrayCollection();
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
     * Add componentGroups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup
     * @return Group
     */
    public function addComponentGroup(\Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup)
    {
        if (!$this->componentGroups->contains($componentGroup)) {
            $this->componentGroups->add($componentGroup);
            $componentGroup->setGroup($this);
        }
    
        return $this;
    }

    /**
     * Remove componentGroups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup
     */
    public function removeComponentGroup(\Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup)
    {

        if ($this->componentGroups->contains($componentGroup)) {
            $this->componentGroups->removeElement($componentGroup);
            $job->setGroup(null);
        }

        return $this;
    }

    /**
     * Get componentGroups
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getComponentGroups()
    {
        return $this->componentGroups;
        //return $this->componentGroups->toArray();
    }
    
    /**
     * Get components
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getComponents()
    {
        return new \Doctrine\Common\Collections\ArrayCollection(array_map(
            function ($componentGroups) {
                return $componentGroups->getComponent();
            },
            $this->componentGroups->toArray()
        ));
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
    
    /**
     * Set categories
     *
     * @param string $categories
     * @return Group
     */
    public function setCategories($categories)
    {
        $this->categories = $categories;
    
        return $this;
    }

    /**
     * Get categories
     *
     * @return string 
     */
    public function getCategories()
    {
        return $this->categories;
    }
    
}