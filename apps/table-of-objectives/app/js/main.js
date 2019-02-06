let pos = require('pos');
let blooms = require('./blooms.js');
let docx = require('docx');
let save = require('save-file');
require('vue-textarea-autosize');

new Vue
({
  el: '#app',
  data:
  {
    title: "",
    description: "",
    glos: {},
    alerts: [],
    blooms: {}
  },
  mounted: function()
  {
    let self = this;
    this.loadJSON(function (response)
    {
      let json = JSON.parse(response);
      self.title = json.title;
      self.description = json.description;
      self.glos = json.glos;
    });
    this.convertBloomsToLowerCase();
  },
  methods:
  {
    convertBloomsToLowerCase: function()
    {
      let self = this;

      for (let i = 0; i < Object.keys(blooms).length; i++)
      {
        self.blooms[Object.keys(blooms)[i].toLowerCase()] = Object.values(blooms)[i].join('~').toLowerCase().split('~');
      }
    },
    loadJSON: function(callback)
    {
      let xobj = new XMLHttpRequest();
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
          "description": "",
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
      let sloId = gloId + "." + (this.glos[gloId-1].slos.length + 1);
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
      }
      else
      {
        this.glos[gloId].slos.splice(sloId, 1);
      }

      for (let i = gloId; i < this.glos.length; i++)
      {
        this.glos[i].id = (i + 1);

        for (let j = sloId; j < this.glos[i].slos.length; j++)
        {
          this.glos[i].slos[j].id = (i + 1) + "." + (j + 1);
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
    removeGlo: function(gloId)
    {
      if (this.glos.length == 1)
      {
        this.glos = {};
        return;
      }

      this.glos.splice(gloId, 1);

      for (let i = gloId; i < this.glos.length; i++)
      {
        this.glos[i].id = (i + 1);

        for (let j = 0; j < this.glos[i].slos.length; j++)
        {
          this.glos[i].slos[j].id = (i + 1) + "." + (j + 1);
        }
      }
    },
    promoteGlo: function(gloId)
    {
      for (let j = 0; j < this.glos[gloId].slos.length; j++)
      {
        this.glos[gloId].slos[j].id = (gloId) + "." + (j + 1);
      }

      for (let j = 0; j < this.glos[gloId - 1].slos.length; j++)
      {
        this.glos[gloId - 1].slos[j].id = (gloId + 1) + "." + (j + 1);
      }

      this.glos.splice(gloId - 1, 0, this.glos[gloId]);
      this.glos.splice(gloId + 1, 1);
      this.glos[gloId].id = (gloId + 1);
      this.glos[gloId - 1].id = gloId;
    },
    demoteGlo: function(gloId)
    {
      for (let j = 0; j < this.glos[gloId].slos.length; j++)
      {
        this.glos[gloId].slos[j].id = (gloId + 2) + "." + (j + 1);
      }

      for (let j = 0; j < this.glos[gloId + 1].slos.length; j++)
      {
        this.glos[gloId + 1].slos[j].id = (gloId + 1) + "." + (j + 1);
      }

      this.glos.splice(gloId + 2, 0, this.glos[gloId]);
      this.glos.splice(gloId, 1);
      this.glos[gloId].id = (gloId + 1);
      this.glos[gloId + 1].id = (gloId + 2);
    },
    save: function()
    {
      console.log("saving");
      let data = JSON.stringify(this.glos);
      let a = document.createElement("a");
      let file = new Blob([data], {type: 'text/plain'});
      
      a.href = URL.createObjectURL(file);
      a.download = 'table_of_objectives.json';
      a.click();
    },
    load: function(event)
    {
      let fileToLoad = event.target.files[0];
      let fileReader = new FileReader();
      let self = this;

      fileReader.onload = function(fileLoadedEvent)
      {
          let textFromFileLoaded = fileLoadedEvent.target.result;
          self.glos = JSON.parse(textFromFileLoaded);
      };

      fileReader.readAsText(fileToLoad, "UTF-8");
    },
    verify: function()
    {
      let self = this;
      let verbTags = ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'NN'];
      let bloomsLevels = Object.keys(self.blooms);
      let lexer = new pos.Lexer();
      let tagger = new pos.Tagger();

      self.alerts = [];

      for (let i = 0; i < self.glos.length; i++)
      {
        let glo = self.glos[i];
        let gloVerb;

        if (!glo.description)
        {
          this.addAlert(glo.id, "danger", "Description should not be blank.");
          continue;
        }
        else
        {
          let words = lexer.lex(self.glos[i].description);
          let taggedWords = tagger.tag(words);
          let sentences = glo.description.match(/\w[.?!](\s|$)/g);

          if (verbTags.indexOf(taggedWords[0][1]) == -1)
          {
            this.addAlert(glo.id, "warning", "Objectives should start with a verb. Your objective may be too wordy.");
          }
          else
          {
            gloVerb = taggedWords[0][0];
          }

          if (sentences && sentences.length > 1)
          {
            this.addAlert(glo.id, "warning", "Objectives should be one sentence max.")
          }
        }

        for (let j = 0; j < self.glos[i].slos.length; j++)
        {
          let slo = self.glos[i].slos[j];
          
          if (!slo.knowledge)
          {
            this.addAlert(slo.id, "danger", "Knowledge Dimension should not be blank.");
            continue;
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

          let words = lexer.lex(slo.description);
          let taggedWords = tagger.tag(words);
          let sentences = slo.description.match(/\w[.?!](\s|$)/g);
          let sloVerb;

          if (verbTags.indexOf(taggedWords[0][1]) == -1)
          {
            this.addAlert(slo.id, "warning", "Objectives should start with a verb. Your objective may be too wordy.");
          }
          else
          {
            sloVerb = taggedWords[0][0];
          }

          if (sloVerb && bloomsLevels.indexOf(sloVerb.toLowerCase()) != -1)
          {
            this.addAlert(slo.id, "warning", "\"" + sloVerb + "\" is too general for a SLO. How will one show that one can " + bloomsLevels[bloomsLevels.indexOf(sloVerb.toLowerCase())] + "?");
          }

          if (sentences && sentences.length > 1)
          {
            this.addAlert(slo.id, "warning", "Objectives should be one sentence max.")
          }

          if (gloVerb && this.bloomsLevelToNumeric(slo.cognitive) > this.bloomsLevelToNumeric(this.bloomsVerbLookup(gloVerb)))
          {
            this.addAlert(slo.id, "warning", "The Cognitive Process (" + slo.cognitive + ") should not be higher than the GLO (" + gloVerb + ")");
          }

          if (sloVerb && this.bloomsLevelToNumeric(slo.cognitive) != this.bloomsLevelToNumeric(this.bloomsVerbLookup(sloVerb)))
          {
            this.addAlert(slo.id, "warning", "The SLO's action verb (" + sloVerb + ") should match the Cognitive Process (" + slo.cognitive + ")");
          }
        }
      }
      
      if (self.alerts.length == 0)
      {
        this.addAlert("", "success", "Everything looks great :)");
      }

      setTimeout(function(){ document.getElementById("bottom").scrollIntoView({behavior: "smooth", block: "end"}); }, 200);
    },
    addAlert: function(id, type, description)
    {
      this.alerts.push(
      {
        "id": id,
        "type": "alert-" + type,
        "description": description 
      })
    },
    bloomsVerbLookup: function(verb)
    {
      let self = this;

      if (Object.keys(self.blooms).indexOf(verb.toLowerCase()) != -1)
      {
        return verb;
      }

      for (let i = 0; i < Object.values(self.blooms).length; i++)
      {
        if (Object.values(self.blooms)[i].indexOf(verb.toLowerCase()) != -1)
        {
          return Object.keys(self.blooms)[i];
        }
      }

      return "not found";
    },
    bloomsLevelToNumeric: function(level)
    {
      return Object.keys(this.blooms).indexOf(level.toLowerCase());
    },
    exportToFile: function()
    {
      let self = this;
      let numberOfSlos = 0;

      for (let i = 0; i < self.glos.length; i++)
      {
        numberOfSlos += self.glos[i].slos.length;
      }
      // Create document
      let doc = new docx.Document(undefined, {
        orientation: "landscape"
      });

      doc.Styles.createParagraphStyle("Normal", "Normal").font("Calibri").size(22);
      doc.Styles.createParagraphStyle("hanging", "Hanging").indent({ left: 1080, hanging: 720 }).font("Calibri");
      doc.Styles.createParagraphStyle("table-header", "TableHeader").bold().center().font("Calibri");

      doc.createParagraph(self.title).title().center().spacing({ after: 360 });
      doc.createParagraph("Course Description").heading1();
      doc.createParagraph(self.description).spacing({ after: 360 });

      let table = doc.createTable(numberOfSlos + 1, 4);
      table.getCell(0, 0).addContent(new docx.Paragraph("General Learning Objective").style("table-header"));
      table.getCell(0, 1).addContent(new docx.Paragraph("Specific Learning Objective").style("table-header"));
      table.getCell(0, 2).addContent(new docx.Paragraph("Knowledge Dimension").style("table-header"));
      table.getCell(0, 3).addContent(new docx.Paragraph("Cognitive Process").style("table-header"));

      let offset = 1;
      for (let i = 0; i < self.glos.length; i++)
      {
        table.getCell(offset, 0).addContent(new docx.Paragraph(self.glos[i].id + "\t" + self.glos[i].description).style("hanging"));

        for (let j = 0; j < self.glos[i].slos.length; j++)
        {
            table.getCell((j + offset), 1).addContent(new docx.Paragraph(self.glos[i].slos[j].id + "\t" + self.glos[i].slos[j].description).style("hanging"));
            table.getCell((j + offset), 2).addContent(new docx.Paragraph(self.glos[i].slos[j].knowledge.charAt(0).toUpperCase() + self.glos[i].slos[j].knowledge.slice(1)).center());
            table.getCell((j + offset), 3).addContent(new docx.Paragraph(self.glos[i].slos[j].cognitive.charAt(0).toUpperCase() + self.glos[i].slos[j].cognitive.slice(1)).center());
        }

        offset += self.glos[i].slos.length;
      }

      // Used to export the file into a .docx file
      let packer = new docx.Packer(doc);

      packer.toBlob(doc).then(blob => {
          save(blob, "example.docx");
      });
    }
  }
})

