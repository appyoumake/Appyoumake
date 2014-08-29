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
            ->add('email', null, array('label' => 'app.admin.users.new.or.edit.email'))
            ->add('username', null, array('label' => 'app.admin.users.new.or.edit.username'))
            ->add('plainPassword', 'password', array('label' => 'app.admin.users.new.or.edit.plain.password'))
            ->add('categoryOne', null, array('label' => 'app.admin.users.new.or.edit.categoryOne'))
            ->add('categoryTwo', null, array('label' => 'app.admin.users.new.or.edit.categoryTwo'))
            ->add('categoryThree', null, array('label' => 'app.admin.users.new.or.edit.categoryThree'))
            ->add('groups', null, array('label' => 'app.admin.users.new.or.edit.groups'))
            ->add('roles', 'choice', array('choices' => $role_choices, 'multiple' => true, 'label' => 'app.admin.users.new.or.edit.roles'))
            ->add('enabled', null, array('label' => 'app.admin.users.new.or.edit.enabled'))
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
