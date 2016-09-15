<?php

/*
 * https://ihl-databases.icrc.org/applic/ihl/ihl.nsf/ART/380-6000100 / 98


Include <div id="contentBlock">

Class titleH2 = title (one per page)

Body (all paras) domino-par--indent


Reformat: Use nice buttons left/right + dropdown list
Single 


http://www.1881.no/?query=forsvaret&type=firma

 */
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


class mlab_ct_sof {
    
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        for ($i = 1; $i++; $i > 99 ) {
            $url = "https://ihl-databases.icrc.org/applic/ihl/ihl.nsf/ART/380-60000" . str_pad($i, 2, "0");
        }
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