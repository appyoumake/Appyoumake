#Information pertaining to working with/editing the core Mlab app editor/admin code

#####THIS DOCUMENT IS NOT COMPLETED AS OF 14 APRIL 2016

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Arild Bergh, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_[HOWTO - Install Mlab on server.md](HOWTO - Install Mlab on server.md) provides additional information that can be useful when editing the Mlab code_

##MLAB Symfony for devs

* See [MLAB Symfony for sysadmins ](https://docs.google.com/a/bergh.fm/document/d/13Z5MFbvLOMAuSL81ng1-6XE82oEsGu0_6oi2OcsdQGg/edit)to get this running on a server.

* Then check out the code from Github

## Tools used

* MLAB is wrtten in the Symfony framework, see here for documentation: [http://symfony.com/doc/current/quick_tour/the_big_picture.html](http://symfony.com/doc/current/quick_tour/the_big_picture.html)

* It has used the admin generator tool to create the skeleton app: [http://symfony.com/blog/symfony2-getting-easier-interactive-generators](http://symfony.com/blog/symfony2-getting-easier-interactive-generators)

* You need to install Composer to download additional tools and/or update them. This is a tool to manage libraries and modules/bundles in PHP. In the example here composer is installed in /my/path/workspace and mlab is installed in */my/path/workspace/mlab-symfony*. See [http://getcomposer.org/download/](http://getcomposer.org/download/)

* To install new libraries/bundles you do:

*php ../composer.phar require name_of_developer/name_of_bundle:version_number*

* To update existing bundles you use *php ../composer.phar update*

* Additional tools/libraries used:

    * FOSUserBundle for authentication: [https://github.com/Maks3w/FR3DLdapBundle/blob/master/Resources/doc/index.md](https://github.com/Maks3w/FR3DLdapBundle/blob/master/Resources/doc/index.md)

    * Gedmo for date and tree database management: [https://github.com/l3pp4rd/DoctrineExtensions](https://github.com/l3pp4rd/DoctrineExtensions)

# Gotchas & tips relating to Symfony

* For working on design/templates see here: [http://symfony.com/doc/current/book/templating.html](http://symfony.com/doc/current/book/templating.html) 

* In Twig (the templating language used for Symfony) templates inherit from a base template, unlike many other templating languages where a master template includes other templates. This means that a section can have a default content and only be overridden in some templates.

* To keep the old content of the block and add your own use this code in sub-template: {{ parent() }}

* Translations are in /src/Sinett/MLAB/BuilderBundle/Resources/translations/messages.en_GB.yml

* To tranlate something do this in template: *{% trans %}my string{% endtrans %}*

* Never use "hard coded" URLs for paths in templates, Twig has a function called url that you pass the route to to get a proper url relative to current installation: *{{ url('app')}}*

* There are different config files for different runtime environments: config.yml goes to all environments, config_xxx.yml (where xxx = environment, for instance dev or prod) adds (or overwrites if same name) the settings in config.yml.

* Clearing cache: Sometime you may need to manually clear the cache (**especially if not running the development environment!**). Under Linux (and maybe Windows) there may be a different user for the web server and the developer. If so, use these commands from isnide the mlab directory:

    * *sudo /opt/lampp/bin/php app/console cache:clear [--env=prod]*

    * *sudo chown nobody:nogroup /path/to/mlab/app/cache -R *
(where nobody:nogroup = user and group for the web server)

    * *sudo chmod 777 /path/to/mlab/app/cache -R *

    * *sudo chown nobody:nogroup /path/to/mlab/app/logs -R *

    * *sudo chmod 777 /path/to/mlab/app/logs -R *

**-----**

To load files such as images and stylesheets correctly for Cordova apps we change the base path: *document.getElementsByTagName("base")[0].href = start_dir;*

----

How to code for the MLAB editor

We use an object called Mlab for all JS component interaction. It has the following hierarchy (within each level *this* is set to refer to that hierarchy):

mlab = core object, if there are properties here that are not prefixed with dt, then it is for runtime

.dt = all code/variables for design time. Also stores variables such as "dirty" flag setting, the counter for how many saves have been attempted, etc

.dt.api = api functions useful at design time

.dt.app = properties of the app (everything from complete HTML to current page number)

.dt.components = array of component objects, each object contain information from the conf.yml, content.html, code.js files that make up a component.

.dt.design = functions to design page, such as moving components around

.dt.management = functions to 

.api = code that is available for components to use at runtime

.properties = array of properties required at runtime, such as app name


## Apps: names and versions (and the market too)

Apps have a global unique id (GUID) that is a v4 UUID string, with the letter X replacing the common hyphen. This is because hyphens are not allowed by Android for APP IDs, whereas underscores are not allowed by iOS!

* Example: fe8b2033-b4df-4f02-8962-418afd8ee4f9 becomes fe8b2033Xb4dfX4f02X8962X418afd8ee4f9

* This GUID never changes!  

* This GUID applies to all versions of an app until the user elects to start a new branch of the app (see below)

Apps can have multiple versions, however only one version can be "active" at a time. A new branch of an app can be started, this will start with a version number that is the last version number + 1 rounded to the nearest round number. 

* Let's say we have an app called Pear, with versions 1, 1.1, 1.5, 2.0, 2.9

* Starting a new branch will create an app called Pear with version 3.0

* In this example Pear, versions 1, 1.1, 1.5, 2.0, 2.9, will share a GUID (for example fe8b2033Xb4dfX4f02X8962X418afd8ee4f9) whereas Pear 3.0 (and other versions of this can be eed35763Xd8d6X4242X9a1fXe7a2a3dd9946

* A new version number has to be larger than the previous version number, but if a new branch is created it can never go to that number

The user can select which version is active from the list of apps. 

* All actions, such as compile, copy app, create new version, etc., will use the active version as the base. So if Pear version 2.9 ends up with a lot of incorrect information, or pages are deleted by mistake, etc, etc, the user can set 2.0 as the active version, create a new version which will be 2.10 and start again. 2.10 will then become the active version.

When a user creates a new app it has to have a different name than existing apps. 

* If they create a new version or a new branch it will use the same name.

A user can rename an app. If more than one version/branch exists they will be asked if they want to apply the new name to all app versions, or just to the active version.

* If they want to apply to all versions (or only one version exists) the name is updated in the database, no other changes are done on the editor end, however when next compiled the config.xml file on the compiler server must be updated. ([https://cordova.apache.org/docs/en/5.0.0/config_ref_index.md.html](https://cordova.apache.org/docs/en/5.0.0/config_ref_index.md.html))

* If they want to apply it only to the current version then this will be given a new GUID and copied to a new location and a new database record will be created. No matter what has happened before, this will count as an uncompiled and unreleased app.

* If a new app is created as per the previous point, then the previous version will be made the active version, it is up to the user to change this if required.

* This should avoid the issue of apps being orphaned through name changes.

## Tips and tricks

 * When fix issues in compiler service and app market service, make sure empty regular (non debug) cache when change parameters in parameter.yml (or change references to it) as this is not updated when not runing in debug mode
