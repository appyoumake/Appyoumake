<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

namespace Sinett\MLAB\BuilderBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * @abstract This is the class that validates and merges configuration from your app/config files
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html#cookbook-bundles-extension-config-class}
 */
class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritDoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('sinett_mlab_builder');

        // Here you should define the parameters that are allowed to
        // configure your bundle. See the documentation linked above for
        // more information on that topic.

        return $treeBuilder;
    }
}
