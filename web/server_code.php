<?php

function DOMinnerHTML(DOMNode $element) 
{ 
    $innerHTML = ""; 
    $children  = $element->childNodes;

    foreach ($children as $child) 
    { 
        $innerHTML .= $element->ownerDocument->saveHTML($child);
    }

    return $innerHTML; 
} 


$frontpage_content = file_get_contents("http://www.dsb.no/no/Ansvarsomrader/Farlige-stoffer/Transport/ADR-sjafor/");

$doc = new \DOMDocument("1.0", "utf-8");
libxml_use_internal_errors(true);
$doc->validateOnParse = true;
$doc->loadHTML('<?xml encoding="UTF-8">' . $frontpage_content);

$xpath = new DOMXpath($doc);
$heads = $xpath->query("//*[contains(@class, 'gradientintro')]");
    foreach($heads as $head) {
        print "<h4>" . htmlentities($head->nodeValue) . "</h4>";
        
    }
    
/*$articles = $xpath->query("//*[contains(@class, 'article')]");
$xpath = new DOMXpath($articles);*/
    
    $contents = $xpath->query('//*[contains(@class, "article")]//*[contains(@class, "content")]');
// WORKS: $contents = $xpath->query("//*[contains(@class, 'content')]");
foreach ($contents as $content) {
    print "<p>" . htmlentities($content->nodeValue) . "</p>";
}
//var_dump($article->nodeValue);