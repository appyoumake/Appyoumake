import 'config'
import 'apache2'

class mlab_packages {

  package { "php5-intl":
      ensure => present,
  } 

}

include mlab_packages


class apache2_config {
  # Prepares the apache virtual server file
  file {"/etc/apache2/sites-available/${config::system_name}":

       ensure => file,
       content=> template("${system_home}/puppet/manifests/templates/mlab.virtual-server.erb"),
       require => Package["apache2"],
       ;
   }
   file {"/etc/apache2/sites-enabled/001-${config::system_name}":
       ensure => link,
       target => "/etc/apache2/sites-available/${config::system_name}",
       force  => true,
       require => File["/etc/apache2/sites-available/${config::system_name}"]
       ;
  }
  }
  include apache2_config