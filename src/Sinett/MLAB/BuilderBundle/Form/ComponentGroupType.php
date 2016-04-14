<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class ComponentType extends AbstractType
{
        /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $action = explode("/", $options["action"]);
    	$action = array_pop($action);
    	if ($action == "create") {
	    	$builder->add('enabled', null, array('label' => 'app.admin.components.new.enabled'))
	    			->add('groups', 'entity', array('class' => 'SinettMLABBuilderBundle:Group', 'multiple' => true, 'label' => 'app.admin.components.new.groups'))
                    ->add('zip_file', 'file', array('label' => 'app.admin.components.new.file'));
	    } else {
	    	//$builder->add('groups', null, array('label' => 'app.admin.components.new.groups'));
            //$builder->add('groups', 'choice', array('multiple' => true, 'label' => 'app.admin.components.edit.groups.groups'));
            $builder->add('groups', 'entity', array('class' => 'SinettMLABBuilderBundle:Group', 'multiple' => true, 'label' => 'app.admin.components.new.groups'));
	    	//->add('roles', 'choice', array('choices' => $role_choices, 'label' => 'app.admin.users.new.or.edit.roles'))
	    }
        
/*
        $builder->add('groups', 
                    null, 
                    array('query_builder' => function(EntityRepository $er) {
                              return $er->createQueryBuilder(array('c', 'g'), 'Sinett\MLAB\BuilderBundle\Entity\ComponentGroup')->where('g.lvl = 0')->addOrderBy('g.name');
                        },'label' => 'app.admin.components.edit.groups.groups')
                                
                                
                                $qb = $this->getEntityManager()->createQueryBuilder();
    		$qb->select(array('u', 'g'))
	            ->from($this->getEntityName(), 'u')
	            ->leftJoin('u.groups', 'g')
	            ->where('u.roles NOT LIKE :roles')
	            ->setParameter('roles', '%"ROLE_SUPER_ADMIN"%');
    		return $qb->getQuery()->getResult();
            
            
                 );

 */
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Component'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'sinett_mlab_builderbundle_component';
    }
}
