sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"], function (UIComponent, JSONModel) {
    "use strict";
    return UIComponent.extend("de.autohaushessen.zahverkauf.Component", {
        metadata: { manifest: "json" },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(new JSONModel({ step: 0, kunde: null, fahrzeug: null, auftrag: null }), "wizard");
        }
    });
});
