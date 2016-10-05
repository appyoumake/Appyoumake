<?php

/*
 * This installer script will check if:
 *      Has Internet connection
 *      That date.timezone = Europe/Oslo
 *      Composer is installed (http://stackoverflow.com/questions/17219436/run-composer-with-a-php-script-in-browser)
 *      if relevant libraries are installed
 *      parameter.yml is right
 *      if MySQL DB is created and accessible
 *      regenerate /app/bootstrap.php.cache
 *      Check owner of files & app/cache & app/logs (should be same as current owner of php process)
 * 
 * For each check it will offer to fix it.
 */

