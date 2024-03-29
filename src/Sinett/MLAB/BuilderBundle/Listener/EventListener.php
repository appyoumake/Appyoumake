<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
@license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

*******************************************************************************************************************************/
namespace Sinett\MLAB\BuilderBundle\Listener;

use Doctrine\ORM\Event\LifecycleEventArgs;
use Sinett\MLAB\BuilderBundle\Entity\Group;

class EventListener
{
	
	/**
	 * Will update all other groups than the one defined to not be default IF it is default
	 * We can only have one group that is default.
	 * @param unknown $id
	 */	
	public function postPersist(LifecycleEventArgs $args)
	{
/*		$entity = $args->getEntity();
    	if ($entity->getIsDefault() == true) {
    		
    		$entityManager = $args->getEntityManager();
    		
    		$q = $entityManager->createQuery("UPDATE SinettMLABBuilderBundle:Group g SET g.isDefault = :default WHERE g.id <> :id")
    						   ->setParameters(array('default' => false, 'id' => $entity->getId()));
    		return $q->getResult();
    	}*/
	}
	
	public function postUpdate(LifecycleEventArgs $args)
	{
		error_log("here----------------");
		$this->postPersist($args);
	}
	
}