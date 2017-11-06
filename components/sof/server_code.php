<?php

/*
 * https://ihl-databases.icrc.org/applic/ihl/ihl.nsf/ART/380-600100 / 98

https://ihl-databases.icrc.org/applic/ihl/ihl.nsf/ART/365-570075?OpenDocument

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
        $complete_html = "<div class='mc_text mc_display ' id='sof'><div style='width: 100%;height: auto; '><button style='width: 49%;height: 30px; float: left; padding: 0;' onclick='$(\".sof_current\").removeClass(\"sof_current\").css(\"display\", \"none\").prev().addClass(\"sof_current\").css(\"display\", \"block\")'>Previous</button><button style='width: 49%; height: 30px; float: right; padding:0;'  onclick='$(\".sof_current\").removeClass(\"sof_current\").css(\"display\", \"none\").next().addClass(\"sof_current\").css(\"display\", \"block\")'>Next</button></div><div>";
        $html = "<div class='mc_text mc_display sof_current'>";
        for ($i = 1; $i < 75; $i++ ) {
            $url = "https://ihl-databases.icrc.org/applic/ihl/ihl.nsf/ART/365-5700" . sprintf('%02d', $i) . "?OpenDocument";
            $content = @file_get_contents($url);
            
            if ($content) {
                $doc = new \DOMDocument("1.0", "utf-8");
                libxml_use_internal_errors(true);
                $doc->validateOnParse = true;
                $doc->loadHTML('<?xml encoding="UTF-8">' . $content);

                $xpath = new DOMXpath($doc);

                $heads = $xpath->query("//*[contains(@class, 'titleH2')]");
                if ($heads->length > 0) {

                    $head = "<h3 class='mc_text mc_display mc_heading mc_small'>" . htmlentities($heads->item(0)->nodeValue) . "</h3>";

                    $paras = $xpath->query("//*[contains(@class, 'domino-par--indent')]");
                    if ($paras->length > 0) {
                        $para = "<p class='mc_text mc_display mc_medium'>" . $paras->item(0)->nodeValue . "</p>";
                        $complete_html .= $html . $head . $para . "</div>";
                        $html = "<div class='mc_text mc_display' style='display: none;'>";
                    }
                }
            }
        }

        return $complete_html . "</div></div>";
    }
}