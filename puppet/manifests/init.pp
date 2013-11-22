import 'config'

class init {
  exec { 'apt-get update':
      command => '/usr/bin/apt-get update'
  }
}

include init
