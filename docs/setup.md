Setup and running MLAB
======================


Setup on Ubuntu 14.04 LTS
-----------------------------

MLAB runs both php and nodejs on the server side

Nginx, php-fpm, mysql, and nodejs


Setup of Mlab includes at least...

* Installing a web server with php, we use nginx with php5-fpm
* Installing mysql
* Installing nodejs
* Cloning the git repository
* Div setup and configuration
* I not on its own server, setup MLAB compiler service

### Install tools
git-core
VMWareTools (optional)


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

Create a new file /etc/nginx/sites-available/mlab to contain the mlab nginx configuration 


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
      root /var/local/mlab_elements;
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

Restart after configuration changes:

```
sudo service php5-fpm restart 
sudo service nginx restart
```


### Install mysql and phpmyadmin

#### Mysql
If mysql is not installed

```apt-get install mysql-server mysql-client```

You will be asked to set the password for the root user.


```
mysqladmin -u root -p create mlab
```

```
mysql -u root -p
```

```sql
GRANT ALL PRIVILEGES ON mlab.* TO 'mlab'@'localhost' IDENTIFIED BY 'mlab_db_password';
FLUSH PRIVILEGES;
quit;
```

Setup the mlab database with the mlab.sql script: 

```mysql -u root -p < /var/local/mlab/mlab.sql```



#### phpmyadmin (optional)
Installing phpmyadmin is optional

```apt-get install phpmyadmin```

FIX! No auto config

dbconfig-common

passwords

FIX! Create phpmyadmin nxinx vhost file or add to the mlab vhost file or dyn-link to /usr/share/phpmyadmin from mlab/web folder

phpMyAdmin relies on the mcrypt PHP module. Enable it and restart php5-fpm:
```
sudo php5enmod mcrypt
sudo service php5-fpm restart
```

### Create folders and get the MLAB code

#### Folders and permissions

We will install MLAB in `/var/local/`. The MLAB code goes into the `mlab` directory while `mlab_elements` is kept for MLAB's data (apps, uploaded components and templates). Create the directories

```
mkdir /var/local/mlab
mkdir /var/local/mlab_elements
mkdir /var/local/mlab_elements/apps/
mkdir /var/local/mlab_elements/components/
mkdir /var/local/mlab_elements/templates/
```
Set owner and group for the mlab_elements folders and the mlab/web folder:
```
chown -R www-data:www-data /var/local/mlab_elements
chown www-data:www-data /var/local/mlab/web
```

#### Clone repository from git

Replacing `git_username` do:

```git clone https://git_username@github.com/Sinettlab/MLAB.git /var/local/mlab```


### Configure MLAB

`composer install` creates the `parameters.yml` if it does not exist, using `parameters.yml.dist` as a template. Every `composer install` will look for new keys in `parameters.yml.dist` and add them to `parameters.yml`
  
(Use `--no-interaction` to silently use default values for new keys.)

FIX! permisions on the app/cache folders

FIX! Permissions on cache folder:
```chmod -R 777 app/cache```

FIX! Permissions on the logs folder:
```chmod -R 777 app/logs```

FIX! edit parameters.yml:

database
set path


 
## Updating MLAB


Do git updates with `git pull https://github.com/Sinettlab/MLAB.git`


Update dependencies and add new keys to parameters.yml
```
cd /var/local/mlab
composer install
```
installs dependencies from the lock file `composer.lock`


Make resources folders, set permissions

Make new component zip-files and copy to resoruces:
```
cd /var/local/mlab/mlab_elements/components
for i in */;do cd "$i"; zip -FSr "../${i%/}.zip" *;cd ..;done
cp *.zip /var/local/mlab/web/resources/
```
Repeat for templates


FIX! Clear the cache, check permissions

```php app/console cache:clear --env=prod ```
```php app/console cache:clear --env=dev ```

FIX? Restart or reload config for nginx
 
