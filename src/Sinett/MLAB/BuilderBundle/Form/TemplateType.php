<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\FileType;

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
	    	$builder->add('enabled', null, array('label' => 'app.admin.templates.new.enabled'))
	    			->add('groups', null, array('label' => 'app.admin.templates.new.groups'))
                    ->add('zip_file', FileType::class, array('label' => 'app.admin.templates.new.file'));
	    } else {
	    	$builder->add('groups', null, array('label' => 'app.admin.templates.edit.groups.groups'));
	    	
	    }
	    	
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Template'
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_template';
    }
}
