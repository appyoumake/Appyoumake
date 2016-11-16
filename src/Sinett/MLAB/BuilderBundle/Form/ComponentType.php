<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
//use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\Extension\Core\Type\FileType;

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
                    ->add('order_by', null, array('label' => 'app.admin.components.new.order_by'))
	    			->add('groups', EntityType::class, array('class' => 'SinettMLABBuilderBundle:Group', 'multiple' => true, 'label' => 'app.admin.components.new.componentgroups'))
                    ->add('zip_file', FileType::class, array('label' => 'app.admin.components.new.file'));
	    } else {
	    	//$builder->add('groups', null, array('label' => 'app.admin.components.new.groups'));
            //$builder->add('groups', ChoiceType::class, array('multiple' => true, 'label' => 'app.admin.components.edit.groups.groups'));
            $builder->add('componentgroups', EntityType::class, array('class' => 'SinettMLABBuilderBundle:ComponentGroup', 'multiple' => true, 'label' => 'app.admin.components.new.componentgroups'));
	    	//->add('roles', ChoiceType::class, array('choices' => $role_choices, 'label' => 'app.admin.users.new.or.edit.roles'))
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
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Component'
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_component';
    }
}
