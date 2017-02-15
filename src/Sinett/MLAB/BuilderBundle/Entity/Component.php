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
    private $componentGroups;
    
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
     * Not in DB, set to show if a component can be deleted
     */
    private $canDelete;
    
    
    /**
     * Constructor
     */
    public function __construct()
    {
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
     * Add componentGroups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup
     * @return Component
     */
    public function addComponentGroup(\Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup)
    {
        if (!$this->componentGroups->contains($componentGroup)) {
            $this->componentGroups->add($componentGroup);
            $componentGroup->setComponent($this);
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
            $job->setComponent(null);
        }

        return $this;
    }

    /**
     * Remove componentGroups
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\ComponentGroup $componentGroup
     */
    public function removeComponentGroupById($id)
    {
        foreach($this->groups as $group) {
            if ($group->getId() == $id) {
                $this->componentGroups->removeElement($group);
            }
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
     * Get groups
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getGroups()
    {
        return new \Doctrine\Common\Collections\ArrayCollection(array_map(
            function ($componentGroups) {
                return $componentGroups->getGroup();
            },
            $this->componentGroups->toArray()
        ));
    }
    
   /**
    * Add group, wrapper function for addComponentGroup
    *
    * @param \Sinett\MLAB\BuilderBundle\Entity\Group $group
    * @return Component
    */
    public function addGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $group)
    {
        $temp = new \Sinett\MLAB\BuilderBundle\Entity\ComponentGroup;
        $temp->setGroup($group)->setComponent($this);
        $this->addComponentGroup($temp);
        return $this;
    }
    
    /**
     * Remove group, wrapper function for removeComponentGroup
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $group
     */
    public function removeGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $group)
    {
        $this->removeComponentGroup($group);
        return $this;
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
     * @var string
     */
    private $group_names;
    
    
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
     * Set order
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
     * Get order
     *
     * @return float 
     */
    public function getOrderBy()
    {
        return $this->order_by;
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