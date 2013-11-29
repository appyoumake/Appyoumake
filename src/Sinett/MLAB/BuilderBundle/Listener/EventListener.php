<?php
namespace Sinett\MLab\BuilderBundle\Listener;

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
		error_log("here----------------");
		$entity = $args->getEntity();
    	if ($entity->getIsDefault() == true) {
    		
    		$entityManager = $args->getEntityManager();
    		
    		$q = $entityManager->createQuery("UPDATE SinettMLABBuilderBundle:Group g SET g.isDefault = :default WHERE g.id <> :id")
    						   ->setParameters(array('default' => false, 'id' => $entity->getId()));
    		return $q->getResult();
    	}
	}
	
	public function postUpdate(LifecycleEventArgs $args)
	{
		error_log("here----------------");
		$this->postPersist($args);
	}
	
}