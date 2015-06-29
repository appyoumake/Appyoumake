<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * AppVersion
 */
class AppVersion
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var integer
     */
    private $appId;

    /**
     * @var float
     */
    private $version;

    /**
     * @var integer
     */
    private $enabled;


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
     * Set appId
     *
     * @param integer $appId
     * @return AppVersion
     */
    public function setAppId($appId)
    {
        $this->appId = $appId;
    
        return $this;
    }

    /**
     * Get appId
     *
     * @return integer 
     */
    public function getAppId()
    {
        return $this->appId;
    }

    /**
     * Set version
     *
     * @param float $version
     * @return AppVersion
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
     * Set enabled
     *
     * @param integer $enabled
     * @return AppVersion
     */
    public function setEnabled($enabled)
    {
        $this->enabled = $enabled;
    
        return $this;
    }

    /**
     * Get enabled
     *
     * @return integer 
     */
    public function getEnabled()
    {
        return $this->enabled;
    }
}
