Setup and running MLAB
======================


Setup on Ubuntu 14.04 LTS
-----------------------------

MLAB runs both php and nodejs on the server side

Nginx, php-fpm, mysql, and nodejs


Setup of Mlab includes at least...

* Installing a web server with php, we use nginx in combination with php5-fpm
* Installing mysql
* Installing nodejs
* Cloning the git repository
* Div setup and configuration
* If not on its own server, setup MLAB compiler service

### Install tools
* git-core
* VMWareTools (optional)
* zip (optional)

### Create folders and get the MLAB code

#### Folders

We will install MLAB in `/var/local/`. The MLAB code goes into the `mlab` directory while `mlab_elements` is kept for MLAB's data (apps, uploaded components and templates). Create the directories

```
sudo mkdir /var/local/mlab
sudo mkdir /var/local/mlab_elements
sudo mkdir /var/local/mlab_elements/apps/
sudo mkdir /var/local/mlab_elements/components/
sudo mkdir /var/local/mlab_elements/templates/
sudo mkdir /var/local/mlab_elements/icons/
```

We will set the permissions later

#### Clone repository from git

Replacing `git_username` do:

```git clone https://git_username@github.com/Sinettlab/MLAB.git /var/local/mlab```


### Install nginx and php

From from http://askubuntu.com/questions/134666/what-is-the-easiest-way-to-enable-php-on-nginx and https://www.howtoforge.com/installing-nginx-with-php5-fpm-and-mysql-on-ubuntu-14.04-lts-lemp
#### Uninstall Apache2
Apache2 may be installed by default. Remove it.
```
service apache2 stop
update-rc.d -f apache2 remove
apt-get remove apache2
```

#### Install php5 and php5-fpm

```
sudo apt-get install php5-common php5-cli php5-fpm
```
Installs php5 stuff including php5-fpm that runs a FastCGI server on the socket /var/run/php5-fpm.sock.


### Installing Composer
Composer is a package manager for PHP. It is used by Symfony. The following installs Composer globally:

```
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### Install nginx
Install nginx:
```
sudo apt-get install nginx
```

Start nginx:

```sudo service nginx start```

Point your browser to localhost to test that it's working (You should see "Welcome to nginx!")


```sudo service nginx stop```

#### Mlab nginx configuration

Disable the default vhost by removing the symbolic link in `/etc/nginx/sites-available/default`

```sudo rm /etc/nginx/sites-enabled/default```

Nginx should now be configured to serve mlab code from `/var/local/mlab/web` and using php5-fpm for .php files.
In addition, uploaded components and templates, and apps in progress will be served as static content from `/var/local/mlab_elements`
Packaged components and templates 

Create a new file /etc/nginx/sites-available/mlab to contain the mlab nginx configuration based on the code below. You may want to change the `server_name` 


```nginx

