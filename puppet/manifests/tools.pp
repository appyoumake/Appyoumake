# Puppet config for tools that install on the server
import 'init'


class emacs {
  package { "emacs23-nox":
    ensure => present,
    require => Exec["apt-get update"],    
  }

  package { "html-helper-mode":
    ensure => present,
    require => Exec["apt-get update"],
  }

  package { "php-elisp":
    ensure => present,
    require => Exec["apt-get update"],
  }

}
include emacs

class screen {
  package { "screen":
    ensure => present,
    require => Exec["apt-get update"],
  }
}
include screen 

class various {
  package {
      ["byobu", "vim", "strace", "tree", "curl", "build-essential", "less", "sshfs", "unzip"]:
      ensure => installed,
      require => Exec["apt-get update"],
  }
}
include various