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
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\Help'
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_help';
    }
}
