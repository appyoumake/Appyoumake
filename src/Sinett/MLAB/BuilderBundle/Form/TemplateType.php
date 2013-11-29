<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class TemplateType extends AbstractType
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
	    	$builder->add('enabled')
	    			->add('groups')
	            	->add('zip_file', 'file');
	    } else {
	    	$builder->add('enabled')
	    			->add('groups');
	    	
	    }
	    	
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Template'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'sinett_mlab_builderbundle_template';
    }
}
