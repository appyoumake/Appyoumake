<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Template
 */
class Template
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
    private $description;

    /**
     * @var string
     */
    private $compatibleWith;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\App
     */
    private $app;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $groups;

    /**
     * zip file that is uploaded
     */
    private $zip_file;

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
     * @return Template
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
     * @return Template
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
     * Set compatibleWith
     *
     * @param string $compatibleWith
     * @return Template
     */
    public function setCompatibleWith($compatibleWith)
    {
        $this->compatibleWith = $compatibleWith;
    
        return $this;
    }

    /**
     * Get compatibleWith
     *
     * @return string 
     */
    public function getCompatibleWith()
    {
        return $this->compatibleWith;
    }

    /**
     * Set app
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $app
     * @return Template
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
     * Add groups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $groups
     * @return Template
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
    	return $this->name;
    }
    
    /**
     * Sets file.
     *
     * @param UploadedFile $file
     */
    public function setZipFile(UploadedFile $zip_file = null)
    {
    	$this->zip_file = $zip_file;
    }
    
    /**
     * Get file.
     *
     * @return UploadedFile
     */
    public function getZipFile()
    {
    	return $this->zip_file;
    }
    
    
    /**
     * @var string
     */
    private $path;


    /**
     * Set path
     *
     * @param string $path
     * @return Template
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
     * @var boolean
     */
    private $enabled;


    /**
     * Set enabled
     *
     * @param boolean $enabled
     * @return Template
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
     * @var float
     */
    private $version;


    /**
     * Set version
     *
     * @param float $version
     * @return Template
     */
    public function setVersion($version)
    {
        $this->version = $version;
    
        return $this;
    }

    /**
     * Get version
     *
     * @return float 
     */
    public function getVersion()
    {
        return $this->version;
    }
}