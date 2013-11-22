import 'config'
import 'init'

class php {
  package { "php5-cli":
    ensure => present,
    require => Exec["apt-get update"],
  }
}

include php

class composer{
  # Install the php dependency manager Composer locally
  exec {'download-composer':
    command => "/usr/bin/curl -sS https://getcomposer.org/installer | php -- --install-dir=${config::builder_root}",
    creates => "${config::builder_root}composer.phar",
  }
  
  # Use composer to install deendencies as found in the composer.json file
  #exec {'composer-install-dependencies':
  # command => "/usr/bin/php ${config::$builder_root}composer.phar install",
  # creates => "${config::$builder_root}composer.lock",
  # }
    
}

include composer