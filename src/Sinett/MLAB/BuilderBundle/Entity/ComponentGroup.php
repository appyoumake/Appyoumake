<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Entity;
use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Dumper;

use Doctrine\ORM\Mapping as ORM;

/**
 * ComponentGroup
 */
class ComponentGroup
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $credential;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Component
     */
    private $component;

    /**
     * @var \Sinett\MLAB\BuilderBundle\Entity\Group
     */
    private $group;

    /**
     * @var int
     */
    private $access_state;
    
    
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
     * Set credential, we expect an associative array as the param, use YAML library dump function to convert to string
     *
     * @param array $credential
     * @return ComponentGroup
     */
    public function setCredential($credential)
    {
        if (is_array($credential)) {
            $dumper = new Dumper();
            $this->credential = $dumper->dump( $credential, 1 );
        } else {
            $this->credential = "";
        }

        return $this;
    }

    /**
     * Get credential
     *
     * @return array 
     */
    public function getCredential()
    {
        $yaml = new Parser();
        
        if ( strlen( trim( $this->credential ) ) == 0 ) {
            $temp = array();
        } else {
            $temp = $yaml->parse( $this->credential );
        }
        return $temp;
    }

    /**
     * Set component
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Component $component
     * @return ComponentGroup
     */
    public function setComponent(\Sinett\MLAB\BuilderBundle\Entity\Component $component = null)
    {
        $this->component = $component;
    
        return $this;
    }

    /**
     * Get component
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Component 
     */
    public function getComponent()
    {
        return $this->component;
    }

    /**
     * Set group
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Group $group
     * @return ComponentGroup
     */
    public function setGroup(\Sinett\MLAB\BuilderBundle\Entity\Group $group = null)
    {
        $this->group = $group;
    
        return $this;
    }

    /**
     * Get group
     *
     * @return \Sinett\MLAB\BuilderBundle\Entity\Group 
     */
    public function getGroup()
    {
        return $this->group;
    }
    
    /**
     * Get display value
     *
     * @return \String
     */
    public function __toString()
    {
    	return $this->group->getName();
    }
    
    /**
     * Set access state
     *
     * @param integer
     * @return ComponentGroup
     */
    public function setAccessState($state)
    {
        $this->access_state = $state;
    
        return $this;
    }

    /**
     * Get access state
     *
     * @return integer
     */
    public function getAccessState()
    {
        return $this->access_state;
    }
    
    
}
