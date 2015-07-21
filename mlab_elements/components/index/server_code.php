<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class mlab_ct_index {
    
/**
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the data sent to us we check to see if an index should be 
 * top level index (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or collapsible (as previous with accordion jQuery component).
 */
   public function onCompile($html_node, $html_text, $app_path) {
        if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$app_path/index.html"), $matches) && isset($matches[1])) {
            $pages = array(0 => $matches[1]);
        } else {
            $pages = array(0 => "Untitled");
        }
        
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $pnum = intval(basename($file)); 
            if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$file"), $matches) && isset($matches[1])) {
                $pages[$pnum] = "{$matches[1]}";
            } else {
                $pages[$pnum] = "Untitled";
            }
        }
        return $pages;
        
        $plain_text = $html_node->getElementsByTagName("h1")->item(0)->nodeValue;
        return "<h1>PrOcEsSeD " . $plain_text . " OK?</h1>";
    }
    
}
