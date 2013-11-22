# This is the config file for the overall system. Changes are made in this file

class config {
        
        # Common settings
        $user = "www-data"
        $group = "www-data"
        
        # Servername
        $servername = "mlab"    
        
        # Where the source repository is cloned to
        $system_home = "/home/sinett/nyeMLAB/"
                
        # The MLAB src folder
        $builder_root = "/home/sinett/nyeMLAB/mlab-symfony/"
        
        # Database
        $mysql_password = "sinett"
        $mysql_user = "root"
        $database = "symfony"
        
        
        # Used for downloaded and ziped files
        $setup_tmp_folder = "/home/sinett/nyeMLAB/tmp/"
        $setup_tmp_zip_folder = "/home/sinett/nyeMLAB/tmp/zipped"
        
        # Place for Android SDK and Cordova
        $lib_folder = "/usr/local/lib/"

        $cordovaVersion = "3.1.0"
        $cordova_bin_path = "${config::lib_folder}cordova-${config::cordovaVersion}/bin/"        
        
                
        # Make sure the main config directories exists
        file { [ "$system_home", "$setup_tmp_folder", "$setup_tmp_zip_folder" ]:
        ensure => "directory",
        mode => 755,
        owner => "$user",
        group => "$group",} 
                
                      
        # Apache
        $DocumentRoot = "${system_home}/mlab-symfony/web/"
        $ApacheLog = "/var/log/apache2/mlab.log"
        
        #$ModuleRoot = "${system_home}src/module"
        
        #??? FIX
        $hostip = $::ipadress
        $port = "80" # used at apache virtual server setup        
        
}

include config