var actual_JSON;

loadJSON(function (response) {
  // Parse JSON string into object
  actual_JSON = JSON.parse(response);
});

var app = new Vue({
  el: '#app',
  data: {
    glos: actual_JSON
  },
  methods: {
    addSlo: function(gloId) {
      var sloId = gloId + "." + (this.glos[gloId-1].slos.length + 1);
      this.glos[gloId-1].slos.push({
        "id": sloId,
        "description": "",
        "knowledge": "",
        "cognitive": ""
      });
    },
    removeSlo: function(gloId, sloId) {
      this.glos[gloId].slos.splice(sloId, 1);
    },
    promoteSlo: function(gloId, sloId) {
      this.glos[gloId].slos.splice(sloId - 1, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId + 1, 1);
      this.glos[gloId].slos[sloId].id = (gloId + 1) + "." + (sloId + 1);
      this.glos[gloId].slos[sloId - 1].id = (gloId + 1) + "." + (sloId);
    },
    demoteSlo: function(gloId, sloId) {
      this.glos[gloId].slos.splice(sloId + 2, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId, 1);
      this.glos[gloId].slos[sloId].id = (gloId + 1) + "." + (sloId + 1);
      this.glos[gloId].slos[sloId + 1].id = (gloId + 1) + "." + (sloId + 2);
    }
  }
})

function $(id) {
  return document.getElementById(id);
}

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'js/data.json', false); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}
