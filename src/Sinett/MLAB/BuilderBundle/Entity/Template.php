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
     * @var \Doctrine\Common\Collections\Collection
     */
    private $apps;
    
    /**
     * @var string
     */
    private $path;
    
    /**
     * @var boolean
     */
    private $enabled;
    
//flag used to see if it can be deleted or not
    private $canDelete;

    /**
     * @var string
     */
    private $group_names;
    

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
     * calculate the path of this app, using the starting path from the parameter which = mlab:paths:app parameter setting
     *
     * @param string $start_path
     * @return App
     */
    public function calculateFullPath($start_path)
    {
    	return $start_path . $this->getPath() . "/" ;
    }
    

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
    
    /**
     * Add apps
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $apps
     * @return Template
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
     * Returns all properties as an array
     */
    public function getArray() {
    	return array(
    			'id' => $this->id,
    			'name' => $this->name,
    			'path' => $this->path,
    			'description' => $this->description,
    			'version' => $this->version,
    			'groups' => $this->groups,
    			'enabled' => $this->enabled
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
    
    /**
     * Set enabled
     *
     * @param string $enabled
     * @return Component
     */
    public function setGroupNames($names)
    {
        $this->group_names = $names;
    
        return $this;
    }

    /**
     * Get group_names
     *
     * @return string 
     */
    public function getGroupNames()
    {
        return $this->group_names;
    }
    
}