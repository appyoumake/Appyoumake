import 'init'
import 'java'

class ant {
  package {
     ["ant"]:
      ensure => installed,
      require => [Exec["apt-get update"], Package['oracle-java7-installer']],
  }
}

include ant