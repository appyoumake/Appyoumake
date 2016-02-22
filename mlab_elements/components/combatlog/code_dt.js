//basic combat log data entry

    this.onCreate = function (el) {
        this.api.setVariable(el, "url", "http://localhost"); //prompt("Please enter the URL of this combatlog")
        this.api.setVariable(el, "port", 8081); //prompt("Please enter the port of this combatlog")
    };
    