# Puppet manifest for downloading and installing cordova

import 'config'
import 'androidSDK'

class cordova-install {

 exec {'download-cordova-src':
    command => "/usr/bin/curl https://archive.apache.org/dist/cordova/cordova-${config::cordovaVersion}-src.zip -o ${config::setup_tmp_zip_folder}/cordova-${config::cordovaVersion}-src.zip",
    creates => "${config::setup_tmp_zip_folder}/cordova-${config::cordovaVersion}-src.zip",
    timeout => 2200,
    require => File["${config::setup_tmp_zip_folder}"]
  }

  exec { 'unpack-cordova':
       require => Exec["download-cordova-src"],
       creates => "${config::lib_folder}/cordova-${config::cordovaVersion}",
       command => "/usr/bin/unzip ${config::setup_tmp_zip_folder}/cordova-${config::cordovaVersion}-src.zip -d ${config::lib_folder}",
  }

  exec { 'unpack-cordova-android':
       require => Exec["unpack-cordova"],
       creates => "${config::lib_folder}/cordova-${config::cordovaVersion}/android-library",
       command => "/usr/bin/unzip ${config::lib_folder}/cordova-${config::cordovaVersion}/cordova-android.zip -d ${config::lib_folder}/cordova-${config::cordovaVersion}/android-library",
  }

}

include cordova-install
