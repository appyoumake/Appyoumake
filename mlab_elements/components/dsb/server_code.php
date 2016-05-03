<?php

function outputHtml(DOMNode $node) {
    $html = "";
    $tag = $node->nodeName;
    if ($tag != "#text") {
        if ($tag == "ul") {
            $html .= "<$tag>";
            foreach ($node->childNodes as $child) {
                $html .= outputHtml($child);
            }
            $html .= "</$tag>";
        } else {
            $html .= "<$tag>" . str_replace("Klasse", "<br>Klasse", htmlentities($node->nodeValue)) . "</$tag>";
        }
    }
    return $html;
} 


class mlab_ct_dsb {
    
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        $url = "http://www.dsb.no/no/Ansvarsomrader/Farlige-stoffer/Transport/ADR-sjafor/";
        $html = "<div class='mc_text mc_display '>";
        $frontpage_content = file_get_contents($url);

        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->validateOnParse = true;
        $doc->loadHTML('<?xml encoding="UTF-8">' . $frontpage_content);

        $xpath = new DOMXpath($doc);

        $heads = $xpath->query("//*[contains(@class, 'secondHeading')]");
        foreach($heads as $head) {
            $html .= "<h1>" . htmlentities($head->nodeValue) . "</h1>";

        }

        $intros = $xpath->query("//*[contains(@class, 'gradientintro')]");
        foreach($intros as $intro) {
            $html .= "<em>" . htmlentities($intro->nodeValue) . "</em>";

        }

        //$articles = $xpath->query("//*[contains(@class, 'article')]");
        //$xpath = new DOMXpath($articles);

        $contents = $xpath->query('//*[contains(@class, "article")]//*[contains(@class, "content")]');
        foreach ($contents as $content) {
            foreach  ($content->childNodes as $node) {
                $html .= outputHtml($node);
            }
        }
        return $html . "</div>";
    }
}