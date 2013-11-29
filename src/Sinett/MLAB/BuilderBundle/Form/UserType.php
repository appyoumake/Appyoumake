<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class UserType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
    	$role_choices = array("ROLE_USER" => "User (*)", "ROLE_ADMIN" => "Administrator (**)");
		if ($options['current_user_role'] == "ROLE_SUPER_ADMIN") {
			$role_choices["ROLE_SUPER_ADMIN"] = "System (***)";
		}
		
    	$builder
            ->add('email')
            ->add('username')
            ->add('plainPassword', 'password')
            ->add('categoryOne')
            ->add('categoryTwo')
            ->add('categoryThree')
            ->add('groups')
            ->add('roles', 'choice', array('choices' => $role_choices, 'multiple' => true))
            ->add('enabled')
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\User',
        	'current_user_role' => 'ROLE_USER'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'sinett_mlab_builderbundle_user';
    }
}
