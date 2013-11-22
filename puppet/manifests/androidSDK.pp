import 'config'
import 'init'
import 'java-tools'
import 'java'


class android-install {

 exec {'download-sdk':
    # Download android sdk and place tar file in temporary download folder
    command => "/usr/bin/curl http://dl.google.com/android/android-sdk_r22-linux.tgz -o ${config::setup_tmp_zip_folder}/android-sdk_r22-linux.tgz",
    creates => "${config::setup_tmp_zip_folder}/android-sdk_r22-linux.tgz",
#    true => "/usr/bin/md5sum ${config::setup_src_folder}/bin/zipped/android-sdk_r22-linux.tgz | /bin/grep 30fb75bad918c5c3d79f8ec3cc44b3cf",
    unless => "/bin/ls -la ${config::lib_folder} | /bin/grep 'android-sdk-linux' ",
    require => Exec["apt-get update"],
  }

  exec { 'unpack-android':
       require => Exec["download-sdk"],
       unless => "/bin/ls ${config::lib_folder} | /bin/grep 'android-sdk-linux' ",
       command => "/bin/tar -xzf ${config::setup_tmp_zip_folder}/android-sdk_r22-linux.tgz -C ${config::lib_folder}",
  }
  
 file {"${config::lib_folder}android-sdk-linux/":
    require => Exec["unpack-android"],
    ensure => directory,
    recurse => true,
    owner => root,
    group => root,
}

exec { 'android-sdk-linux-set-permissions':
    require => Exec["unpack-android"],
    command => "/bin/chmod ugo+r,ug+w ${config::lib_folder}/android-sdk-linux/",
}

# SDK Tools
# Required. Your new SDK installation already has the latest version. Make sure you keep this up to date.
  exec { 'build-tool':
       require => [Exec["unpack-android"], Package["ant"]],
       creates => "${config::lib_folder}/android-sdk-linux/build-tools/",
       command => "/bin/echo 'y' | ${config::lib_folder}/android-sdk-linux/tools/android update sdk -u --filter tool",
  }
# SDK Platform-tools
# Required. You must install this package when you install the SDK for the first time.
  exec { 'build-platform-tools':
       require => Exec["unpack-android"],
       timeout => 2200,
       creates => "${config::lib_folder}/android-sdk-linux/platform-tools/",
       command => "/bin/echo 'y' | ${config::lib_folder}/android-sdk-linux/tools/android update sdk -u --filter platform-tool",
  }

  # The lists of platforms does not stay the same. Run:
  # $ ${config::lib_folder}/android-sdk-linux/tools/android list sdk
  # For a complete list of platform packages. 
  if "${config::cordovaVersion}" =~ /3\.*/ {  # only for cordova version above 3
    exec { 'build-platform-android-18':
           require => Exec["build-platform-tools"],
           creates => "${config::lib_folder}/android-sdk-linux/platforms/android-18",
           timeout => 2200,
           command => "/bin/echo 'y' | ${config::lib_folder}/android-sdk-linux/tools/android update sdk -u --filter android-18",
         }
  }

  exec { 'build-platform-android-17':
       require => Exec["build-platform-tools"],
       creates => "${config::lib_folder}/android-sdk-linux/platforms/android-17",
      timeout => 2200,
       command => "/bin/echo 'y' | ${config::lib_folder}/android-sdk-linux/tools/android update sdk -u --filter android-17",
       unless => "/bin/ls -la ${config::lib_folder}/android-sdk-linux/platforms | /bin/grep 'android-17' " # only if not already build
  }

  exec { 'build-platform-android-16':
       require => Exec["build-platform-tools"],
       creates => "${config::lib_folder}/android-sdk-linux/platforms/android-16",
       timeout => 2200,
       command => "/bin/echo 'y' | ${config::lib_folder}/android-sdk-linux/tools/android update sdk -u --filter android-16",
       unless => "/bin/ls -la ${config::lib_folder}/bin/android-sdk-linux/platforms | /bin/grep 'android-16' " # only if not already build
  }

  exec { 'add-android-sdk-to-path':
       require => Exec["unpack-android"],
       command => "/bin/echo 'export PATH=\$PATH:${config::lib_folder}/android-sdk-linux/tools' >> /etc/profile",
       unless => "/bin/cat /etc/profile | /bin/grep 'android-sdk-linux' " 
  }

}

include android-install

