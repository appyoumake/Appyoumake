Puppet
=======

Puppet may be used to install and manage an installation of the mlab system

Puppet is automation software primarily for server management. Puppet may be used in different distributed setups, but the simples usage with MLAB is to use puppet as standalone.

A desired system-state is defined in the manifest files. When run puppet will attemtp to bring the system to the desired state by installing packages, create folders, set permissions, adjust config files etc.

The current set of manifest files is only tested on Ubuntu 12.04 LTS

Install puppet
-----------------------
To install puppet as standalone on Ubuntu 12.04 LTS

sudo apt-get install puppet-common

Using puppet
-------------------------
First edit the config.pp file in the puppet/manifest directory as desired.

While in the puppet/manifests directory:

For the basic packages to be installed on the server:
puppet apply ./builder.pp

The current versions of manifest files will only do basic installation of packages and some simple configuration:

* Install some usefull tools (emacs, screen, ...)
* Install (L)AMP
* Install oracle-java, ant
* Install the Android SDK
* Install Cordova
* Provide a template virtual server config file for use with apache2 