server {
    listen 80 default_server;
    server_name		localhost mlab 127.0.0.1;
    
    root /var/local/mlab/web;
    
    index app.php;
 
    
    ## First try to serve mlab static files
    location / {
      try_files $uri $uri/ /app.php;
    }

    ## Static files in mlab_elements
    location /mlab_elements {
      alias /var/local/mlab_elements;
    }


    ## mlab php requestst are passed on to the php5-fpm socket 
    location ~ [^/]\.php(/|$) {
      fastcgi_split_path_info ^(.+\.php)(/.+)$;
      fastcgi_pass unix:/var/run/php5-fpm.sock;
      fastcgi_index index.php;
      include fastcgi_params;
      fastcgi_param	PATH_INFO	$fastcgi_path_info;
      fastcgi_param	SCRIPT_FILENAME	$document_root$fastcgi_script_name;
      }
}
```

Create symlink to file to activate it
```sudo ln -s /etc/nginx/sites-available/mlab /etc/nginx/sites-enabled/mlab```

In addition, you should set in `/etc/php5/fpm/php.ini`
```cgi.fix_pathinfo = 0```
FIX! This will not work if you want to use the development environment and app_dev.php. 


Restart after configuration changes:
```
sudo service php5-fpm restart 
sudo service nginx restart
```
You should now be able to see the MLAB welcome page.

### Install mysql and phpmyadmin

#### Mysql
If mysql and php5-mysql is not installed

```apt-get install mysql-server mysql-client php5-mysql```

You will be asked to set the password for the root user.


Create the mlab database
```
mysqladmin -u root -p create mlab
```

```
mysql -u root -p
```

and create the mlab database user
```sql
GRANT ALL PRIVILEGES ON mlab.* TO 'mlab'@'localhost' IDENTIFIED BY 'mlab_db_password';
FLUSH PRIVILEGES;
quit;
```

Setup the database with tables and initial data: 
The database will contain different data, users, installed components, templates, categories etc.. If you do not want to load all templates and components manually, you may load a database dump with the basic templates and components in it

If you want an empty databse do:
```mysql -u root -p < /var/local/mlab/mlab_empty.sql```
else if you want a database with basic templates and components:
```mysql -u root -p < /var/local/mlab/mlab.sql```

Both databses contains a superuser with credentials "admin@ffi.no" and "password". Use this to add your own admin and delete the default one.


If you chose the database with the templates and components loaded, you will also have to copy the related template and component files.
```cp -Rf /var/local/mlab/mlab_elements/components/. /var/local/mlab_elements/components```
```cp -Rf /var/local/mlab/mlab_elements/templates/. /var/local/mlab_elements/templates```

## Configure MLAB

### Set permissions

Nginx should run as 'www-data' (default), so we need to set owner and group for the folders nginx will be using:
```
sudo chown -R www-data:www-data /var/local/mlab_elements
sudo chown www-data:www-data /var/local/mlab/web
```
In addition we will let the www-data be the group for the cache and logs folders. Give write access to the group:  

```
sudo chgrp www-data /var/local/mlab/app/cache
sudo chgrp www-data /var/local/mlab/app/logs
sudo chmod g+w app/logs
```
FIX! Do not work that well if one has to manually clear the cache or run composer install/update. `chmod 777` is less trouble...

## Composer

```cd /var/local/mlab```
and 
`composer install` 

This creates the `parameters.yml` (in `app/config`) if it does not exist, using `parameters.yml.dist` as a template. Every `composer install` will look for new keys in `parameters.yml.dist` and add them to `parameters.yml`
  
(Use `--no-interaction` to silently use default values for new keys.)

`composer install` will generate the cache in `app/cache`. You may need to correct permissions on the cache folder after running `composer install`

### The icons
"Install" the icons by copying them to`/var/local/mlab_elements/icons`. You may also use your own icon set.

```cp -Rf /var/local/mlab/mlab_elements/icons/. /var/local/mlab_elements/icons```

### Edit `parameters.yml`

Composer should have given you a parameters.yml in `app/config`. Edit this file according to your setup.

The database:
```
database_name: mlab
database_user: mlab
database_password: mlab_db_password
```

The paths in mlab:paths:{app,component,template,icon}

The config for the compiler

### mlab web-sockets messaging

Install node.js and npm if it is not installed. Then

``` cd /var/local/mlab/_minimal_websocket ```
``` npm install ```
``` npm start ```

FIX! This mini-server should start on power up. Run it as a service.

Go start the compiler service and you are good to go!

## Testing you MLAB installation

There are some selenium test in the `test/selenium` folder. Use these to quickly test your installation.
 
## Updating MLAB

Do git updates with `git pull https://github.com/Sinettlab/MLAB.git`


Update dependencies and add new keys to parameters.yml
```
cd /var/local/mlab
composer install
```
installs dependencies from the lock file `composer.lock` and resets the dev cache.


Make resources folders for the zip files, set permissions

Make new component zip-files and copy to resoruces:
```
cd /var/local/mlab/mlab_elements/components
for i in */;do cd "$i"; zip -FSr "../${i%/}.zip" *;cd ..;done
cp *.zip /var/local/mlab/web/resources/
```
Repeat for templates


Clear the cache, check permissions

```php app/console cache:clear --env=prod ```
```php app/console cache:clear --env=dev ```

Restart or reload config for nginx: `service nginx restart`

 