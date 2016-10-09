<?php

/*
 * This installer script will check if:
 *      Has Internet connection
 *      That date.timezone is set
 *      if relevant PHP extensions are loaded: 
bcmath
bz2
calendar
cgi-fcgi
Core
ctype
date
dba
dom
ereg
exif
fileinfo
filter
ftp
gd
gettext
hash
iconv
intl
json
libxml
mbstring
mhash
mysql
mysqli
openssl
pcre
PDO
pdo_mysql
Phar
posix
readline
Reflection
session
shmop
SimpleXML
soap
sockets
SPL
standard
sysvmsg
sysvsem
sysvshm
tokenizer
wddx
xdebug
xml
xmlreader
xmlwriter
Zend OPcache
zip
zlib

[Zend Modules]
Xdebug
Zend OPcache

 *      Composer is installed (http://stackoverflow.com/questions/17219436/run-composer-with-a-php-script-in-browser)
 *      if relevant libraries are installed
 *      parameter.yml is right
 *      if MySQL DB is created and accessible
 *      regenerate /app/bootstrap.php.cache
 *      Check owner of files & app/cache & app/logs (should be same as current owner of php process)
 * 
 * For each check it will offer to fix it.
 */

