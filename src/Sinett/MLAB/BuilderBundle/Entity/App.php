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
use Symfony\Component\Yaml\Parser;

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
    private $active_version;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $appVersions;
    

    /**
     * @var \DateTime
     */
    private $created;

    /**
     * @var \DateTime
     */
    private $updated;

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

    const MARKET_NOT_PUBLISHED = 0;
    const MARKET_OLD_VERSION = 1;
    const MARKET_CURRENT_VERSION = 2;
    
    /**
     * @var boolean
     */
    private $published = self::MARKET_NOT_PUBLISHED;
    
    /**
     * zip file that is uploaded
     */
    private $zip_file;
    
    /**
     * icon that is created, stored as a data url string
     */
    private $icon_file;
    
    /**
     * id of app to be copied to a new app
     */
    private $copy_app;
    
    /**
     * splash image that is uploaded
     */
    private $splash_file;
    
    /**
     * Office file to be imported
     */
    private $import_file;
    
    /**
     * Unique ID for the app, same as the Java reverse domain
     */
    private $uid;
    
    /**
     * tags for the app, replacing the 3 category fields from before. We store TSV values here
     */
    private $tags;
    
    
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
     * Set uid
     *
     * @param string $uid
     * @return App
     */
    public function setUid($uid)
    {
        $this->uid = $uid;
    
        return $this;
    }

    /**
     * Get uid
     *
     * @return string 
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * Set tags
     *
     * @param string $tags
     * @return App
     */
    public function setTags($tags)
    {
        $this->tags = $tags;
    
        return $this;
    }

    /**
     * Get tags
     *
     * @return string 
     */
    public function getTags()
    {
        return $this->tags;
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
     * NOW REDUNDANT, BUT KEEP FOR FUTURE REFERENCE/USE
     * generate a sanitised pathname from name of app
     *
     * @param array $replace: search / replace array
     * @return App
     */
    public function generatePath($replace)
    {
        $this->path = strtolower(preg_replace(array_values($replace), array_keys($replace), trim($this->name)));
    
        return $this;
    }
    
    /**
     * calculate the path of this app, using the starting path from the parameter which = mlab:paths:app parameter setting 
     *
     * @param string $start_path
     * @return App
     */
    public function calculateFullPath($start_path)
    {
        return $start_path . $this->getPath() . "/" . $this->getActiveVersion() . "/" ;
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
     * Set active_version
     *
     * @param float $active_version
     * @return App
     */
    public function setActiveVersion($active_version)
    {
        $this->active_version = $active_version;
    
        return $this;
    }

    /**
     * Get version
     *
     * @return float 
     */
    public function getActiveVersion()
    {
        return $this->active_version;
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
    	return $this->name . " (" . $this->active_version . ")";
    }
    
    /**
     * @var boolean
     */
    private $enabled;


    /**
     * Set enabled
     *
     * @param boolean $enabled
     * @return App
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
     * Set published
     *
     * @param boolean $published
     * @return App
     */
    public function setPublished($published)
    {
    	$this->published = $published;
    
    	return $this;
    }
    
    /**
     * Get published
     *
     * @return boolean
     */
    public function getPublished()
    {
    	return $this->published;
    }
    
    /**
     * Returns all properties as an array, including the configuration details of the template used for this app
     * 
     */
    public function getArray($template_path = "") {
        if ($template_path != "") {
            $yaml = new Parser();
            $fname = $template_path . $this->getTemplate()->getPath() . "/conf.yml";
            $config = $yaml->parse(file_get_contents($fname));
        } else {
            $config = array();
        }

    	return array(
    		'id' => $this->id,
    		'name' => $this->name,
    		'path' => $this->path,
    		'description' => $this->description,
    		'keywords' => $this->keywords,
            'versions' => $this->appVersions,
    		'active_version' => $this->active_version,
    		'created' => $this->created,
    		'updated' => $this->updated,
    		'template' => $this->template,
            "template_config" => $config,
    		'user' => $this->user,
    		'updatedBy' => $this->updatedBy,
    		'groups' => $this->groups,
    		'published' => $this->published,
    		'enabled' => $this->enabled,
            'uid' => $this->uid,
            'tags' => $this->tags
    		);
    }
    
    /**
     * Returns all properties as simple array, i.e. templates are the name and not an object
     */
    public function getArrayFlat($template_path = "") {
        if ($template_path != "") {
            $yaml = new Parser();
            $fname = $template_path . $this->getTemplate()->getPath() . "/conf.yml";
            $config = $yaml->parse(file_get_contents($fname));
        } else {
            $config = array();
        }
        
    	$groups = array();
    	foreach ($this->groups as $group) {
    		$groups[] = $group->getName();
    	}
        
        $versions = array();
        foreach ($this->appVersions as $version) {
            $versions[$version->getId()] = $version->getVersion();
        }
    	return array(
    			'id' => $this->id,
    			'name' => $this->name,
    			'path' => $this->path,
    			'description' => $this->description,
    			'keywords' => $this->keywords,
                'versions' => $versions,
    			'active_version' => $this->active_version,
    			'created' => $this->created->format('Y-m-d H:i:s'),
    			'updated' => $this->updated->format('Y-m-d H:i:s'),
    			'template' => $this->template->getName(),
                "template_config" => $config,
    			'user' => $this->user->getUserName(),
    			'updatedBy' => $this->updatedBy->getUserName(),
    			'groups' => $groups,
    			'published' => $this->published,
    			'enabled' => $this->enabled,
    			'uid' => $this->uid,
                'tags' => $this->tags
    	);
    }    
    
/**
 * Retruns highest and lowest versions for a given app
 * @return type
 */
    public function getVersionRange() {
        $highest_version = 0;
        $lowest_version = 99999999;
        
        foreach ($this->appVersions as $version) {
            $highest_version = max($highest_version, $version->getVersion());
            $lowest_version = min($lowest_version, $version->getVersion());
        }
        
        return array("high" => $highest_version, "low" => $lowest_version);
    }
    
    
/**** FILES RELATED TO AN APP ****/
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
     * Sets file.
     *
     * @param string icon image as data url
     */
    public function setIconFile($icon_file = null)
    {
    	$this->icon_file = $icon_file;
    }
    
    /**
     * Get file.
     *
     * @return UploadedFile
     */
    public function getIconFile()
    {
    	return $this->icon_file;
    }
    
    /**
     * Sets file.
     *
     * @param int $copy_app
     */
    public function setCopyApp($copy_app = null)
    {
    	$this->copy_app = $copy_app;
    }
    
    /**
     * Get file.
     *
     * @return int
     */
    public function getCopyApp()
    {
    	return $this->copy_app;
    }
    
    /**
     * Sets file.
     *
     * @param UploadedFile $file
     */
    public function setSplashFile(UploadedFile $splash_file = null)
    {
    	$this->splash_file = $splash_file;
    }
    
    /**
     * Get file.
     *
     * @return UploadedFile
     */
    public function getSplashFile()
    {
    	return $this->splash_file;
    }
    
    /**
     * Sets file.
     *
     * @param UploadedFile $file
     */
    public function setImportFile(UploadedFile $import_file = null)
    {
    	$this->import_file = $import_file;
    }
    
    /**
     * Get file.
     *
     * @return UploadedFile
     */
    public function getImportFile()
    {
    	return $this->import_file;
    }
    
    /**
     * Add appVersion
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\AppVersion $app_version
     * @return this
     */
    public function addAppVersion(\Sinett\MLAB\BuilderBundle\Entity\AppVersion $app_version)
    {
        $this->appVersions[] = $app_version;
    
        return $this;
    }

    /**
     * Remove appVersion
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\AppVersion $app_version
     */
    public function removeAppVersion(\Sinett\MLAB\BuilderBundle\Entity\AppVersion $app_version)
    {
        $this->appVersions->removeElement($app_version);
    }

    /**
     * Get appVersion
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAppVersions()
    {
        return $this->appVersions;
    }
    
    /**
     * Sets the appversions array to a single appVersion, used when create a new branch
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function setSingleAppVersion(\Sinett\MLAB\BuilderBundle\Entity\AppVersion $app_version)
    {
        $this->appVersions = array($app_version);
        
        return $this;
    }
    
}