<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
@license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class UserType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
    	$role_choices = array("User (*)" => "ROLE_USER", "Administrator (**)" => "ROLE_ADMIN");
		if ($options['current_user_role'] == "ROLE_SUPER_ADMIN") {
			$role_choices["System (***)"] = "ROLE_SUPER_ADMIN";
		}

        $builder
            ->add('email', null, array('label' => 'app.admin.users.new.or.edit.email', 'attr' => array('autocomplete' => 'off')))
            ->add('username', null, array('label' => 'app.admin.users.new.or.edit.username', 'attr' => array('autocomplete' => 'off')))
            ->add('plainPassword', PasswordType::class, array('label' => 'app.admin.users.new.or.edit.plain.password', 'attr' => array('autocomplete' => 'off')))
            ->add('groups', null, array('choices' => $options['groups'], 'multiple' => true, 'label' => 'app.admin.users.new.or.edit.groups'))
            ->add('role', ChoiceType::class, array('choices' => $role_choices, 'multiple' => false, 'label' => 'app.admin.users.new.or.edit.roles'))
            ->add('enabled', null, array('label' => 'app.admin.users.new.or.edit.enabled'))
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\User',
        	'current_user_role' => 'ROLE_USER',
            'groups' => null
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_user';
    }
}
