<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * App
 */
class App
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
     * @var string
     */
    private $path;

    /**
     * @var string
     */
    private $description;

    /**
     * @var string
     */
    private $keywords;

    /**
     * @var float
     */
    private $version;

    /**
     * @var \DateTime
     */
    private $created;

    /**
     * @var \DateTime
     */
    private $updated;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Category
     */
    private $categoryOne;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Category
     */
    private $categoryTwo;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Category
     */
    private $categoryThree;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Template
     */
    private $template;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\User
     */
    private $user;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\User
     */
    private $updatedBy;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $groups;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->groups = new \Doctrine\Common\Collections\ArrayCollection();
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
     * @return App
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
     * Set path
     *
     * @param string $path
     * @return App
     */
    public function setPath($path)
    {
        $this->path = $path;
    
        return $this;
    }

    /**
     * Get path
     *
     * @return string 
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * Set description
     *
     * @param string $description
     * @return App
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
     * Set keywords
     *
     * @param string $keywords
     * @return App
     */
    public function setKeywords($keywords)
    {
        $this->keywords = $keywords;
    
        return $this;
    }

    /**
     * Get keywords
     *
     * @return string 
     */
    public function getKeywords()
    {
        return $this->keywords;
    }

    /**
     * Set version
     *
     * @param integer $version
     * @return App
     */
    public function setVersion($version)
    {
        $this->version = $version;
    
        return $this;
    }

    /**
     * Get version
     *
     * @return integer 
     */
    public function getVersion()
    {
        return $this->version;
    }

    /**
     * Set created
     *
     * @param \DateTime $created
     * @return App
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
     * Set updated
     *
     * @param \DateTime $updated
     * @return App
     */
    public function setUpdated($updated)
    {
        $this->updated = $updated;
    
        return $this;
    }

    /**
     * Get updated
     *
     * @return \DateTime 
     */
    public function getUpdated()
    {
        return $this->updated;
    }

    /**
     * Set categoryOne
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $categoryOne
     * @return App
     */
    public function setCategoryOne(\Sinett\MLAB\BuilderBundle\Entity\Category $categoryOne = null)
    {
        $this->categoryOne = $categoryOne;
    
        return $this;
    }

    /**
     * Get categoryOne
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Category 
     */
    public function getCategoryOne()
    {
        return $this->categoryOne;
    }

    /**
     * Set categoryTwo
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $categoryTwo
     * @return App
     */
    public function setCategoryTwo(\Sinett\MLAB\BuilderBundle\Entity\Category $categoryTwo = null)
    {
        $this->categoryTwo = $categoryTwo;
    
        return $this;
    }

    /**
     * Get categoryTwo
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Category 
     */
    public function getCategoryTwo()
    {
        return $this->categoryTwo;
    }

    /**
     * Set categoryThree
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Category $categoryThree
     * @return App
     */
    public function setCategoryThree(\Sinett\MLAB\BuilderBundle\Entity\Category $categoryThree = null)
    {
        $this->categoryThree = $categoryThree;
    
        return $this;
    }

    /**
     * Get categoryThree
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Category 
     */
    public function getCategoryThree()
    {
        return $this->categoryThree;
    }

    /**
     * Set template
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Template $template
     * @return App
     */
    public function setTemplate(\Sinett\MLAB\BuilderBundle\Entity\Template $template = null)
    {
        $this->template = $template;
    
        return $this;
    }

    /**
     * Get template
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Template 
     */
    public function getTemplate()
    {
        return $this->template;
    }

    /**
     * Set user
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $user
     * @return App
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
     * Set updatedBy
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\User $updatedBy
     * @return App
     */
    public function setUpdatedBy(\Sinett\MLAB\BuilderBundle\Entity\User $updatedBy = null)
    {
        $this->updatedBy = $updatedBy;
    
        return $this;
    }

    /**
     * Get updatedBy
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\User 
     */
    public function getUpdatedBy()
    {
        return $this->updatedBy;
    }

    /**
     * Add groups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $groups
     * @return App
     */
    public function addGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $groups)
    {
        $this->groups[] = $groups;
    
        return $this;
    }

    /**
     * Remove groups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $groups
     */
    public function removeGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $groups)
    {
        $this->groups->removeElement($groups);
    }

    /**
     * Get groups
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getGroups()
    {
        return $this->groups;
    }

    /**
     * Get display value
     *
     * @return \String
     */
    public function __toString()
    {
    	return $this->name . " (" . $this->version . ")";
    }
    
}