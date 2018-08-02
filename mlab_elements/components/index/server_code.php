<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class mlab_ct_index {
    
    const LEVEL_1 = 1;
    const LEVEL_2 = 2;
    const LEVEL_3 = 3;

    /**
     * Simple function to parse a page and look for/extract the following
     * 1 - a chapter component, if found it returns thw following
     *     1.1 name 
     *     1.2 level (from stored variables
     * 2 - page title 
     * @param type $page
     * @return int|string
     */
    private function findChapterHeading($page, $def_title) {
        $page_info = array();
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->loadHTMLFile($page);
        libxml_clear_errors();
        $xpath = new DOMXPath($doc);
        
//check if there is a chapter heading here
        $chapter = $xpath->query("//div[@data-mlab-type='chapter']");
        if ($chapter->length > 0 ) {
            $page_info["chapter"] = $chapter->item(0)->firstChild->textContent;
            foreach ($chapter[0]->childNodes as $child_element) {
                if (get_class($child_element) == "DOMElement" && $child_element->getAttribute("class") == "mlab_storage") {
                    $vars = json_decode($child_element->textContent, true);
                    if (isset($vars["level"])) {
                        $page_info["level"] = $vars["level"];
                    } else {
                        $page_info["level"] = $this->LEVEL_1;
                    }
                }
            }
            
        } else {
            $page_info["chapter"] = false;
            $page_info["level"] = false;
        }
        
        $title = $xpath->query("//title");
        if ($title->length > 0 ) {
            $page_info["title"] = $title->item(0)->textContent;
        } else {
            $page_info["title"] = $def_title;
        }
        
        return $page_info;
    }
/**
 * at compile time we need to scan all the pages in the app, for each of these pages we extract the title of the page and any chapter components.
 * In the variables sent to us (this is from the JSON encoded variables stored at design time) we check to see if an index should be 
 * summary (just chapter headings), detailed (chapter headings with individual page titles under each chapter heading) or folding (as previous with accordion jQuery component).
 * They all rely on the user having used the chapter component, if this is not found in any of the files we list pages on a single level
 */
    public function onCompile($app_config, $html_node, $html_text, $app_path, $variables) {
        $index = array();
        if (!isset($variables) || !isset($variables["style"])) { $style = "detailed"; } else { $style = $variables["style"]; }
        if (!isset($variables) || !isset($variables["textsize"])) { $textsize = "mc_medium"; } else { $textsize = $variables["textsize"]; }
        
        
//first process index.html file. We check to see if this starts a new chapter through the chapter component, 
//then we add the page title to the chapter element in the index array. 0 = no chapter specified
        $index[] = $this->findChapterHeading("$app_path/index.html", "Front page");
        
/*
 * now we process all the other files in the app
 * the steps are as follows: 
 * 1 - Check if there is a chapter heading on the page
 * 2 - Extract page title
 * 3 - Build multi-dim array which is [chapter]{[page|another chapter]}{[page|another chapter]}[page]
 */
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $index[] = $this->findChapterHeading($file, "Page " . intval(basename($file)));
        }
        
//now we generate the index, we always add app title as top level and link to first page 
        $html = "    <h2><a class='mc_text mc_display mc_list mc_link mc_internal " . $textsize . "' onclick='mlab.api.navigation.pageDisplay(0); return false;'>" . $app_config["title"] . "</a></h2>\n";
        
//now we have the data, time to output the HTML. If they asked for a folding layout, but did not specify any chapters, we output a plain list as for the other options
        if ($style == "folding") {
            $html .= "<div class='mc_container mc_index mc_list " . $textsize . "'>\n";
            $curr_level = false;
            
//loop through all pages, insert new details tag for each chapter, can be neted.
            foreach ($index as $page_num => $chapter_info) {
                if ($chapter_info["chapter"]) { 
                    for ($i = $curr_level; $i >= $chapter_info["level"]; $i--) { //close previously opened details tag
                        $html .= "</details>\n";
                    }
                    $curr_chapter = $chapter_info["chapter"];
                    $curr_level = $chapter_info["level"];
                    $html .= "<details>\n";
                    $html .= "    <summary>" . trim($chapter_info["chapter"]) . "</summary>\n";
                }
                $html .= "    <p><a class='mc_text mc_display mc_list mc_link mc_internal' onclick='mlab.api.navigation.pageDisplay(" . $page_num . "); return false;'>" . $chapter_info["title"] . "</a></p>\n";
            }
            $html .= "</div>";
        } else {
            $html .= "<ul class='mc_container mc_index mc_list " . $textsize . "'>\n";
            $curr_level = false;
            
//loop through all pages, insert new details tag for each chapter, can be neted.
            foreach ($index as $page_num => $chapter_info) {
                if ($chapter_info["chapter"]) {
//close container for page names if detailed index
                    if ($style == "detailed") {
                        $html .= "    </ul>\n";
                    }
                    for ($i = $curr_level; $i >= $chapter_info["level"]; $i--) { //close previously opened list tag
                        $html .= "</li>\n";
                    }
                    $curr_chapter = $chapter_info["chapter"];
                    $curr_level = $chapter_info["level"];
                    $html .= "  <li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'><a onclick='mlab.api.navigation.pageDisplay(" . $page_num . "); return false;'>" . $chapter_info["chapter"] . "</a>\n";
//prepare container for page names if detailed index
                    if ($style == "detailed") {
                        $html .= "    <ul>\n";
                    }
                }
//adds page names for detailed index
                if ($style == "detailed") {
                    $html .= "      <li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'><a onclick='mlab.api.navigation.pageDisplay(" . $page_num . "); return false;'>" . $chapter_info["title"] . "</a></li>\n";
                }
            }

            $html .= "</ul>\n";
        }

        return $html;
        
    }
    
}
