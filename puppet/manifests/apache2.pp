# Basic Puppet Apache manifest
import 'config'
import 'init'

class apache2 {
  Package {
    ensure => installed,
  }

  package {["apache2",
            "libapache2-mod-php5", 
  	    "apache2-mpm-itk", 
	    "libapache2-mod-proxy-html",]:
            require => Exec["apt-get update"],
	    ;
  }

  service {"apache2":
	   ensure => running,
	   require => Package["apache2"],
  }

  exec {'set_servername':
    command => "/bin/echo 'ServerName ${config::servername}' >> /etc/apache2/httpd.conf",
    require => Service["apache2"],
  }

  file { '/etc/apache2/mods-enabled/rewrite.load':
       ensure => link,
       target => "/etc/apache2/mods-available/rewrite.load",
       force  => true
       ;
  }     
}

include apache2