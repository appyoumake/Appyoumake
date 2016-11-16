<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

use Symfony\Component\ClassLoader\ApcClassLoader;
use Symfony\Component\HttpFoundation\Request;

//Mlab hack, before do ANYTHING we check if the install directory exists, and if so redirect them promptly
if (file_exists(__DIR__.'/../web/INSTALL/index.php')) {
    header("Location: http" . (isset($_SERVER['HTTPS']) ? 's' : '') . "://" . "{$_SERVER['HTTP_HOST']}/INSTALL/index.php");
    die();
}

//DO NOT REMOVE, YOUR LICENSE REQUIRES THIS CHECK TO BE PRESENT
$uglifycheck = false;
$info = shell_exec("uglifyjs --version");
if ($info) {
    $info = explode(" ", $info);
    foreach ($info as $value) {
        if (floatval(trim($value))) {
            $uglifycheck = version_compare(trim($value), "2", ">=");
        }
    }
}

if (!$uglifycheck) {
    die("UglifyJS version 2 or higher must be installed for Mlab to work properly! Refer to Mlab license and documentation.");
}
    
$loader = require_once __DIR__.'/../app/bootstrap.php.cache';

// Use APC for autoloading to improve performance.
// Change 'sf2' to a unique prefix in order to prevent cache key conflicts
// with other applications also using APC.
/*
$loader = new ApcClassLoader('sf2', $loader);
$loader->register(true);
*/

require_once __DIR__.'/../app/AppKernel.php';
//require_once __DIR__.'/../app/AppCache.php';

$kernel = new AppKernel('prod', false);
$kernel->loadClassCache();
//$kernel = new AppCache($kernel);
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
