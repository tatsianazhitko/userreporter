export default (function() {
  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };

  var uri = "data:application/vnd.ms-excel;base64,",
    template =
      '<?xml version="1.0" encoding="utf-8"?>'+
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/Row/REC-html40">'+
      '<Styles>'+
        '<Style ss:ID="Title">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:Bold="1" ss:FontName="Times New Roman" ss:Size="11"/>'+
        '</Style>'+
        '<Style ss:ID="Normal">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:FontName="Times New Roman" ss:Size="11"/>'+
        '</Style>'+
        '<Style ss:ID="TitleBorder">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:Bold="1" ss:FontName="Times New Roman" ss:Size="11"/>'+
          '<Borders>'+
            '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" />'+
          '</Borders>'+
        '</Style>'+
        '<Style ss:ID="NormalBorder">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:FontName="Times New Roman" ss:Size="11"/>'+
          '<Borders>'+
            '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" />'+
          '</Borders>'+
        '</Style>'+
        '<Style ss:ID="TitleNumber">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:Bold="1" ss:FontName="Times New Roman" ss:Size="11"/>'+
          '<NumberFormat ss:Format="0.0"/>'+
        '</Style>'+
        '<Style ss:ID="NormalNumber">'+
          '<Alignment ss:Horizontal="Left" ss:Indent="0" ss:Rotate="0" ss:Vertical="Top" ss:WrapText="1"/>'+
          '<Font ss:FontName="Times New Roman" ss:Size="11"/>'+
          '<NumberFormat ss:Format="0.0"/>'+
        '</Style>'+
      '</Styles>'+
      '{data}'+
      '</Workbook>',
    base64 = function(s) {
      return window.btoa(unescape(encodeURIComponent(s)));
    },
    format = function(s, c) {
      return s.replace(/{(\w+)}/g, function(m, p) {
        return c[p];
      });
    };
  return function(tables, name, fileName) {
    var data = "";
    _.each(tables, table => {
      let domTable = document.getElementById(table).innerHTML;
      let tags = [
        'Row',
        'Cell',
        'Data',
        'Column',
      ];
      let attrs = [
        'ss:Type',
        'ss:Width',
        'ss:Height',
        'ss:Formula',
        'ss:StyleID',
        'ss:Column',
        'ss:MergeAcross',
        'ss:Span',
        'ss:AutoFitHeight',
      ];
      _.each(tags, tag => {
        domTable = domTable.replaceAll(
          format('<{t}', { t: _.toLower(tag)}),
          format('<{t}', { t: tag})
        );
        domTable = domTable.replaceAll(
          format('</{t}>', { t: _.toLower(tag)}),
          format('</{t}>', { t: tag})
        );
      });
      _.each(attrs, attr => {
        domTable = domTable.replaceAll(
          _.toLower(attr),
          attr
        );
      });
      data =
        data + format('<Worksheet ss:Name="{worksheet}"><Table>{data}</Table></Worksheet>', {
          data: domTable,
          worksheet: name || "Worksheet"
        });
    });
    var ctx = { data: data };
    window.URL = window.URL || window.webkitURL;

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      file = new Blob( [format(template, ctx)], {
        type: "data:application/vnd.ms-excel;base64,"
      });

      window.navigator.msSaveOrOpenBlob(file, fileName);
    }
    else {
      var xhr = new XMLHttpRequest(),
        a = document.createElement("a"),
        file;

      xhr.open("GET", "someFile", true);
      xhr.responseType = "blob";
      xhr.onload = function() {
        file = new Blob([xhr.response], {
          type: "data:application/vnd.ms-excel;base64,"
        });
        a.href = uri + base64(format(template, ctx));
        a.download = fileName;
        a.click();
      };
      xhr.send();
    }
  };
})();
