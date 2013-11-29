<?php

namespace Sinett\MLAB\BuilderBundle\FileManagement;
use ZipArchive;

class FileManagement {
	
	private $config;
	private $required_files;
	private $replace_chars;
	private $paths;
	private $entity_type;
	
    public function __construct($mlab)
    {
        $this->config = $mlab;
    }
	
    public function setConfig($entity_type) {
    	$this->entity_type = $entity_type;
    	$this->required_files = $this->config['verify_uploads'][$entity_type];
    	$this->replace_chars = $this->config['replace_in_filenames'];
    	$this->destination = $this->config['paths'][$entity_type];
    }
    
	/**
	 * Checks that file is valid, moves it and then returns true or false
	 * @param array $this->required_files: array of file names that MUST be in zip file
	 * @param array $this->replace_chars: array of characters to replace, internally we always use ascii < 128 only.
	 *
	 * @return array result/message
	 */
	public function handleUpload($entity, $overwrite = false)
	{
		
// the file property can be empty if the field is not required
		if (null === $entity->getZipFile()) {
			return;
		}
		 
		if ($entity->getZipFile()->isValid()) {
	
// sanitize filename and use this as the path
			$temp_name = $entity->getZipFile()->getPathname();
			$path_parts = pathinfo($entity->getZipFile()->getClientOriginalName());
			$object_name = $path_parts['filename'];
			$dir_name = preg_replace(array_values($this->replace_chars), array_keys($this->replace_chars), $object_name);
			$full_path = $this->destination . "/" . $dir_name;
			$files = array();
	
			$zip = new ZipArchive();
			$res = $zip->open($temp_name);
	
//loop through and see if all required files are present
			if ($res === TRUE) {
				for( $i = 0; $i < $zip->numFiles; $i++ ){
					$f = $zip->statIndex( $i )['name'];
					if (in_array($f, $this->required_files)) {
						unset($this->required_files[array_search($f, $this->required_files)]);
					}
				}
				 
//missing file, return error
				if (!empty($this->required_files)) {
// clean up the file property, not persisted to DB
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Missing files: " . implode(",", $this->required_files));
				}
				 
//if overwrite, just use existing folder
				
//unable to make dir, return error
				if (!$overwrite && !file_exists($full_path)) {
					if (!mkdir($full_path, 0777, true)) {
// clean up the file property, not persisted to DB
						$entity->setZipFile(null);
						return array("result" => false, "message" => "Unable to create folder for {$this->entity_type}: " . $full_path);
					}
				} else if ($overwrite && !file_exists($full_path)) {
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Folder for {$this->entity_type} does not exist, cannot update: " . $full_path);
				}
		   
//try to unzip it
				if (!$zip->extractTo($full_path)) {
// clean up the file property, not persisted to DB
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Unable to unzip {$this->entity_type}: " . $zip->getStatusString());
				}
				$zip->close();
		   
// finally set the path, name and description properties, description = tooltip in the conf.txt. stored as "tooltip=This is a regular headline, use only once per page"
				if (file_exists($full_path . "/conf.txt")) {
					$temp = file($full_path . "/conf.txt");
					foreach ($temp as $line) {
						if (substr(trim($line), 0, 8) == "tooltip=") {
							$entity->setDescription(substr(trim($line), 8));
						} else if (substr(trim($line), 0, 16) == "compatible_with=") {
							$entity->setCompatibleWith(substr(trim($line), 16));
						} else if (substr(trim($line), 0, 8) == "version=") {
							$entity->setVersion(substr(trim($line), 8));
						}
						
					}
				}
				
				$entity->setPath($dir_name);
				$entity->setName($object_name);
		   
// clean up the file property, not persisted to DB
				$entity->setZipFile(null);
				return array("result" => true);
			} else {
	
// clean up the file property, not persisted to DB
				$entity->setZipFile(null);
				return array("result" => false, "message" => "Unable to open zip file");
			}
		  
		}
	}
}