<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Entity;
use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Dumper;

use Doctrine\ORM\Mapping as ORM;

/**
 * TemplateGroupData
 */
class TemplateGroupData
{

    const ACCESS_STATE_SUPERADMIN = 0;
    const ACCESS_STATE_ADMIN = 1;
    const ACCESS_STATE_USER = 2;
  
    /**
     * @var integer
     */
    private $id;

    /**
     * @var int
     */
    private $template_id;

    /**
     * @var int
     */
    private $group_id;

    /**
     * @var int
     */
    private $access_state;

    /**
     * @var int
     */
    private $template;
    
    /**
     * @var int
     */
    private $group;
    
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
     * Set template ID field
     *
     * @param integer $template_id
     * @return TemplateGroupData
     */
    public function setTemplateId($template_id)
    {
        $this->template_id = $template_id;
    
        return $this;
    }

    /**
     * Get template id
     *
     * @return integer
     */
    public function getTemplateId()
    {
        return $this->template_id;
    }

    /**
     * Set group
     *
     * @param integer $group_id
     * @return TemplateGroupData
     */
    public function setGroupId($group_id)
    {
        $this->group_id = $group_id;
    
        return $this;
    }

    /**
     * Get group
     *
     * @return int 
     */
    public function getGroupId()
    {
        return $this->group_id;
    }
    
    /**
     * Set access state
     *
     * @param integer
     * @return TemplateGroupData
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
    
    /**
     * Set template
     *
     * @param \Sinett\MLAB\BuilderBundle\Entity\Template $template
     * @return ComponentGroup
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
}
