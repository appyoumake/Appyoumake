ALTER TABLE  `component` DROP  `new_line` ;
ALTER TABLE  `usr` ADD  `locale` VARCHAR( 6 ) NULL ;
ALTER TABLE  `components_groups` ADD  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST ;
ALTER TABLE  `components_groups` ADD  `credential` LONGTEXT NULL ;