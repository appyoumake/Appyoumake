<?php

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
    	$role_choices = array("ROLE_USER" => "User (*)", "ROLE_ADMIN" => "Administrator (**)");
		if ($options['current_user_role'] == "ROLE_SUPER_ADMIN") {
			$role_choices["ROLE_SUPER_ADMIN"] = "System (***)";
		}
		
    	$builder
            ->add('email', null, array('label' => 'app.admin.users.new.or.edit.email', 'attr' => array('autocomplete' => 'off')))
            ->add('username', null, array('label' => 'app.admin.users.new.or.edit.username', 'attr' => array('autocomplete' => 'off')))
            ->add('plainPassword', PasswordType::class, array('label' => 'app.admin.users.new.or.edit.plain.password', 'attr' => array('autocomplete' => 'off')))
/*    		->add('categoryOne', 
                    null, 
                    array('query_builder' => function(EntityRepository $er) {
                              return $er->createQueryBuilder('c')->where('c.lvl = 0')->addOrderBy('c.name');
                        },'label' => 'app.admin.users.new.or.edit.categoryOne',
                          'attr' => array('onchange' => 'loadCategories(this, 1);'))
                 )
    		->add('categoryTwo', 
                    null, 
                    array('label' => 'app.admin.users.new.or.edit.categoryTwo',
                          'attr' => array('onchange' => 'loadCategories(this, 2);'))
                 )
    		->add('categoryThree', 
                    null, 
                    array('label' => 'app.admin.users.new.or.edit.categoryThree')
                 )*/
            ->add('groups', null, array('label' => 'app.admin.users.new.or.edit.groups'))
            ->add('roles', ChoiceType::class, array('choices' => $role_choices, 'multiple' => true, 'label' => 'app.admin.users.new.or.edit.roles'))
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
        	'current_user_role' => 'ROLE_USER'
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
