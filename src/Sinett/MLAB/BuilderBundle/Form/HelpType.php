<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class HelpType extends AbstractType
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
        $builder
            ->add('route', null, array('label' => 'app.system.admin.help.new.route'))
            ->add('message', null, array('label' => 'app.system.admin.help.new.message'));
        } else {
            $builder
	    	->add('route', null, array('label' => 'app.system.admin.help.edit.route'))
            ->add('message', null, array('label' => 'app.system.admin.help.edit.message'));
	    	
	    }
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Help'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'sinett_mlab_builderbundle_help';
    }
}
