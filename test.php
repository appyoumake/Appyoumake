<?php
        $dir = new \RecursiveDirectoryIterator("/home/utvikler/workspace/mlab.local.dev/mlab_elements/components/");
        $iterator = new \RecursiveIteratorIterator($dir);
        $files = new \RegexIterator($iterator, "/.*code_dt\.jvs/i", RecursiveRegexIterator::GET_MATCH);
print var_dump($files) .  "-";
foreach($files as $file) {
    print ($file[0] . PHP_EOL);
}
print("bye\n");

