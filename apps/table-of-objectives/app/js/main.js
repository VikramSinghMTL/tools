var pos = require('pos');
var blooms = require('./blooms.js');

var app = new Vue
({
  el: '#app',
  data:
  {
    glos: {},
    alerts: []
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
    },
    verify: function()
    {
      var self = this;
      var verbTags = ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'NN'];
      var bloomsVerbs = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
      var lexer = new pos.Lexer();
      var tagger = new pos.Tagger();

      self.alerts = [];

      for (var i = 0; i < self.glos.length; i++)
      {
        var glo = self.glos[i];

        if (!glo.description)
        {
          this.addAlert(glo.id, "danger", "Description should not be blank.");
        }
        else
        {
          var words = lexer.lex(self.glos[i].description);
          var taggedWords = tagger.tag(words);
          var sentences = glo.description.match(/\w[.?!](\s|$)/g);

          if (verbTags.indexOf(taggedWords[0][1]) == -1)
          {
            this.addAlert(glo.id, "warning", "Objectives should start with a verb. Your objective may be too wordy.");
          }

          if (sentences && sentences.length > 1)
          {
            this.addAlert(glo.id, "warning", "Objectives should be one sentence max.")
          }
        }

        for (var j = 0; j < self.glos[i].slos.length; j++)
        {
          var slo = self.glos[i].slos[j];
          
          if (!slo.knowledge)
          {
            this.addAlert(slo.id, "danger", "Knowledge Dimension should not be blank.");
          }

          if (!slo.cognitive)
          {
            this.addAlert(slo.id, "danger", "Cognitive Process should not be blank.");
          }

          if (!slo.description)
          {
            this.addAlert(slo.id, "danger", "Description should not be blank.");
            continue;
          }

          var words = lexer.lex(slo.description);
          var taggedWords = tagger.tag(words);
          var sentences = slo.description.match(/\w[.?!](\s|$)/g);

          if (verbTags.indexOf(taggedWords[0][1]) == -1)
          {
            this.addAlert(slo.id, "warning", "Objectives should start with a verb. Your objective may be too wordy.");
          }

          if (bloomsVerbs.indexOf(taggedWords[0][0].toLowerCase()) != -1)
          {
            this.addAlert(slo.id, "warning", "\"" + taggedWords[0][0] + "\" is too general for a SLO. How will one show that one can " + bloomsVerbs[bloomsVerbs.indexOf(taggedWords[0][0].toLowerCase())] + "?");
          }

          if (sentences && sentences.length > 1)
          {
            this.addAlert(slo.id, "warning", "Objectives should be one sentence max.")
          }
        }
      }
      
      if (self.alerts.length == 0)
      {
        this.addAlert("", "success", "Everything looks great :)");
      }
    },
    addAlert: function(id, type, description)
    {
      this.alerts.push(
      {
        "id": id,
        "type": "alert-" + type,
        "description": description 
      })
    }
  }
})
