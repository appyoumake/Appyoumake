<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Component
 */
class Component
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
     * @var \Doctrine\Common\Collections\Collection
     */
    private $groups;
    
    /**
     * zip file that is uploaded
     */
    private $zip_file;
    
    /**
     * @var float
     */
    private $version;
    
    /**
     * @var integer
     */
    private $order_by;
    
    /**
     * @var integer
     */
    private $new_line;
    
    /**
     * Not in DB, set to show if a component can be deleted
     */
    private $canDelete;
    
    
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
     * @return Component
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
     * @return Component
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
     * Add groups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $groups
     * @return Component
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
     * Set path
     *
     * @param string $path
     * @return Component
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
     * @var string
     */
    private $path;
    
    
    /**
     * Set enabled
     *
     * @param boolean $enabled
     * @return Component
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
     * Set version
     *
     * @param float $version
     * @return Component
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
    
    /**
     * Set version
     *
     * @param float $version
     * @return Component
     */
    public function setOrderBy($order_by)
    {
        $this->order_by = $order_by;
    
        return $this;
    }

    /**
     * Get version
     *
     * @return float 
     */
    public function getOrderBy()
    {
        return $this->order_by;
    }
    
    /**
     * Set version
     *
     * @param float $version
     * @return Component
     */
    public function setNewLine($new_line)
    {
        $this->new_line = $new_line;
    
        return $this;
    }

    /**
     * Get version
     *
     * @return float 
     */
    public function getNewLine()
    {
        return $this->new_line;
    }
    
    /**
     * Returns all properties as an array, it also has a placeholder for the pages that are locked
     */
    public function getArray() {
    	return array(
    			'id' => $this->id,
    			'name' => $this->name,
    			'path' => $this->path,
    			'description' => $this->description,
    			'version' => $this->version,
    			'enabled' => $this->enabled,
    	);
    }    
    
    /**
     * Set can_delete
     *
     * @param string $name
     * @return Template
     */
    public function setCanDelete($canDelete)
    {
        $this->canDelete = $canDelete;
    
        return $this;
    }

    /**
     * Get can_delete
     *
     * @return string 
     */
    public function getCanDelete()
    {
        return $this->canDelete;
    }
    
}