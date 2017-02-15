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
use Symfony\Component\Form\FormEvents;
use Symfony\Component\Form\FormEvent;

use Doctrine\ORM\EntityRepository;

class CategoryType extends AbstractType
{
/**
 * Need to modify this so it shows the categories properly as parent-child lists
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
    	$action = explode("/", $options["action"]);
    	$action = array_pop($action);
        $entity = $builder->getData();
        
        if ($action == "create") {
    		$builder
            ->add('name', null, array('label' => 'app.admin.categories.new.name'))
    		->add('parent', 
                    null, 
                    array('query_builder' => function(EntityRepository $er) {
                              return $er->createQueryBuilder('c')->select("c")->where('c.lvl < 2')->addOrderBy('c.root')->addOrderBy('c.lft');
                        },'label' => 'app.admin.categories.new.parent', 'choice_label' => 'indentedName')
                 )
    		->add('system', null, array('label' => 'app.admin.categories.new.system', 'attr'=> array('class' => $options["class"]), 'label_attr'=> array('class' => $options["class"])));
    	} else {
    		$builder
    		->add('name', null, array('label' => 'app.admin.categories.edit.name'))
    		->add('parent', 
                  null, 
                  array('query_builder' => function(EntityRepository $er) {
                            return $er->createQueryBuilder('c')->select("c")->where('c.lvl < 2')->addOrderBy('c.lvl')->addOrderBy('c.name');
                          },
                        'label' => 'app.admin.categories.edit.parent', 
                        'data' => $entity->getParent())
                 )
    		->add('system', null, array('label' => 'app.admin.categories.edit.system', 'attr'=> array('class' => $options["class"]), 'label_attr'=> array('class' => $options["class"])));
    	}
    	
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Category',
        	'parent_category_id' => 0,
            'class' => ''
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_category';
    }
}

