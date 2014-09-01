<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class GroupType extends AbstractType
{
        /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', null, array('label' => 'app.admin.groups.new.or.edit.name'))
            ->add('description', null, array('label' => 'app.admin.groups.new.or.edit.description'))
            ->add('enabled', null, array('label' => 'app.admin.groups.new.or.edit.enabled'))
            ->add('users', null, array('label' => 'app.admin.groups.new.or.edit.users'))
        ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Group'
        ));
    }

    /**
     * @return string
     */ 
    public function getName()
    {
        return 'sinett_mlab_builderbundle_group';
    }
}
