<?php

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

use Doctrine\ORM\EntityRepository;

class CategoryType extends AbstractType
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
    		->add('name', null, array('label' => 'app.admin.categories.new.name'))
    		->add('parent', 
                    null, 
                    array('disabled' => true,'query_builder' => function(EntityRepository $er) {
                              return $er->createQueryBuilder('c')->select("c")->where('c.lvl < 2')->addOrderBy('c.lvl')->addOrderBy('c.name');
                        },'label' => 'app.admin.categories.new.parent')
                 )
    		->add('system', null, array('label' => 'app.admin.categories.new.system'));
    	} else {
    		$builder
    		->add('name', null, array('label' => 'app.admin.categories.edit.name'))
    		->add('parent', 
                    null, 
                    array('disabled' => true,'query_builder' => function(EntityRepository $er) {
                              return $er->createQueryBuilder('c')->select("c")->where('c.lvl < 2')->addOrderBy('c.lvl')->addOrderBy('c.name');
                         },'label' => 'app.admin.categories.edit.parent')
                 )
    		->add('system', null, array('label' => 'app.admin.categories.edit.system'));
    	}
    	
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Category',
        	'parent_category_id' => 0
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'sinett_mlab_builderbundle_category';
    }
}

