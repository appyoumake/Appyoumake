<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no)
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ComponentGroupType extends AbstractType
{
        /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('credential')
            ->add('component')
            ->add('group')
        ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Sinett\MLAB\BuilderBundle\Entity\ComponentGroup'
        ));
    }

    /**
     * @return string
     */
    public function getBlockPrefix()
    {
        return 'sinett_mlab_builderbundle_componentgroup';
    }
}
