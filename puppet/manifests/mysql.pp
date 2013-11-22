import 'config'
import 'init'

class mysql-server {
  package { "mysql-server": ensure => present}
  package { "php5-mysql": ensure => present} 
 

  exec { "Set MySQL server root password":
    subscribe => [ Package["mysql-server"] ],
    refreshonly => true,
    unless => "mysqladmin -uroot -p${config::mysql_password} status",
    path => "/bin:/usr/bin",
    command => "mysqladmin -uroot password ${config::mysql_password}",
  }
}

include mysql-server