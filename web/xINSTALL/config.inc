<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

//Lists version numbers, etc. to check for. Should be edited when Mlab or a library is updated

$php_version_min = 50400; 
$php_version_max = 60000;
$mysql_version_min = 5.5;
$composer_version_min = "1.2.4";
$symfony_version_min = 2.8;
$uglifyjs_version_min = 2.4;
$nodejs_version_min = "0.10.29";
$system_path = "PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'";
$optional_params = array("parameters__database_port", "parameters__mailer_user", "parameters__mailer_password");
