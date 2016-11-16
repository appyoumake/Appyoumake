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
     * @var \Sinett\MLAB\BuilderBundle\Entity\App
     */
    private $app;
    
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
     * Set app
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\App $app
     * @return App
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
