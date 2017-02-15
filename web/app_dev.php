<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Debug\Debug;

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

// If you don't want to setup permissions the proper way, just uncomment the following PHP line
// read http://symfony.com/doc/current/book/installation.html#configuration-and-setup for more information
//umask(0000);

// This check prevents access to debug front controllers that are deployed by accident to production servers.
// Feel free to remove this, extend it, or make something more sophisticated.
/*if (isset($_SERVER['HTTP_CLIENT_IP'])
    || isset($_SERVER['HTTP_X_FORWARDED_FOR'])
    || !in_array(@$_SERVER['REMOTE_ADDR'], array('127.0.0.1', 'fe80::1', '::1'))
) {
    header('HTTP/1.0 403 Forbidden');
    exit('You are not allowed to access this file. Check '.basename(__FILE__).' for more information.');
}*/

//$loader = require_once __DIR__.'/../app/bootstrap.php.cache';
$loader = require_once __DIR__.'/../app/autoload.php';
Debug::enable();

require_once __DIR__.'/../app/AppKernel.php';

$kernel = new AppKernel('dev', true);

//$kernel->loadClassCache();
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
