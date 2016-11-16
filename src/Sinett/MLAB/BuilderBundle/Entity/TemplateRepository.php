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
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllByGroups ( $groups) {
		$templates = array();
		foreach ($groups as $group) {
			$temp_templates = $group->getTemplates();
			foreach ($temp_templates as $temp_template) {
				$templates[$temp_template->getId()] = $temp_template->getArray();
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
    
	
	
}
