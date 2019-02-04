(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var app = new Vue
({
  el: '#app',
  data:
  {
    glos: {}
  },
  mounted: function()
  {
    var self = this;
    this.loadJSON(function (response)
    {
      self.glos = JSON.parse(response);
    });
  },
  methods:
  {
    loadJSON: function(callback)
    {
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', 'js/data.json', false); // Replace 'my_data' with the path to your file
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200")
        {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
      };
      xobj.send(null);
    },
    addGlo: function()
    {
      this.glos.push(
        {
          "id": this.glos.length + 1,
          "description": "Add GLO description here",
          "slos": [
            {
              "id": (this.glos.length + 1) + ".1",
              "description": "",
              "knowledge": "",
              "cognitive": ""
            }
          ]
      });
    },
    addSlo: function(gloId)
    {
      var sloId = gloId + "." + (this.glos[gloId-1].slos.length + 1);
      this.glos[gloId-1].slos.push(
      {
        "id": sloId,
        "description": "",
        "knowledge": "",
        "cognitive": ""
      });
    },
    removeSlo: function(gloId, sloId)
    {
      if (this.glos[gloId].slos.length == 1)
      {
        this.glos.splice(gloId, 1);

        for (var i = gloId; i < this.glos.length; i++)
        {
          this.glos[i].id = (i + 1);

          for (var j = sloId; j < this.glos[i].slos.length; j++)
          {
            this.glos[i].slos[j].id = (i + 1) + "." + (j + 1);
          }
        }
      }
      else
      {
        this.glos[gloId].slos.splice(sloId, 1);

        for (var i = sloId; i < this.glos[gloId].slos.length; i++)
        {
          this.glos[gloId].slos[i].id = (gloId + 1) + "." + (i + 1);
        }
      }
    },
    promoteSlo: function(gloId, sloId)
    {
      this.glos[gloId].slos.splice(sloId - 1, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId + 1, 1);
      this.glos[gloId].slos[sloId].id = (gloId + 1) + "." + (sloId + 1);
      this.glos[gloId].slos[sloId - 1].id = (gloId + 1) + "." + (sloId);
    },
    demoteSlo: function(gloId, sloId)
    {
      this.glos[gloId].slos.splice(sloId + 2, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId, 1);
      this.glos[gloId].slos[sloId].id = (gloId + 1) + "." + (sloId + 1);
      this.glos[gloId].slos[sloId + 1].id = (gloId + 1) + "." + (sloId + 2);
    },
    save: function()
    {
      console.log("saving");
      var data = JSON.stringify(this.glos);
      var a = document.createElement("a");
      var file = new Blob([data], {type: 'text/plain'});
      
      a.href = URL.createObjectURL(file);
      a.download = 'table_of_objectives.json';
      a.click();
    },
    load: function(event)
    {
      var fileToLoad = event.target.files[0];
      var fileReader = new FileReader();
      var self = this;

      fileReader.onload = function(fileLoadedEvent)
      {
          var textFromFileLoaded = fileLoadedEvent.target.result;
          console.log(textFromFileLoaded);
          self.glos = JSON.parse(textFromFileLoaded);
      };

      fileReader.readAsText(fileToLoad, "UTF-8");
    }
  }
})

},{}]},{},[1]);
