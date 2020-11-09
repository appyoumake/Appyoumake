# Appyoumake installation and configuration guide 

<table>
<tbody>
<tr class="odd">
<td></td>
<td></td>
<td><p><strong>Authors</strong></p>
<p>Arild Bergh, Cecilie Jackbo Gran</p>
<p>15 June 2017</p>

<p>This document explains how to install and configure Appyoumake. Appyoumake is a complete app creation framework and eco system that includes an app editor facility, an app compiler service and an app market. It facilitates the quick and easy development of mobile apps by non-developers; hence it provides opportunities for training, research and information sharing on many levels in the Norwegian defence as well as in civilian organisations. Appyoumake apps are built from templates and components, additional templates and components can be built from HTML5/CSS3/JavaScript.</p></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

> o

**Contents**

[1 Introduction 3](#introduction)

[2 Appyoumake server setup 4](#_Ref475040111)

[2.1 Install server and helper software
5](#install-server-and-helper-software)

[2.2 Install web server 5](#install-web-server)

[2.3 Check that web server works 6](#check-that-web-server-works)

[2.4 Install php5 and php5-fpm 6](#install-php-and-php-fpm)

[2.5 Install MySQL 7](#install-mysql)

[2.6 Install the NodeJS, npm and uglifyjs software packages
7](#install-the-nodejs-npm-and-uglifyjs-software-packages)

[2.7 Create directory and copy Appyoumake source code
7](#create-directory-and-copy-mlab-source-code)

[2.8 Server configuration 8](#server-configuration)

[2.9 Complete Appyoumake installation 13](#complete-mlab-installation)

[2.10 Support importing PPT/DOC files
15](#support-importing-pptdoc-files)

[3 Compilation Service configuration
16](#compilation-service-configuration)

[4 Conclusion 17](#_Toc481134645)

[Further reading 17](#_Toc481134646)

Introduction
============

This note provides information for system administrators or developers
who want to install and run the Appyoumake app builder framework.

<span id="_Ref475040111" class="anchor"></span>The Appyoumake app builder
framework can be used by non-experts to rapidly create and share
advanced mobile apps within an organisation or a group, or with the
general public. Apps can be created for different platforms such as iOS
or Android. This is done through three Appyoumake elements that work together:

1.  An easy to use app editor aimed at users with no particular computer
    skills. Here the app creator will build an app by selecting a
    template that defines the look and feel of the app. They then create
    the individual pages that make up an app. Each page is made up of
    one or more components that the user adds from a list of components.
    Each component contains discrete pieces of information such as a
    map, a headline or a video.

2.  An automated process converts the content added in step 1 to a
    complete, standalone app. This app can be tested locally on your own
    smart device before being shared more widely.

3.  A standalone app market can be used in place of the publicly
    available App Store or Google Play. In this app market one can limit
    acess to specific users. Apps can be uploaded to this market by Appyoumake
    administrators and potential app users can search, browse and
    download apps to their mobile devices.

Appyoumake uses the same open standards that you find in web pages to build
and store the pages that make up an app. HTML5 (a markup language) is
used to display the content, CSS3 (which formats text and images) is
used to format the content and JavaScript (a programming language for
HTML5 pages) is used to provide advanced features such as user
interaction, reading device sensors such as GPS position or playing a
video. The three Appyoumake elements discussed above are using the same
standards plus the PHP programming language for the server side code.

Four aspects of Appyoumake make it unique:

1.  It allows the creation of very advanced apps despite being very
    simple to use.

2.  It offers full internal control of what apps look like, where the
    data is stored, and how users can access the apps.

3.  It is extensible through the use of **components**. A component
    encapsulates a discrete and self-contained piece of functionality,
    such as displaying a video, summarising information from an external
    database or collecting information through a questionnaire. The
    component will request relevant information from the app creator at
    design time, for instance by allowing the aspect ratio of a video to
    be selected, and will then use this information to display itself as
    specified by the app creator.

4.  It takes care of how an app looks to, and interacts with, the app
    user through the use of **templates**. A template takes care of
    formatting elements such as font sizes or colours, and provides
    navigation throughout the app. This means that an organisation can
    have a standard design for all their apps even though apps may be
    made by different people using different components and none of the
    app creators need to do any formatting themselves.

This note is a compilation of online documentation from the Appyoumake GitHub
repository. For the latest updates and other relevant documents we
recommend consulting the GitHub repository for Appyoumake which is found at
<https://github.com/Sinettlab/openMLAB/tree/master/DOCS>.

*The mention of a feature in this document does not imply or guarantee
that this feature is implemented at the current time!*

Appyoumake server setup
=================

Before you can use Appyoumake you need to install the source code on a
correctly configured webserver. Appyoumake is primarily tested on Linux, but
there are no inherent Linux features required, if your operating system
supports the requirements below you should be able to run Appyoumake on it.

**All examples in this document use a generic Debian/Ubuntu
installation, thus all examples refer to apt-get as the package manager.
Other Linux distributions may use rpm, yum or other package managers,
modify the commands as required. On Windows there is no package manager.
For each software installation you need to download the relevant
software package and run the executable installer.**

There are four main steps involved in this:

1.  Install server software such as web server, database server, PHP,
    etc.

2.  Create a directory (folder) for Appyoumake and copy the source code into
    this directory.

3.  Configure the various server software and helper software (where
    required) to match the Appyoumake directory location.

4.  Run the Appyoumake installation script which will verify that the setup is
    correct and perform certain actions that will complete the setup.

    1.  Alternatively you can manually install Appyoumake. The steps required
        are described in this document under section *2.9.2*
        *(Alternative 2) Complete manually* toward the end of the
        document.

Install server and helper software
----------------------------------

These are the servers that Appyoumake requires:

1.  *Web server* (Must support integration with PHP. Apache 2.x,
    Lighttpd and Nginx have all been tested).

2.  *Database server* (MySQL 5.x has been tested, Appyoumake should work with
    any database server supported by the Doctrine ORM[1]).

3.  *PHP* (5.4+ or higher, but not version 7.x. PHP should ideally be
    run using the FastCGI Process Manager[2] for performance reasons).

    1.  You also need the following PHP extensions installed: ereg,
        > fileinfo, gd, gettext, iconv, intl, json, libxml, mbstring,
        > mhash, mysqli, openssl, pcre, pdo\_mysql, phar, readline,
        > session, simplexml, soap, sockets, zip, dom, xml, xmlreader,
        > xmlwriter.

4.  *Node.js* (runs a websocket server for communication with remote
    services).

5.  *Npm* (helper software, used to install uglify primarily).

6.  *UglifyJS* (a tool to compress Javascript files, without this you
    cannot run Appyoumake). 

Notes on how to configure the servers are given in section 2.2 nedenfor.

Install web server
------------------

Choose which web server you want to use. Apache is often preinstalled on
Linux, if so you can skip this step. To install on Linux, use your
package manager and install the relevant package.

For Windows refer to these notes for Apache:
<https://httpd.apache.org/docs/current/platform/windows.html> or these
notes for nginx: <http://nginx.org/en/docs/windows.html>. Lighttpd is
not available in an updated version for Windows.

### Alternative 1: Install Apache

Run the following commands:

apt-get install apache2

service apache2 start

Relevant link: <http://httpd.apache.org/docs/current/install.html>.

### Alternative 2: Install Nginx

Apache2 may be installed by default, if so you need to remove it:

service apache2 stop

update-rc.d -f apache2 remove

apt-get remove apache2

Then install nginx using these commands:

sudo apt-get install nginx

sudo service nginx start

Relevant link:
<https://www.howtoforge.com/installing-nginx-with-php5-fpm-and-mysql-on-ubuntu-14.04-lts-lemp>.

### Alternative 3: Install Lighttpd

apt-get install lighttpd

service lighttpd start

Relevant link: <http://redmine.lighttpd.net/projects/lighttpd/wiki>.

Check that web server works
---------------------------

Point your browser to <http://localhost> to test that the web server is
working; you should see a basic welcome page.

Install php and php-fpm
-----------------------

Appyoumake has been tested with PHP version 5.x, it will currently not work on
PHP version 7. The examples here show how to install php5 on Ubuntu, the
actual package name will vary between different distributions.

Install core php5, including php5-fpm that runs a FastCGI server on the
socket /var/run/php5-fpm.sock.

sudo apt-get install php5-common php5-cli php5-fpm

Next you need to install required PHP extensions. Depending on your
version of PHP, some of these may already be installed as part of the
above core PHP installation. Below is a common command to add missing
extensions. The Appyoumake installation script will check if any of these are
missing later.

sudo apt-get install php5-gd, php5-intl, php5-json, php5-mcrypt,
php5-mysql, php5-readline, php-gettext, php-pear, php-xml-dtd,
php-xml-htmlsax3, php-xml-parser, php-xml-rpc, php-xml-rpc2,
php-xml-rss, php-xml-serializer

Install MySQL
-------------

If mysql is not installed you need to run the following commands:

apt-get install mysql-server mysql-client

You will be asked to set the password for the root user, make a note of
this for later.

Install the NodeJS, npm and uglifyjs software packages
------------------------------------------------------

If NodeJS or npm is not installed you need to run the following
commands:

apt-get install nodejs npm

After npm is installed you can use npm to install uglifyjs (a socalled
obfuscator package for JavaScript, that is, it will make the JavaScript
less easy to read so others cannot copy the source code without
premission):

npm install uglifyjs -g

The “-g” parameter is important, without this uglifyjs will be installed
in the current directory; it needs to be installed “globally” so it can
be used by Appyoumake later.

Create directory and copy Appyoumake source code
------------------------------------------

After installing the servers and helper software in step 1, you need to
copy over the Appyoumake source code.

-   First create a new directory in a suitable location for your OS/Web
    server. On Linux this is often /var/www, but refer to your OS
    information where the best location for this is. Below we will use
    {mlab\_code} for this folder. You will also need to create another
    folder for the elements that make up an app and the apps themselves
    (apps, components, icons and templates), below we will use
    {mlab\_elements} for these directories. Create the following
    directories:

sudo mkdir {mlab\_code}

sudo mkdir {mlab\_elements}

sudo mkdir {mlab\_elements}/apps/

sudo mkdir {mlab\_elements}/components/

sudo mkdir {mlab\_elements}/templates/

sudo mkdir {mlab\_elements}/icons/

-   Next get your Appyoumake zip file, typically named something like
    mlab-v.0.9.0.zip (the actual filename will vary depending on the
    version you install). Unzip it inside the new directory.

    Make sure that the Appyoumake code is inside the root of the directory. If
    the unzip process has created a sub-directory inside the directory
    you must copy the files from the sub-directory and into the
    directory.

-   Then if you using the Appyoumake installation scrip (see code example
    > below), set the right permissions to the directory you created.
    > The owner of the Appyoumake directory and all files and directories
    > inside the Appyoumake directory should be the web server process/user.
    > This is because Appyoumake will need to create files as users create
    > apps or uploads new components, etc.  
    >   
    > Below the actual user name is indicated with *{webserveruser}*,
    > you will need to replace this with the actual user name of your
    > web server process user.

sudo chown {webserveruser}:{webserveruser} {mlab\_code} -R

sudo chown {webserveruser}:{webserveruser} .{mlab\_elements} -R

Server configuration
--------------------

The server software installed in step 1 needs some additional
configurations to be able to work with Appyoumake. In this section you will
find detailed instructions and examples for each of these servers.
Replace {mlab\_url} with the relevant URL for your server.

### Configure Web servers

#### Alternative 1: Apache configuration

To run Appyoumake as a virtual host Apache needs the setup outlined below. The
actual file to enter this information into varies, under Linux this is
often in the /etc/apache2/sites-available/ directory, you can use a file
named 020-mlab.conf to store the configuration.

-   Using *nano* as your text editor, enter the following command
    (substitute *nano* below with your preferred text editor).

sudo nano /etc/apache2/sites-available/020-mlab.conf

-   In the empty file enter the following configuration:

&lt;VirtualHost \*:80&gt;

ServerName {mlab\_url}

ServerAdmin webmaster@localhost

AliasMatch /mlab\_elements/components/(.\*)
/{mlab\_elements}/components/$1

AliasMatch /mlab\_elements/apps/(.\*) /{mlab\_elements}/apps/$1

AliasMatch /mlab\_elements/templates/(.\*)
/{mlab\_elements}/templates/$1

AliasMatch /mlab\_elements/icons/(.\*) /{mlab\_elements}/icons/$1

&lt;Directory /{mlab\_elements}/&gt;

    Options Indexes FollowSymLinks MultiViews

    AllowOverride All

    Order allow,deny

    allow from all

    Require all granted

&lt;/Directory&gt;

DocumentRoot /{mlab\_code}/web

&lt;Directory /{mlab\_code}/web/&gt;

    Options Indexes FollowSymLinks MultiViews

    AllowOverride None

    Order allow,deny

    allow from all

    Require all granted

    &lt;IfModule mod\_rewrite.c&gt;

        RewriteEngine On

        RewriteCond %{REQUEST\_FILENAME} !-f

        RewriteRule ^(.\*)$ /app.php \[QSA,L\]

    &lt;/IfModule&gt;

&lt;/Directory&gt;

ErrorLog ${APACHE\_LOG\_DIR}/error.log

CustomLog ${APACHE\_LOG\_DIR}/access.log combined

&lt;/VirtualHost&gt;

-   If your system supports the APACHE\_LOG\_DIR variable, you can use
    ${APACHE\_LOG\_DIR}/, otherwise you will need to enter the full
    path, for instance /var/log/apache2/.

-   If you made the config file in the sites-available folder. You need
    to make a link to it in the sites-enabled folder. The sites-enabled
    manages which of your virtual hosts will actually be booted into
    Apache when it starts up. This can for example be useful when you
    want to maintain virtual-host configuration files, but don't want
    the sites to be live, or are in a deployment process. Link your
    newly created file:

sudo ln -s /{your-path}/apache2/sites-available/020-mlab.conf
/{your-path}/apache2/sites-enabled/020-mlab.conf 

-   Restart Apache to make the changes take effect:

sudo service apache2 restart

#### Alternative 2: Nginx configuration

-   Disable the default vhost by removing the symbolic link in
    /etc/nginx/sites-available/default:

sudo rm /etc/nginx/sites-enabled/default

-   Create a new file /etc/nginx/sites-available/mlab to contain the
    mlab nginx configuration based on the code below. You may want to
    change the server\_name to match a URL that you’re using for the
    site.

server {

    listen 80 default\_server;

    server\_name  localhost {mlab\_url} 127.0.0.1;

    root /{mlab\_code}/web;

    index app.php;

    \#\# First try to serve mlab static files

    location / {

      try\_files $uri $uri/ /app.php?$query\_string;

    }

     \#\# Static files in {mlab\_elements}

    location /mlab\_elements {

      alias /{mlab\_elements};

    }

    \#\# mlab php requestst are passed on to the php5-fpm socket

    location \~ \[^/\]\\.php(/\|$) {

      fastcgi\_split\_path\_info ^(.+\\.php)(/.+)$;

      fastcgi\_pass unix:/var/run/php5-fpm.sock;

      fastcgi\_index index.php;

      include fastcgi\_params;

      fastcgi\_param PATH\_INFO   $fastcgi\_path\_info;

      fastcgi\_param SCRIPT\_FILENAME
$document\_root$fastcgi\_script\_name;

      }

}

-   Create a symlink to the new file to activate it:

sudo ln -s /etc/nginx/sites-available/mlab /etc/nginx/sites-enabled/mlab

-   In addition, in /etc/php5/fpm/php.ini you should set:

cgi.fix\_pathinfo = 0

-   Restart after configuration changes:

sudo service php5-fpm restart

sudo service nginx restart

Nginx should now be configured to serve mlab code from
/var/local/mlab/web and using php5-fpm for .php files. In addition,
uploaded components and templates, and apps in progress will be served
as static content from /var/local/mlab\_elements Packaged components and
templates

#### Alternative 3: Lighttpd configuration

-   Edit config file: /etc/lighttpd/conf-available/10-simple-vhost.conf:

\# /usr/share/doc/lighttpd/simple-vhost.txt

server.modules += ( "mod\_simple\_vhost" )

\#\# The document root of a virtual host is document-root =

\#\#   simple-vhost.server-root + $HTTP\["host"\] +
simple-vhost.document-root

simple-vhost.server-root         = "/home/utvikler/workspace/"

simple-vhost.document-root       = "/"

\#\# the default host if no host is sent

simple-vhost.default-host        = "local.dev"

-   Edit config file: /etc/lighttpd/conf-available/20-mlab-vhost.conf:

\# /usr/share/doc/lighttpd/simple-vhost.txt

server.modules += ( "mod\_accesslog" )

\#\# The document root of a virtual host is document-root =

\#\#   simple-vhost.server-root + $HTTP\["host"\] +
simple-vhost.document-root

$HTTP\["url"\] =\~ "/mlab\_elements/resources($\|/)" {

simple-vhost.document-root = "/"

dir-listing.activate = "enable"

dir-listing.show-readme = "enable"

dir-listing.hide-readme-file = "enable"

} else $HTTP\["host"\] =\~ "mlab.\*" {

simple-vhost.document-root = "/web/"

url.rewrite-if-not-file = ("^/$" =&gt; "app.php",

"^/(?!.+\\.php)\[^\\?\]+(\\?.\*)?" =&gt; "app.php/$1$2",

)

alias.url = ( "/mlab\_elements/" =&gt; "/path\_to\_mlab/mlab\_elements/"
)

accesslog.filename = "/var/log/lighttpd/access-mlab.log"

}

-   Enable the new configuration (this is from Linux command line):

sudo lighttpd-enable-mod simple-vhost

sudo lighttpd-enable-mod mlab-vhost

sudo /etc/init.d/lighttpd force-reload

### Configure MySQL server

-   UTF8 must be set in MySQL. Setting UTF8 defaults for MySQL is as
    simple as adding a few lines to your configuration file (typically
    my.cnf in /etc/mysql/):

sudo nano /{your-path}/{your-file-name}.cnf

-   Enter/add the following settings:

\[mysqld\]

collation-server = utf8\_general\_ci

character-set-server = utf8

### Configure PHP

If you have problems with PHP it could be that it is a higher version
(typically 7.x) is installed. Appyoumake requires version 5.4 or higher, but
lower than 7.0. See this web page for more information on this:
<http://stackoverflow.com/questions/36788873/package-php5-have-no-installation-candidate-ubuntu-16-04>

-   Symfony requires that the option date.timezone is set in your
    php.ini file(s). If you do not know which php.ini you are using you
    can run this command (if you run php-fpm):

php5-fpm --ini

-   OR this if you run PHP as a regular CGI server:

php5-cgi --ini

This will tell you the path to the relevant PHP file.

-   Open the php.ini file using nano or your favorite command line
    > editor and search for the line containing date.timezone. Uncomment
    > the directive by removing the “;” (semicolon) sign at the
    > beginning of the line, and add the appropriate timezone[3] for
    > your application. For example Europe/Oslo.

\[Date\]

; Defines the default timezone used by the date functions

; http://php.net/date.timezone

date.timezone = Europe/Oslo 

If you run the php-fpm version (and not php-cgi) you MUST restart the
hardware server when you do a change! It is not enough to just restart
the web server or PHP software.

### Start mlab web-sockets messaging

-   Appyoumake uses web-sockets to exchange messages between the Appyoumake editing
    tool and the app compilation and app market services. Run the
    following command to start it, this should also be added to the
    computer’s startup routine so it is always available.

cd /var/local/mlab/\_minimal\_websocket npm install npm start

Complete Appyoumake installation 
--------------------------

### Alternative 1: Complete through installation web page

-   The set up should now be ready for running the Appyoumake installation
    script. Open a web browser and go to http://{mlab\_url}/INSTALL,
    replace {mlab\_url} with the URL used for Appyoumake.

### Alternative 2: Complete manually

It is safer to use the installation web page, but if you prefer to do it
manually or you have encountered some problems you can follow the steps
below:

#### Step 1: (Optional) install icons

-   "Install" your own icon set if you want to (Appyoumake includes some basic
    copyright free icons with the default install).

cp -Rf /{mlab\_elements}/icons/. /{mlab\_elements}/icons

#### Step 2: Create the Appyoumake database and user

-   Setup the database with tables and initial data. The database will
    contain different data, users, installed components, templates,
    categories etc. If you do not want to load all templates and
    components manually, you may load a database dump with the basic
    templates and components in it.

mysqladmin -u root -p create mlab

mysql -u root -p -e 'GRANT ALL PRIVILEGES ON mlab.\* TO
'mlab'@'localhost' IDENTIFIED BY 'mlab\_db\_password';FLUSH PRIVILEGES;’

-   If you want an empty database run this command:

mysql -u root -p &lt; /{mlab\_code}/mlab\_empty.sql 

-   If you want a database with basic templates and components run this
    command:

mysql -u root -p &lt; /var/local/mlab/mlab.sql

-   Both databases contain a “super admin” user that has access to all
    aspects of Appyoumake with the credentials "admin@mlab.domain" and
    "mlab\_password". Use this to add your own superuser and delete the
    default one.

-   If you chose the database with the templates and components loaded,
    you will also have to copy the related template and component
    files. 

cp -Rf /{mlab\_code}/mlab\_elements/components/\*
/{mlab\_elements}/components 

cp -Rf /{mlab\_code}/mlab\_elements/templates/\*
/{mlab\_elements}/templates

#### Step 3: Installing Composer

-   Composer is a package manager for PHP. It is used to install the
    Symfony framework that Appyoumake uses on the server side. The following
    commands installs Composer (irrespective of OS used):

cd /{mlab\_code}/bin

sudo curl -sS https://getcomposer.org/installer \| php

sudo chmod composer.phar

#### Step 4: Complete Symfony installation

-   At this stage the composer package manager will be used to install
    the Symfony framework, Symfony libraries and some Javascript
    libraries used by Appyoumake on the front end.

cd /{mlab\_code}/

sudo bin/composer.phar install

-   This creates the parameters.yml file (in app/config) if it does not
    exist, using parameters.yml.dist as a template.

-   Composer install will generate the cache in app/cache. You may need
    to correct permissions on the cache folder after running composer
    install.

-   Check that everything works OK and that versions of tools are
    correct by running this command:

sudo php app/check.php

-   If you get an error regarding "bootstrap.php.cache" (missing, etc),
    usually the case when starting or moving to new version of Symfony,
    run this from root of site:

php ./vendor/sensio/distribution-bundle/Sensio/Bundle \\

/DistributionBundle/Resources/bin/build\_bootstrap.php

See: <http://stackoverflow.com/questions/6072081/symfony2-updating-bootstrap-php-cache>

-   Remove/delete app/.htaccess: 

Sudo rm app/.htaccess 

#### Edit parameters.yml

-   Composer should have given you a parameters.yml in app/config. Edit
    this file according to your setup, pay particular attention to paths
    and login/password details. The database settings must match the
    database you set up using MySQL earlier.

-   Clear the cache, check permissions:

sudo php app/console cache:clear --env=prod

sudo php app/console cache:clear --env=dev

sudo chown {webserveruser}:{webserveruser} {mlab\_code}/app/cache -R

sudo chown {webserveruser}:{webserveruser} {mlab\_code}/app/logs -R

#### Install JavaScript libraries

-   Appyoumake requires a number of jQuery JavaScript libraries. These are
    normally installed when you install the Symfony libraries. If they
    have not been installed you can run the command below to manually
    install them.

cd /{mlab\_code}/

sudo bin/composer.phar run-script post-install-cmd

Support importing PPT/DOC files
-------------------------------

Appyoumake has a small python script that acts as a wrapper around
the unoconv tool that converts PPT and DOC files. Unoconv does this by
using LibreOffice/OpenOffice, one of these needs to be installed.
See <https://github.com/dagwieers/unoconv> for unoconv installation
instructions. To make the wrapper script work you also need the
following:

-   Install python.

-   Install these Python libraries:

<!-- -->

-   argparse, 1.1

-   json, 2.0.9

-   python-magic

-   python-bs4

<!-- -->

-   Test from command line in the directory where the document2HTML.py
    file is installed:

python document2HTML.py -c &lt;path to config&gt; -i &lt;path to
document to be

converted&gt; -o &lt;output directory&gt;

-   In addition, you can use: -t -a &lt;attribute&gt; as a criteria for
    the split (f.ex. id="Title\*").

Compilation Service configuration
=================================

A local configuration file stores the following information:

-   cordova\_bin\_path: Path to Cordova executable used to create,
    build, etc., apps.

-   cordova\_apps\_path: Path to root of Cordova apps data, see  above.

-   cordova\_user: User name to use to run the Cordova executables, used
    on servers where Cordova requires a user home directory.

-   passphrase: unique string to allow access.

-   platform: name of the platform the remaining information relates to.
    Can be one of the following (always lower case): android, ios,
    windows, blackberry or tizen. Further names may be specified later.

-   platform specific info, paths etc.

### **Example configuration file**

{

cordova\_bin\_path: "/opt/cordova/bin/",

cordova\_apps\_path: "/var/mlab\_elements/apps/",

key: "sinett\_is\_cool",

ios: {

sdk\_path: "/opt/ios/sdk/"

},

android: {

sdk\_path: "/opt/android/"

}

}

For additional programming information see:

-   <https://www.openshift.com/blogs/day-27-restify-build-correct-rest-web-services-in-nodejs>

-   <http://blog.smartbear.com/apis/understanding-soap-and-rest-basics/>

-   <http://blog.miguelgrinberg.com/post/writing-a-javascript-rest-client>

-   <http://www.sanwebe.com/2013/05/chat-using-websocket-php-socket>

Conclusion
==========

Appyoumake should now be ready for users to log in and use. It is recommended
that you log in as an administrator first and change the password
details of the default *admin* user. Alternatively you should disable
the default admin user and create a new admin user.

Afte this is done you can create regular users, i.e. app creators who
are the ones who will use Appyoumake to create apps. You should also configure
Appyoumake by setting up user groups and categories and upload or enable
templates and components. Information on how to do this you can find in
the *Appyoumake user guide*.

<span id="_Toc481134646" class="anchor"></span>

Endnotes 
========

[1] <http://www.doctrine-project.org/projects/orm.html>

[2] <https://php-fpm.org/>

[3] <http://php.net/manual/en/timezones.php>
