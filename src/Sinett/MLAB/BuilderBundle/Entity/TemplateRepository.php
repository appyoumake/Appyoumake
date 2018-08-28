<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * TemplateRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class TemplateRepository extends EntityRepository
{
	/**
	 * Returns a list of all templates that is allowed for the specified groups
     * The TemplateGroupData::access_state field has bit 1 set to 1 if user access is set up for this person's group access
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllByGroups ( $groups ) {
		$templates = array();
        $repository = $this->getEntityManager()->getRepository('SinettMLABBuilderBundle:TemplateGroupData');
		foreach ($groups as $group) {
			$temp_templates = $group->getTemplates();
			foreach ($temp_templates as $temp_template) {
//we have used a duplicate access record with a new field 
//(long fricking story, but basically due to having spent far too lon converting another table from koin table to join+additional data table)
//if there is a record for the current user (as defined in the list of groups we receive) AND access > 0, then they can use this template
//in the admin pages the value of the field (1 = regular user, 3 = admin only) has different meaning, if 3 the admin user can allow access by setting to 1
//see https://github.com/Sinettlab/MLAB/issues/305                
                $access_record = $repository->findOneBy(array('template_id' => $temp_template->getId(), 'group_id' => $group->getId()));
                if ($access_record) {
                    $access_state = $access_record->getAccessState();
                    if ($access_state > 0) {
                        $templates[$temp_template->getId()] = $temp_template->getArray();
                    }
                }
			}
		}
		return $templates;
	}
    
	/**
	 * Returns a list of all templates that is allowed for the specified groups
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllByGroupsFlatArray ( $groups) {
		$templates = array();
		foreach ($groups as $group) {
			$temp_templates = $group->getTemplates();
			foreach ($temp_templates as $temp_template) {
				$templates[$temp_template->getDescription()] = $temp_template->getId();
			}
		}
		return $templates;
	}
    
	/**
	 * Returns a list of all templates with information about whether they can be deleted (not used in any apps)
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllCheckDeleteable () {
		$templates = $this->findAll();
		foreach ($templates as $id => $template) {
			$temp_apps = $template->getApps();
			$templates[$id]->setCanDelete($temp_apps->count() == 0);
		}
		return $templates;
	}

  	/**
	 * Returns a list of all templates with information about whether they can be deleted (not used in any apps)
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllEnabledCheckDeleteable () {
		$templates = $this->findByEnabled(1);
		foreach ($templates as $id => $template) {
			$temp_apps = $template->getApps();
			$templates[$id]->setCanDelete($temp_apps->count() == 0);
		}
		return $templates;
	}
    

}
