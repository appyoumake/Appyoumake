<?php

namespace Sinett\MLAB\BuilderBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * ComponentRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class ComponentRepository extends EntityRepository
{
	
	/**
	 * Returns a list of all components that is allowed for the specified groups
	 * @param collection of Sinett\MLAB\BuilderBundle\Entity\Group $groups
	 */
	public function findAllByGroups ( $groups) {
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
