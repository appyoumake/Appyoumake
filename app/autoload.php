<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

use Doctrine\Common\Annotations\AnnotationRegistry;
use Composer\Autoload\ClassLoader;

/**
 * @var ClassLoader $loader
 */
$loader = require __DIR__.'/../vendor/autoload.php';

AnnotationRegistry::registerLoader(array($loader, 'loadClass'));

return $loader;
