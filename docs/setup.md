Setup
======================

Setup of MALB includes at least...

* Install a web server with php, we use lighttpd with php-fmp
* Install mysql
* Install oracle-java, ant
* Install the Android SDK
* Install Cordova
* Clone the git repository
* Setup and configuration
  
### The parameters.yml ###




### The environment ###

Add android to /etc/environment (tools and platform tools)



### The www-data user ###

Create a home directory for the mlab server to user (www-data). 

	sudo usermod -d /home/www-data www-data

Cordova (and the android SDK) will use the home directory for downloaded libraries and create the .cordova and .android folders in the home directory.


### Compiling for android ###

Cordova uses the toolchain from android SDK build around ant.

## The signing key ##

To build a release version of an app for android you need to create a key for signing, and place it somewhere cordova will find it.

Create a keystore:
	keytool -genkey -v -keystore mlab.keystore -alias mlab-key -keyalg RSA -keysize 2048 -validity 20000

mlab.keystore is your keystore-file, the mlab-key is the alias for the key within the file. You will be prompted for name, organization etc and the password for the keystore and the alias.

Place the generated file in the home directory. You may want to let root be owner, but www-data should be able to read the key.

## The ant.properties ##
Copy the ant.properties file from the docs/templates file to the home directory. Edit it to suit your setup. MLAB will use this file when compiling a release app
