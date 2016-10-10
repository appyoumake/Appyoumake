<html>
    <head>
        
    </head>
    <body>
        <table>
            <thead>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
            </thead>
            <tbody>
                <tr><td>PHP Version</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                <tr><td>Item</td><td>Status</td><td>Action</td></tr>
                
            </tbody>
        </table>
    </body>
</html>
<?php

/*
 * This installer script will check if:
 *      Has Internet connection
 *      Must allow the use of URLs for downloading files using copy
 *      That date.timezone is set
 *      if relevant PHP extensions are loaded: 
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
tokenizer
wddx
xml
xmlreader
xmlwriter
zip
zlib


 *      Composer is installed (http://stackoverflow.com/questions/17219436/run-composer-with-a-php-script-in-browser)
 *      if relevant vendor / javascript libraries are installed
 *          Must figure out where put list of javascript libraries... can I use a fake entry in composer?
 *      parameter.yml is right
 *      if MySQL DB is created and accessible
 *      regenerate /app/bootstrap.php.cache
 *      ask for a salt
 *      offer to install icons, components and templates, they should be a zip file of directories to make it easy to do many.
 *      Check owner of files & app/cache & app/logs (should be same as current owner of php process)
 * 
 * For each check it will offer to fix it.
 */

//Separate libraries and mlab js/css files so can exclude a dir from git 
