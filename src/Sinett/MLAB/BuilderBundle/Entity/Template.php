<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use ZipArchive;

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
	 * Checks that file is valid, moves it and then returns true or false
	 * @param array $valid_files: array of file names that MUST be in zip file
	 * @param array $replace_chars: array of characters to replace, internally we always use ascii < 128 only.
	 * 
	 * @return array result/message
	 */
    public function handleUpload($valid_files, $replace_chars, $destination)
    {
// the file property can be empty if the field is not required
    	if (null === $this->getZipFile()) {
    		return;
    	}
    	
    	if ($this->getZipFile()->isValid()) {
    		
// sanitize filename and use this as the path
    		$temp_name = $this->getZipFile()->getPathname();
    		$path_parts = pathinfo($this->getZipFile()->getClientOriginalName());
    		$template_name = $path_parts['filename'];
    		$dir_name = preg_replace(array_values($replace_chars), array_keys($replace_chars), $template_name);
    		$full_path = $destination . "/" . $dir_name;
    		$files = array();
    		
    		$zip = new ZipArchive();
    		$res = $zip->open($temp_name);
    		
//loop through and see if all required files are present 
    		if ($res === TRUE) {
    			for( $i = 0; $i < $zip->numFiles; $i++ ){
    				$f = $zip->statIndex( $i )['name'];
    				if (in_array($f, $valid_files)) {
    					unset($valid_files[array_search($f, $valid_files)]);
    				}
    			}
    			
//missing file, return error
    			if (!empty($valid_files)) {
// clean up the file property, not persisted to DB
    				$this->zip_file = null;    	
    				return array("result" => false, "message" => "Missing files: " . implode(",", $valid_files));
    			}
    			
//unable to make dir, return error
    			if (!file_exists($full_path)) {
	    			if (!mkdir($full_path, 0777, true)) {
// clean up the file property, not persisted to DB
    					$this->zip_file = null;    	
	    				return array("result" => false, "message" => "Unable to create folder for template: " . $full_path);
	    			}
	    		}
	    		
//try to unzip it
	    		if (!$zip->extractTo($full_path)) {
// clean up the file property, not persisted to DB
    				$this->zip_file = null;    	
	    			return array("result" => false, "message" => "Unable to unzip template: " . $zip->getStatusString());
	    		}
	    		$zip->close();
	    		
// finally set the path, name and description properties
	    		$this->setDescription(readfile($full_path . "/description.txt"));
	    		$this->setPath($dir_name);
	    		$this->setName($template_name);
	    		 
	    		
// clean up the file property, not persisted to DB
    			$this->zip_file = null;    	
	    		return array("result" => true);
    		} else {

// clean up the file property, not persisted to DB
    			$this->zip_file = null;    	
    			return array("result" => false, "message" => "Unable to open zip file");
    		}
	    
    	}
    }
}