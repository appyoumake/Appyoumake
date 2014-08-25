<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use FOS\UserBundle\Entity\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;

/**
 * User class, different from other entities as it needs to extend the FosUserBundle BaseUser class
 * In addition it needs a construct function, and ID must be protected:
 * https://github.com/FriendsOfSymfony/FOSUserBundle/blob/master/Resources/doc/index.md
 * 
 * Apart from this it is a standard Doctrine ORM class.
 */
class User extends BaseUser
{
    /**
     * @var integer
     */
    protected $id;

    /**
     * @var string
     */
    protected $email;

    /**
     * @var string
     */
    protected $password;

    /**
     * @var string
     */
    protected $salt;

    /**
     * @var \DateTime
     */
    protected $created;

    /**
     * @var \DateTime
     */
    protected $updated;

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
     * @var \Sinett\MLAB\BuilderBundle\Entity\App
     */
    private $app;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\App
     */
    private $appUpdatedBy;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    protected $groups;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    protected $roles;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $apps;
    
    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $appsUpdatedBy;
    

    /**
     * Constructor
     */
    public function __construct()
    {
    	parent::__construct(); //added for FosUserBundle security
#        $this->groups = new \Doctrine\Common\Collections\ArrayCollection();
#        $this->roles = new \Doctrine\Common\Collections\ArrayCollection();
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
     * Set created
     *
     * @param \DateTime $created
     * @return User
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
     * @return User
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
     * @return User
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
     * @return User
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
     * @return User
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
     * Set app
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $app
     * @return User
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
     * Set appUpdatedBy
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appUpdatedBy
     * @return User
     */
    public function setAppUpdatedBy(\Sinett\MLAB\BuilderBundle\Entity\App $appUpdatedBy = null)
    {
        $this->appUpdatedBy = $appUpdatedBy;
    
        return $this;
    }

    /**
     * Get appUpdatedBy
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\App 
     */
    public function getAppUpdatedBy()
    {
        return $this->appUpdatedBy;
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
     * Get roles
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getRoles()
    {
        return $this->roles;
    }
    
    /**
     * Get display value
     *
     * @return \String
     */
    public function __toString()
    {
    	return $this->username;
    }
    
    /**
     * Get expiresAt
     *
     * @return \DateTime
     */
    public function getExpiresAt()
    {
    	return $this->expiresAt;
    }
    
    /**
     * Get credentials_expire_at
     *
     * @return \DateTime
     */
    public function getCredentialsExpireAt()
    {
    	return $this->credentialsExpireAt;
    }


    /**
     * Add groups
     *
     * @param \FOS\UserBundle\Model\GroupInterface $groups
     * @return User
     */
    public function addGroup(\FOS\UserBundle\Model\GroupInterface $groups)
    {
        $this->groups[] = $groups;
    
        return $this;
    }

    /**
     * Remove groups
     *
     * @param \FOS\UserBundle\Model\GroupInterface $groups
     */
    public function removeGroup(\FOS\UserBundle\Model\GroupInterface $groups)
    {
        $this->groups->removeElement($groups);
    }

    /**
     * Add apps
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $apps
     * @return User
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
     * Add appsUpdatedBy
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsUpdatedBy
     * @return User
     */
    public function addAppsUpdatedBy(\Sinett\MLAB\BuilderBundle\Entity\App $appsUpdatedBy)
    {
        $this->appsUpdatedBy[] = $appsUpdatedBy;
    
        return $this;
    }

    /**
     * Remove appsUpdatedBy
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $appsUpdatedBy
     */
    public function removeAppsUpdatedBy(\Sinett\MLAB\BuilderBundle\Entity\App $appsUpdatedBy)
    {
        $this->appsUpdatedBy->removeElement($appsUpdatedBy);
    }

    /**
     * Get appsUpdatedBy
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAppsUpdatedBy()
    {
        return $this->appsUpdatedBy;
    }
    
/**
 * From: http://stackoverflow.com/questions/15993637/add-a-default-role-during-user-registration-with-fosuserbundle
 * Overriding Fos User class due to impossible to set default role ROLE_USER 
 * @see User at line 138
 * @link https://github.com/FriendsOfSymfony/FOSUserBundle/blob/master/Model/User.php#L138
 * {@inheritdoc}
 */
    public function addRole($role) {
        $role = strtoupper($role);

        if (!in_array($role, $this->roles, true)) {
            $this->roles[] = $role;
        }

        return $this;
    }
    

}