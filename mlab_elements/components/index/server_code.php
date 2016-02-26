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
            error_log($chapter->item(0)->nodeValue);
            return $chapter->item(0)->nodeValue;
        } else {
            return false;
        }
    }
/**
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the variables sent to us (this is from the JSON encoded variables stored at design time) we check to see if an index should be 
 * summary (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or folding (as previous with accordion jQuery component).
 * They all rely on the user having used the chapter component, if this is not found in any of the files we list pages on a single level
 */
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        if (!isset($variables) || !isset($variables["style"])) {
            $style = "detailed";
        } else {
            $style = $variables["style"];
        }
        
        if (!isset($variables) || !isset($variables["textsize"])) {
            $textsize = "mc_medium";
        } else {
            $textsize = $variables["textsize"];
        }
        
        $index = array();
        
//first process index.html file, first we see if thsi starts a new chapter through the chapter component, 
//then we add the page title to the chapter element in the index array. 0 = no chapter specified
        $page_content = file_get_contents("$app_path/index.html");
        $current_chapter = $this->findChapterHeading($page_content);
        if (!$current_chapter) {
            $current_chapter = "___";
        } 
        
        if (preg_match('/<title>(.+)<\/title>/', $page_content, $matches) && isset($matches[1])) {
            error_log($matches[1]);
            $index[$current_chapter][0] = $matches[1];
        } else {
            $index[$current_chapter][0] = "Front page";
        }
        
//now all other files in the app
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $page_content = file_get_contents($file);
            
//here we check if the chapter has changed, only update aray if a new chapter is found in the current page HTML
            $chapter = $this->findChapterHeading($page_content);
            if ($chapter) {
                $current_chapter = $chapter;
                $index[$current_chapter] = array();
            }
            
//ALWAYS process page to list with page number
            $pnum = intval(basename($file));
            if (preg_match('/<title>(.+)<\/title>/', $page_content, $matches) && isset($matches[1])) {
                error_log($matches[1]);
                $index[$current_chapter][$pnum] = $matches[1];
            } else {
                $index[$current_chapter][$pnum] = "Page " . $pnum;
            }
        }
        
//add app title as top level and link to first page ALWAYS
        $html = "    <h2><a class='mc_text mc_display mc_list mc_link mc_internal " . $textsize . "' onclick='mlab.api.navigation.pageDisplay(0); return false;'>" . $app_config["title"] . "</a></h2>\n";
        
//now we have the data, time to output the HTML. If they asked for a folding layout, but did not specify any chapters, we output a plain list as for the other options
        if ($style == "folding") {
            $html .= "<div data-role='collapsible-set' data-theme='a' data-content-theme='a' data-mini='true'>\n";

//outer loop for chapter
            foreach ($index as $chapter => $titles) {
                if ($chapter === "___") {
                    $head = "Start...";
                } else {
                    $head = trim($chapter);
                }
                reset($titles);
                $html .= "  <div data-role='collapsible'>\n";
                $html .= "    <h3>$head</h3>\n";
                foreach ($titles as $page_num => $title) {
                    $html .= "    <p><a class='mc_text mc_display mc_list mc_link mc_internal " . $textsize . "' onclick='mlab.api.navigation.pageDisplay(" . $page_num . "); return false;'>$title</a></p>\n";
                }
                $html .= "  </div>\n";
            }
            $html .= "</div>\n";
                
        } else {
            $html .= "<ul class='mc_container mc_list'>\n";

            foreach ($index as $chapter => $titles) {
                if ($chapter === "___") {
                    $head = "Frontpage";
                } else {
                    $head = trim($chapter);
                }
                reset($titles);
                $html .= "  <li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal " . $textsize . "'><a onclick='mlab.api.navigation.pageDisplay(" . key($titles) . "); return false;'>$head</a>\n";
                if ($style == "detailed") {
                    $html .= "    <ul>\n";
                    foreach ($titles as $page_num => $title) {
//adds page names for detailed index
                        $html .= "      <li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal " . $textsize . "'><a onclick='mlab.api.navigation.pageDisplay(" . $page_num . "); return false;'>$title</a></li>\n";
                    } 
                    $html .= "    </ul>\n";
                }
                $html .= "  </li>\n";
            }
            $html .= "</ul>\n";
            
        }

        return $html;
        
    }
    
}
