<?php

class mlab_ct_h1 {

    public function onCompile($html_text, $html_node) {
        $plain_text = $html_node->getElementsByTagName("h1")[0]->nodeValue;
        return "<h1>PrOcEsSeD " . $plain_text . " OK?</h1>";
    }
    
}
