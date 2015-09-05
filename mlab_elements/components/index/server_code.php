<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class mlab_ct_index {
    
    /**
     * Simple function to parse a page and look for chapter components, returns the name if found, or 0 if not found
     * @param type $page
     * @return int|string
     */
    private function findChapterHeading($page) {
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->loadHTML($page);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($doc);
        $chapter = $xpath->query("//div[@data-mlab-type='chapter']");
        if ($chapter->length > 0 ) {
            return $chapter->item(0)->nodeValue;
        } else {
            return 0;
        }
    }
/**
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the variables sent to us (this is from the JSON encoded variables stored at design time) we check to see if an index should be 
 * summary (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or folding (as previous with accordion jQuery component).
 * They all rely on the user having used the chapter component, if this is not found in any of the files we list pages on a single level
 */
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        if (!isset($variables) || !isset($variables["options"]) || !isset($variables["options"]["style"])) {
            $style = "folding";
        } else {
            $style = $variables["options"]["style"];
        }
        
        $index = array();
        
//first process index.html file, first we see if thsi starts a new chapter through the chapter component, 
//then we add the page title to the chapter element in the index array. 0 = no chapter specified
        $page_content = file_get_contents("$app_path/index.html");
        $current_chapter = $chapter = $this->findChapterHeading($page_content);
        $index[$current_chapter] = array();
        
        if (preg_match('/<title>(.+)<\/title>/', $page_content, $matches) && isset($matches[1])) {
            $index[$current_chapter][0] = $matches[1];
        } else {
            $index[$current_chapter][0] = "Front page";
        }
        
//now all other files in the app
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $page_content = file_get_contents($file);
            $chapter = $this->findChapterHeading($page_content);
            if ($chapter) {
                $current_chapter = $chapter;
            } 
            if (!isset($index[$current_chapter])) {
                $index[$current_chapter] = array();
            }
            
            $pnum = intval(basename($file));
            
            if (preg_match('/<title>(.+)<\/title>/', $page_content, $matches) && isset($matches[1])) {
                $index[$current_chapter][$pnum] = $matches[1];
            } else {
                $index[$current_chapter][$pnum] = "Page " . $pnum;
            }
        }
        

//now we have the data, time to output the HTML. If they asked for a folding layout, but did not specify any chapters, we output a plain list as for the other options
        if ($style == "folding" && sizeof($index) > 1) {
                $html = "<div data-role='collapsibleset' data-theme='a' data-content-theme='a' data-mini='true'>\n";
                foreach ($index as $chapter => $titles) {
                    $html .= "  <div data-role='collapsible'>\n";
                    if ($chapter == 0) {
                        $html .= "    <h3>" . $app_config["title"] . "</h3>\n";
                    } else {
                        $html .= "    <h3>$chapter</h3>\n";
                    }
                    foreach ($titles as $page_num => $title) {
                        $html .= "    <p><a onclick='mlab.api.navigation.pageDisplay(mlab.api.navigation.current_page, " . $page_num . "); return false;'>$title</a></p>\n";
                    }
                    $html .= "  </div>\n";
                }
                $html .= "</div>\n";
                
        } else {
                $html = "<ul>\n";
                foreach ($index as $chapter => $titles) {
                    if ($chapter == 0) {
                        $html .= "  <li>" . $app_config["title"] . "\n";
                    } else {
                        $html .= "  <li>$chapter\n";
                    }
                    
                    $html .= "<ul>\n";
                    foreach ($titles as $page_num => $title) {
                        $html .= "    <li><a onclick='mlab.api.navigation.pageDisplay(mlab.api.navigation.current_page, " . $page_num . "); return false;'>$title</a></li>\n";
                    }
                    $html .= "  </ul></li>\n";
                }
                $html .= "</ul>\n";
            
        }

        return $html;
        
    }
    
}
