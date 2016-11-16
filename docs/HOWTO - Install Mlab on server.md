# Mlab server setup

Before you can use Mlab you need to install the source code on a correctly configured webserver. Mlab is primarily tested on Linux, but there are no inherent Linux features required, so as long as your operating system supports the requirements below you should be able to run it. There are four main steps involved in this:

1.  Install server software such as web server, database server, PHP, etc.
2.  Create a directory (folder) for Mlab and copy the source code into this directory.
3.  Configure the various server software and helper software (where required) to match the Mlab directory location.
4.  Run the Mlab installation script which will verify that the setup is correct and perform certain actions that will complete the setup.
    1.  Alternatively you can manually install Mlab. The steps required are described in this document under the “[Install Mlab manually](#_5:_(Optional)_Install)” section toward the end of the document.

_All examples in this document use a generic Debian/Ubuntu installation, thus all examples refer to apt-get as the package manager. Other Linux distributions may use rpm, yum or other  package managers, modify the commands as required. On Windows there is no package manager. For each software installation you need to download the relevant software package and run the executable installer._

# 1: Install server and helper software

These are the servers that Mlab requires

1.  Web server (Must support integration with PHP. Apache 2.x, Lighttpd and Nginx have all been tested)
2.  Database server (MySQL 5.x has been tested, Mlab should work with any database server supported by the [Doctrine ORM](http://www.doctrine-project.org/projects/orm.html))
3.  PHP (5.4+ or higher, but not version 7.x. PHP should ideally be run using the [FastCGI Process Manager](https://php-fpm.org/) for performance reasons)
    1.  You also need the following PHP extensions installed: ereg, fileinfo, gd, gettext, iconv, intl, json, libxml, mbstring, mhash, mysqli, openssl, pcre, pdo_mysql, phar, readline, session, simplexml, soap, sockets, zip, dom, ereg, fileinfo, gd, gettext, iconv, intl, json, libxml, mbstring, mhash, mysqli, openssl, pcre, pdo_mysql, phar, readline, session, simplexml, soap, sockets, zip, dom, xml, xmlreader, xmlwriter
4.  Node.js (runs a websocket server for communication with remote services)
5.  Npm (helper software, used to install uglify primarily)
6.  UglifyJS (a tool to compress Javascript files, without this you cannot run Mlab) 

**Notes on how to configure the servers are given in [step 3](#_3:_Configuration).**

## 1.1: Install web server

Choose which web server you want to use. Apache is often preinstalled on Linux, if so you can skip this step. To install on Linux use your package manager and install the relevant package. For Windows refer to these notes for Apache: [https://httpd.apache.org/docs/current/platform/windows.html](https://httpd.apache.org/docs/current/platform/windows.html) or these notes for nginx: [http://nginx.org/en/docs/windows.html](http://nginx.org/en/docs/windows.html). Lighttpd is not available in an updated version for Windows.

### Alternative 1: Install Apache

Run the following commands:

<pre>apt-get install apache2</pre>

<pre>service apache2 start</pre>

Relevant link: [http://httpd.apache.org/docs/current/install.html](http://httpd.apache.org/docs/current/install.html)

### Alternative 2: Install Nginx

Apache2 may be installed by default, if so you need to remove it.

<pre>service apache2 stop</pre>

<pre>update-rc.d -f apache2 remove</pre>

<pre>apt-get remove apache2</pre>

Then install nginx using these commands:

<pre>sudo apt-get install nginx</pre>

<pre>sudo service nginx start</pre>

Relevant link: [https://www.howtoforge.com/installing-nginx-with-php5-fpm-and-mysql-on-ubuntu-14.04-lts-lemp](https://www.howtoforge.com/installing-nginx-with-php5-fpm-and-mysql-on-ubuntu-14.04-lts-lemp)

### Alternative 3: Install Lighttpd

<pre>apt-get install lighttpd</pre>

<pre>service lighttpd start</pre>

Relevant link: [http://redmine.lighttpd.net/projects/lighttpd/wiki](http://redmine.lighttpd.net/projects/lighttpd/wiki)

## 1.1.1: Check that web server works

Point your browser to localhost to test that it's working, you should see a basic welcome page.

## 1.2 Install php5 and php5-fpm

Install core php5, including php5-fpm that runs a FastCGI server on the socket /var/run/php5-fpm.sock.

<pre>sudo apt-get install php5-common php5-cli php5-fpm</pre>

Next you need to install required PHP extensions. Depending on your version of PHP, some of these may already be installed as part of the above core PHP installation. Below is a common command to add missing extensions. The Mlab installation script will check if any of these are missing later.

<pre>sudo apt-get install php5-gd, php5-intl, php5-json, php5-mcrypt, php5-mysql, php5-readline, php-gettext, php-pear, php-xml-dtd, php-xml-htmlsax3, php-xml-parser, php-xml-rpc, php-xml-rpc2, php-xml-rss, php-xml-serializer</pre>

## 1.3 Install MySQL

If mysql is not installed you need to run the following commands:

<pre>apt-get install mysql-server mysql-client </pre>

You will be asked to set the password for the root user, make a note of this for later.

## 1.4 Install NodeJS, npm and uglifyjs

If NodeJS or npm is not installed you need to run the following commands:

<pre>apt-get install nodejs npm</pre>

After npm is installed you can use npm to insyall uglifyjs:

<pre>npm install uglifyjs -g</pre>

The “-g” parameter is important, without this uglifyjs will be installed in the current directory, it needs to be installed “globally” so it can be used by Mlab later.

# 2: Create directory and copy Mlab source code

After installing the servers and helper software in step 1, you need to copy over the Mlab source code.

*   First create a new directory in a suitable location for your OS/Web server. On Linux this is often /var/www, but refer to your OS information where is the best location for this. Below we will use {mlab_code} for this folder. You will also need to create another folder for the elements that make up an app and the apps themselves (apps, components, icons and templates), below we will use {mlab_elements} for these directories. Create the following directories:

<pre>sudo mkdir {mlab_code}</pre>

<pre>sudo mkdir {mlab_elements}</pre>

<pre>sudo mkdir {mlab_elements}/apps/</pre>

<pre>sudo mkdir {mlab_elements}/components/</pre>

<pre>sudo mkdir {mlab_elements}/templates/</pre>

<pre>sudo mkdir {mlab_elements}/icons/</pre>

*   Next get your Mlab zip file, typically named something like mlab-v.0.9.0.zip (the actual filename will vary depending on the version you install) . Unzip it inside the new directory.
    *   Make sure that the Mlab code is inside the root of the directory. If the unzip process has created a sub-directory inside the directory you must copy the files from the sub-directory and into the directory.
*   Then if you using the Mlab installation scrip (see below), set the right permissions to the directory you created. The owner of the Mlab directory and all files and directories inside the Mlab directory should be the web server process/user. This is because Mlab will need to create files as users create apps or uploads new components, etc.

Below the actual user name is indicated with _{webserveruser}_, you will need to replace this with the actual user name of your web server process user.

<pre>sudo chown {webserveruser}:{webserveruser} {mlab_code} -R</pre>

<pre>sudo chown {webserveruser}:{webserveruser} .{mlab_elements} -R</pre>

# <a name="_3:_Configuration"></a>3: Server configuration

The server software installed in step 1\. needs some additional configurations to be able to work with Mlab. Below you will find detailed instructions and examples for each of these servers. Replace {mlab_url} with the relevant URL for your server.

## Configure Web servers

### Alternative 1: Apache configuration

To run Mlab as a virtual host Apache needs the setup outlined below. The actual file to enter this information into varies, under Linux this is often in the /etc/apache2/sites-available/ directory, you can use a file named 020-mlab.conf to store the configuration.

*   Using _nano_ as your text editor, enter the following command (substitute _nano_ below with your preferred text editor).

<pre>sudo nano /etc/apache2/sites-available/020-mlab.conf</pre>

*   In the empty file enter the following configuration:

<pre><VirtualHost *:80>  ServerName {mlab_url}  ServerAdmin webmaster@localhost  AliasMatch /mlab_elements/components/(.*) /{mlab_elements}/components/$1  AliasMatch /mlab_elements/apps/(.*) /{mlab_elements}/apps/$1  AliasMatch /mlab_elements/templates/(.*) /{mlab_elements}/templates/$1  AliasMatch /mlab_elements/icons/(.*) /{mlab_elements}/icons/$1  <Directory /{mlab_elements}/>      Options Indexes FollowSymLinks MultiViews      AllowOverride All      Order allow,deny      allow from all      Require all granted  </Directory>  DocumentRoot /{mlab_code}/web  <Directory /{mlab_code}/web/>      Options Indexes FollowSymLinks MultiViews      AllowOverride None      Order allow,deny      allow from all      Require all granted      <IfModule mod_rewrite.c>          RewriteEngine On          RewriteCond %{REQUEST_FILENAME} !-f          RewriteRule ^(.*)$ /app.php [QSA,L]      </IfModule>  </Directory>  ErrorLog ${APACHE_LOG_DIR}/error.log   CustomLog ${APACHE_LOG_DIR}/access.log combined  </VirtualHost></pre>

*   If your system supports the APACHE_LOG_DIR variable, you can use${APACHE_LOG_DIR}/, otherwise you will need to enter the full path, for instance /var/log/apache2/.
*   If you made the config file in the sites-available folder. You need to make a link to it in the sites-enabled folder. The sites-enabled manages which of your virtual hosts will actually be booted into Apache when it starts up. This can for example be useful when you want to maintain virtual-host configuration files, but don't want the sites to be live, or are in a deployment process. Link your newly created file:

<pre>sudo ln -s /{your-path}/apache2/sites-available/020-mlab.conf /{your-path}/apache2/sites-enabled/020-mlab.conf </pre>

*   Restart Apache to make the changes take effect

<pre>sudo service apache2 restart</pre>

### Alternative 2: Nginx configuration

*   Disable the default vhost by removing the symbolic link in /etc/nginx/sites-available/default:

<pre>sudo rm /etc/nginx/sites-enabled/default</pre>

*   Create a new file /etc/nginx/sites-available/mlab to contain the mlab nginx configuration based on the code below. You may want to change the server_name to match a URL that you’re using for the site.

<pre>server {</pre>

<pre>    listen  80 default_server;</pre>

<pre>    server_name  localhost  {mlab_url} 127.0.0.1;</pre>

<pre>    root /{mlab_code}/web;</pre>

<pre>    index app.php;</pre>

<pre>    ##  First try to serve mlab static files</pre>

<pre>     location / {</pre>

<pre>      try_files $uri $uri/ /app.php?$query_string;</pre>

<pre>    }</pre>

<pre>     ##  Static files in {mlab_elements}</pre>

<pre>     location /mlab_elements {</pre>

<pre>       alias /{mlab_elements};</pre>

<pre>    }</pre>

<pre>    ## mlab php requestst  are passed on to the php5-fpm socket </pre>

<pre>     location ~ [^/]\.php(/|$) {</pre>

<pre>      fastcgi_split_path_info ^(.+\.php)(/.+)$;</pre>

<pre>      fastcgi_pass unix:/var/run/php5-fpm.sock;</pre>

<pre>      fastcgi_index index.php;</pre>

<pre>       include fastcgi_params;</pre>

<pre>      fastcgi_param PATH_INFO    $fastcgi_path_info;</pre>

<pre>      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;</pre>

<pre>      }</pre>

<pre>}</pre>

*   Create a symlink to the new file to activate it

<pre>sudo ln -s /etc/nginx/sites-available/mlab /etc/nginx/sites-enabled/mlab</pre>

*   In addition, you should set in /etc/php5/fpm/php.ini cgi.fix_pathinfo = 0
*   Restart after configuration changes:

<pre>sudo service php5-fpm restart </pre>

<pre>sudo service nginx restart</pre>

Nginx should now be configured to serve mlab code from /var/local/mlab/web and using php5-fpm for .php files. In addition, uploaded components and templates, and apps in progress will be served as static content from /var/local/mlab_elements Packaged components and templates

### Alternative 3: Lighttpd configuration

*   Edit config file: /etc/lighttpd/conf-available/10-simple-vhost.conf

<pre># /usr/share/doc/lighttpd/simple-vhost.txt</pre>

<pre>server.modules += ( "mod_simple_vhost" )</pre>

<pre>## The document root of a virtual host is  document-root =</pre>

<pre>##   simple-vhost.server-root  + $HTTP["host"] + simple-vhost.document-root</pre>

<pre>simple-vhost.server-root          = "/home/utvikler/workspace/"</pre>

<pre>simple-vhost.document-root        = "/"</pre>

<pre>## the default host if no host is sent</pre>

<pre>simple-vhost.default-host         = "local.dev"</pre>

*   Edit config file: /etc/lighttpd/conf-available/20-mlab-vhost.conf

<pre># /usr/share/doc/lighttpd/simple-vhost.txt</pre>

<pre>server.modules += ( "mod_accesslog" )</pre>

<pre>## The document root of a virtual host is  document-root =</pre>

<pre>##   simple-vhost.server-root  + $HTTP["host"] + simple-vhost.document-root</pre>

<pre>$HTTP["url"]  =~ "/mlab_elements/resources($|/)" {</pre>

<pre>simple-vhost.document-root  = "/"</pre>

<pre>dir-listing.activate = "enable"</pre>

<pre>dir-listing.show-readme = "enable"</pre>

<pre>dir-listing.hide-readme-file =  "enable"</pre>

<pre>} else $HTTP["host"] =~ "mlab.*" {</pre>

<pre>simple-vhost.document-root  = "/web/"</pre>

<pre>url.rewrite-if-not-file = ("^/$" => "app.php",</pre>

<pre>"^/(?!.+\.php)[^\?]+(\?.*)?"  => "app.php/$1$2",</pre>

<pre>)</pre>

<pre>alias.url = ( "/mlab_elements/"  => "/path_to_mlab/mlab_elements/"  )</pre>

<pre>accesslog.filename = "/var/log/lighttpd/access-mlab.log"</pre>

<pre>}</pre>

*   Enable the new configuration (this is from Linux command line):

<pre>sudo lighttpd-enable-mod simple-vhost</pre>

<pre>sudo lighttpd-enable-mod mlab-vhost</pre>

<pre>sudo /etc/init.d/lighttpd force-reload</pre>

## Configure MySQL server

*   UTF8 must be set in MySQL. Setting UTF8 defaults for MySQL is as simple as adding a few lines to your configuration file (typically my.cnf in /etc/mysql/):

<pre>sudo nano /{your-path}/{your-file-name}.cnf</pre>

*   Enter/add the following settings:

<pre>[mysqld]</pre>

<pre>collation-server = utf8_general_ci</pre>

<pre>character-set-server = utf8</pre>

## PHP

*   If you have problems with PHP it could be that it is a higher version (typically 7.x) is installed. Mlab requires version 5.4 or higher, but lower than 7.0\. See this for help: [http://stackoverflow.com/questions/36788873/package-php5-have-no-installation-candidate-ubuntu-16-04](http://stackoverflow.com/questions/36788873/package-php5-have-no-installation-candidate-ubuntu-16-04)
*   Symfony requires that the option date.timezone is set in your php.ini file(s). If you do not know which php.ini you are using you can run this command (if you run php-fpm):

<pre>php5-fpm --ini </pre>

OR this if you run PHP as a regular CGI server:

<pre>php5-cgi --ini</pre>

This will tell you the path to the relevant PHP file, open the php.ini file using nano or your favorite command line editor and search for the line containing date.timezone. Uncomment the directive by removing the ; sign in the beginning of the line, and add the [appropriate timezone](http://php.net/manual/en/timezones.php) for your application. For example Europe/Oslo.

<pre>[Date]</pre>

<pre>; Defines the default timezone  used by the date functions</pre>

<pre>; http://php.net/date.timezone</pre>

<pre>date.timezone = Europe/Oslo </pre>

<pre>If you run the php-fpm  version (and not php-cgi) you MUST restart the  hardware server when you do a change! It is not enough to just restart the web  server or PHP software.</pre>

## Start mlab web-sockets messaging

*   Mlab uses web-sockets to exchange messages between the Mlab editing tool and the app compilation and app market services. Run the following command to start it, this should also be added to the computer’s startup routine so it is always available.

<pre>cd /var/local/mlab/_minimal_websocket npm install npm start</pre>

# 4\. Complete Mlab installation

## 4.1 Alternative 1: Complete through installation web page

*   The set up should now be ready for running the Mlab installation script. Open a web browser and go to [http://{mlab_url}/INSTALL/index.php](http://%7bmlab_url%7d/INSTALL/index.php), replace {mlab_url} with the URL used for Mlab.

## <a name="_5:_(Optional)_Install"></a>4.2: (Alternative 2) Complete manually

It is safer to use the installation web page, but if you prefer to do it manually or you have encountered some problems you can follow the steps below.

### (Optional) install icons

*   "Install" your own icon set if you want to (Mlab includes some basic copyright free icons with the default install).

<pre>cp -Rf /{mlab_elements}/icons/.  /{mlab_elements}/icons</pre>

### Create the Mlab database and user

<pre>mysqladmin -u root -p create mlab</pre>

<pre>mysql -u root -p -e 'GRANT ALL PRIVILEGES ON mlab.* TO 'mlab'@'localhost' IDENTIFIED BY 'mlab_db_password';FLUSH  PRIVILEGES;’</pre>

*   Setup the database with tables and initial data
    The database will contain different data, users, installed components, templates, categories etc.. If you do not want to load all templates and components manually, you may load a database dump with the basic templates and components in it
*   If you want an empty database run this command

<pre>mysql -u root -p < /{mlab_code}/mlab_empty.sql </pre>

*   If you want a database with basic templates and components run this command

<pre>mysql -u root -p < /var/local/mlab/mlab.sql</pre>

*   Both databases contains a superuser with credentials "[admin@mlab.domain](mailto:admin@mlab.domain)" and "mlab_password". Use this to add your own admin and delete the default one.
*   If you chose the database with the templates and components loaded, you will also have to copy the related template and component files. 

<pre>cp -Rf /{mlab_code}/mlab_elements/components/* /{mlab_elements}/components </pre>

<pre>cp -Rf /{mlab_code}/mlab_elements/templates/* /{mlab_elements}/templates</pre>

### Installing Composer

*   Composer is a package manager for PHP. It is used to install the Symfony framework that Mlab uses on the server side. The following commands installs Composer (irrespective of OS used):

<pre>cd /{mlab_code}/bin</pre>

<pre>sudo curl -sS https://getcomposer.org/installer  | php</pre>

<pre>sudo chmod composer.phar</pre>

### Complete Symfony installation

*   At this stage the composer package manager will be used to install the Symfony framework, Symfony libraries and some Javascript libraries used by Mlab on the front end.

<pre>cd /{mlab_code}/</pre>

<pre>sudo bin/composer.phar install</pre>

*   This creates the parameters.yml file (in app/config) if it does not exist, using parameters.yml.dist as a template.
*   Composer install will generate the cache in app/cache. You may need to correct permissions on the cache folder after running composer install
*   Check that everything works OK and that versions of tools are correct by running this command

<pre>Sudo php app/check.php</pre>

*   If you get an error regarding "bootstrap.php.cache" (missing, etc), usually the case when starting or moving to new version of Symfony, run this from root of site:

<pre>php ./vendor/sensio/distribution-bundle/Sensio/Bundle/DistributionBundle/Resources/bin/build_bootstrap.php  </pre>

See: [http://stackoverflow.com/questions/6072081/symfony2-updating-bootstrap-php-cache](http://stackoverflow.com/questions/6072081/symfony2-updating-bootstrap-php-cache)

*   Remove/delete app/.htaccess 

<pre>Sudo rm app/.htaccess </pre>

### Edit parameters.yml

*   Composer should have given you a parameters.yml in app/config. Edit this file according to your setup, pay particular attention to paths and login/password details. The database settings must match the database you set up using MySQL earlier.
*   Clear the cache, check permissions

<pre>sudo php app/console cache:clear --env=prod</pre>

<pre>sudo php app/console cache:clear --env=dev</pre>

<pre>sudo chown {webserveruser}:{webserveruser} {mlab_code}/app/cache -R</pre>

<pre>sudo chown {webserveruser}:{webserveruser} {mlab_code}/app/logs -R</pre>

### Install JavaScript libraries

*   Mlab requires a number of jQuery JavaScript libraries. These are normally installed when you install the Symfony libraries. If they have not been installed yu can run the command below to manually install them.

<pre>cd /{mlab_code}/</pre>

<pre>sudo bin/composer.phar run-script post-install-cmd </pre>
