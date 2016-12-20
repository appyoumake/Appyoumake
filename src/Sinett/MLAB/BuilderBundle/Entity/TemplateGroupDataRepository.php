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
 * TemplateGroupDataRepository
 *
 */
class TemplateGroupDataRepository extends EntityRepository
{
	/**
	 * Returns an associated array 
	 */
	public function findAllToArray () {
		$components = array();
		foreach ($groups as $group) {
			$temp_components = $group->getComponents();
			foreach ($temp_components as $temp_component) {
				$components[$temp_component->getId()] = $temp_component->getArray();
			}
		}
		return $components;
	}    
}
