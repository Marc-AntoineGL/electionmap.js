
var nbTop;
var map,geojson,json,listCandidates,listDesks,generalInfos,tabMarkers = [];
var booleans = {
  boolDisplayGeneralPanel : true,
  panelMoveable : false
}
//firsts functions
function createWholeMap(geojsonFile,jsonFileV1,jsonFileV2){

  loadJSON(geojsonFile,function(data) {
    console.log("geojson",data)
    geojson = data;

      mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ';
      map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v9',
          center : [1.223549303040727, 43.55362036156569],
          zoom : 12.5,
          minZoom : 12.5
      });
      initMap(geojson,map)
      setTimeout(function(){
        loadJSON(jsonFileV1,function(data)
          {
            json = data
            setData(json,map)
          },function(xhr) {
            console.error(xhr);
          }
        )
      }
      , 3000);
      setInterval(function () {
        loadJSON(jsonFileV2,function(data)
          {
            json=data;
            setData(json,map)
            console.log('ok')
          },function(xhr) {
            console.error(xhr);
          }
        )
      }
      ,5000
    )
    },function(xhr) {
        console.error(xhr);
    }
  );
}
function initMap(data,map){
    map.on("load",function(){

        map.addSource("dataBV",{
            "type" : "geojson",
            "data" : data
        });
        //limites
        map.addLayer({
            id : "lineBureaux",
            type : "line",
            source : "dataBV",
            paint :
                {
                    'line-color': 'black',
                    'line-opacity': 1
                }
        });
        //couche des bureaux remplis
        map.addLayer({
            id : "fillBV",
            type : "fill",
            source : "dataBV",
            filter : [
                "all",
                ["==","$type","Polygon"]
            ],
            paint :
                {
                    'fill-color': 'transparent',
                    'fill-opacity': 0.3
                }
        });

        map.on("mousedown", function(e) {
            //console.log([e.lngLat.lng,e.lngLat.lat])
            //console.log(e.lngLat)
            if(booleans.panelMoveable){
              map.on("mousemove",function(e){
                if(!booleans.panelMoveable){
                  return;
                }
                tabMarkers[booleans.panelMoveable].setLngLat(e.lngLat);
              })
              map.on("mouseup",function(e){

                map.off('mousemove',function(e){
                  tabMarkers[booleans.panelMoveable].setLngLat(e.lngLat);
                });
                booleans.panelMoveable = false;
                map.dragPan.enable();
              })
            }
        });

    });//end onLoad
}
function setData(json,map){
    //associate general vars
    listCandidates = json[0],listDesks = json[1], generalInfos = json[2];
    //set center of bureaux
    setCenterAllDesks(listDesks)
    //console.log("listDesks",listDesks)
    editGeneralPanel(generalInfos)
    //console.log("generalInfos",generalInfos)
    //edit json to add total voices by bureau
    setTotalVoices(listDesks)
    console.log('json',json)
    //calculate the first of every bureau
    var layersColor = [];
    setFirsts(listCandidates,listDesks,generalInfos)
    //console.log('listDesks',listDesks)
    //getTop5
    getTop5(listDesks);
    calculPercentage(listDesks)
    //console.log('listDesks',listDesks)

    //creates bureau panel
    //first time ? see if there is one bureau panel to know
    if(!document.getElementById('1')){
        initDivs(listCandidates,listDesks);
        //for Divs on the Map
        showDivs(json,map)
    }else{
        updateDivs(listCandidates,listDesks)
    }
    //update geometry color with first's color
    map.setPaintProperty('fillBV', 'fill-color',{
            property : 'bv217',
            type : 'categorical',
            stops : getStops(listDesks)
        }
    );


}

//relative to DOM
function replaceWithIcon(state){
    if(state == "EN COURS"){
        return '<i class="fa fa-clock-o" aria-hidden="true"></i>';
    }
    if(state == "FERME"){
        return '<i class="fa fa-close" aria-hidden="true"></i>';
    }
    if(state == "VALIDE"){
        return '<i class="fa fa-check-square-o" aria-hidden="true"></i>';
    }
    else {
        return state;
    }

}
function initDivs(listCandidates,listDesks){
    var j = 0;
    for (var bureau in listDesks){
      //panel bureaux
        var el = document.createElement('div');
        el.id = listDesks[bureau].detailDesk[1];
        el.className = "bureau";
        el.style.border = '5px solid '+listDesks[bureau].detailsFirst.colorLayer;
        el.onmousedown = clicked;
        el.innerHTML = '<h1 id='+'"'+"idBureau"+listDesks[bureau].detailDesk[1]+'">'+listDesks[bureau].detailDesk[0]+" "+replaceWithIcon(listDesks[bureau].detailDesk[2])+'</h1>'
        document.body.appendChild(el)
        var ul = document.createElement('ul');
        ul.className = "listCandidats"
        el.appendChild(ul);
        for (var i = 0; i < nbTop; i++) {
            var li = document.createElement('li');
            li.className = "candidat"
            li.id = bureau.toString()+i;
            li.innerText = listCandidates[listDesks[bureau].top5[i].idC][0]+' ('+listCandidates[listDesks[bureau].top5[i].idC][1]+') '+listDesks[bureau].top5[i].scorePerc+'%';
            ul.appendChild(li);
        }
        //number on the zone
        var text = document.createElement('div');
        text.className = "bureauText";//nuero sur la carte
        text.id = "text"+listDesks[bureau].detailDesk[1];
        text.innerHTML = '<h1>'+listDesks[bureau].detailDesk[1]+'</h1>';
        document.body.appendChild(text);
        j++;
    }
}
function clicked(){
  //console.log(listDesks[this.id])
  booleans.panelMoveable = this.id;
  console.log(this.backgroundColor)// = 'red';
  map.dragPan.disable();

}
function updateDivs(listCandidates,listDesks){
    var j = 0;
    for (var bureau in listDesks){
        var el = document.getElementById("idBureau"+listDesks[bureau].detailDesk[1]);
        el.innerHTML = listDesks[bureau].detailDesk[0]+ " "+replaceWithIcon(listDesks[bureau].detailDesk[2]);
        var el = document.getElementById(listDesks[bureau].detailDesk[1]);
        el.style.border = '5px solid '+listDesks[bureau].detailsFirst.colorLayer;

        for (var i = 0; i < nbTop; i++) {
            var li = document.getElementById(bureau.toString()+i);
            li.innerText = listCandidates[listDesks[bureau].top5[i].idC][0]+' ('+listCandidates[listDesks[bureau].top5[i].idC][1]+') '+listDesks[bureau].top5[i].scorePerc+'%';
        }
        j++;
    }
}
function showDivs(json,map){
    for (bureau in json[1]){
      //desks panel
      var el = document.getElementById(json[1][bureau].detailDesk[1]);
      tabMarkers[bureau] = new mapboxgl.Marker(el,{offset: [-100, -75]})//,{offset: [-25, -25]}
          .setLngLat(json[1][bureau].center)
          .addTo(map)

      //TEXT OF bureau
      var text = document.getElementById('text'+json[1][bureau].detailDesk[1]);
      new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
          .setLngLat(json[1][bureau].center)
          .addTo(map)
    }
}

//relative to General Panel
function editGeneralPanel(generalInfos){
    var el = document.getElementById('general')
    table = '<table class="table "'+isGeneralPanelHidden(generalInfos)+'><tr><td>Nombre de votes : </td><td>'+generalInfos.totalVote+"</td></tr>"+
    '<tr><td>Avancement : </td><td>'+ generalInfos.advancement + '</td></tr>'+
    '<tr><td>Votes Blanc : </td><td>'+ generalInfos.totalBlanc + '</td></tr>'+
    '<tr><td>Votes Nuls : </td><td>'+ generalInfos.totalNul + '</td></tr>'+
    '<tr><td>Votes Valides : </td><td>'+ generalInfos.totalValidlyExpressed + '</td></tr>'+
        '<tr><td>Meneur 1 : </td><td>'+ generalInfos.leader + '</td></tr>'+
        '<tr><td>Meneur 2 : </td><td>'+ generalInfos.leader2 + '</td></tr>'+
    '<tr><td>Etat de l\'élection : </td><td>'+ generalInfos.stateElection + '</td></tr></table>';

    el.innerHTML =

        '<div> <h1 class = "'+isGeneralPanelHidden(generalInfos)+'">'+ generalInfos.townHall + '</h1>' +'<button id="btnReduire" onclick="testclic()">'+panelEditButtonText(generalInfos)+'</button></div>'+
        '<h2 class = "'+isGeneralPanelHidden(generalInfos)+'">'+ generalInfos.election + '</h2>'+
        '<h3 class = "'+isGeneralPanelHidden(generalInfos)+'">'+ generalInfos.date + '</h3>'+table;
}
function testclic(){
  if(booleans.boolDisplayGeneralPanel){
    booleans.boolDisplayGeneralPanel = false;
    editGeneralPanel(generalInfos)
  }
  else {
    booleans.boolDisplayGeneralPanel = true;
    editGeneralPanel(generalInfos)
  }
}
function panelEditButtonText(generalInfos){
  if(booleans.boolDisplayGeneralPanel){
    return "Réduire";
  }
  else {
    return "Voir Général"
  }
}
function isGeneralPanelHidden(generalInfos){
  if(booleans.boolDisplayGeneralPanel){
    return "";
  }
  else {
    return "hidden"
  }
}

//calculs with json data
function setTotalVoices(json){
    for (var bureau in json){
        var total = 0;
        for (var candidat in json[bureau].detailCandidates){
            total += json[bureau].detailCandidates[candidat]
        }
        json[bureau].totalVoices = total;
    }
}
function getTop5(json){
    for (var bureau in json){
        json[bureau].top5 = [];
        for (var candidat in json[bureau].detailCandidates){
            json[bureau].top5.push({ idC : candidat, score : json[bureau].detailCandidates[candidat]})
        }
        json[bureau].top5.sort(compareScoreCandidats)
        json[bureau].top5 = json[bureau].top5.slice(0,nbTop);
    }
}
function calculateCenterMultiplePointsV3(Tab){
    var xS = parseFloat(Tab[0][0]), xL = parseFloat(Tab[0][0]), yS = parseFloat(Tab[0][1]), yL = parseFloat(Tab[0][1]), result;
    for (var i = 1; i < Tab.length; i++) {
        if(xS > parseFloat(Tab[i][0])){
            xS = parseFloat(Tab[i][0]);
        }else if(xL < parseFloat(Tab[i][0])){
            xL = parseFloat(Tab[i][0])
        }
        if (yS > parseFloat(Tab[i][1])){
            yS = parseFloat(Tab[i][1]);
        }else if (yL < parseFloat(Tab[i][1])){
            yL = parseFloat(Tab[i][1]);
        }
    }
    var x = (xS + xL)/2, y = (yS+yL)/2
    this.ne = [xL,yL];
    this.sw = [xS,yS];
    x.toString();
    y.toString();
    result = [x,y];
    return result;
}
function calculPercentage(listDesks){
  for(var bureau in listDesks){
    listDesks[bureau].top5.forEach(function(member5){
      var perss = member5.score / listDesks[bureau].totalVoices
      perss *= 100
      perss = Math.round(perss*100)/100
      member5.scorePerc = perss
    })
  }
}
function setFirsts(listCandidates,listDesks,generalInfos){
  for(var bureau in listDesks){
      listDesks[bureau].detailsFirst = {};
      calculateFirst(listDesks[bureau],bureau,listCandidates)
  }
}
function calculateFirst(bureau,idBureau,listCandidates){
    var first,name,colorLayer, score = 0;
    for (var candidat in bureau.detailCandidates){
        if(!first){
            first = candidat;
            score = bureau.detailCandidates[candidat];
        }
        if(bureau.detailCandidates[candidat] > score){
            first = candidat;
            score = bureau.detailCandidates[candidat];
            name = listCandidates[candidat][0];
        }
    }
    //console.log(first)
    if(name == undefined){
        colorLayer = '#ffffff'
    }else{
        colorLayer = listCandidates[first][2];
    }
    bureau.detailsFirst.idBureau = idBureau;
    bureau.detailsFirst.first = first;
    bureau.detailsFirst.colorLayer = colorLayer;
    bureau.detailsFirst.name = name;
    return first;
}

//set color on map
function getStops(json){
  var tab = [];
  for (var bureau in json){
    tab.push([bureau,json[bureau].detailsFirst.colorLayer])
  }
  return tab;
}

//relative to centers of desks
function calculCenterPolygon(polygon,listDesks){
  var p = polylabel(polygon,1.0);
  return p;
  //console.log(p)
  // var popup = new mapboxgl.Popup({closeOnClick: true});
  // popup.setLngLat(p)
  // .setText('coucou')
  // .addTo(map);
}
function setCenterAllDesks(listDesks){
  var j = 0;
  for (bureau in listDesks){
    j++
    geojson.features.forEach(function(feat){
      if (feat.properties.bv217 == listDesks[bureau].detailDesk[1]){
        listDesks[bureau].center = calculCenterPolygon(feat.geometry.coordinates);
      }
    })
  }
  if(j > 2){
    nbTop = 5;
  }else{
    nbTop = 2;
  }
}

//compare function
function compareScoreCandidats(a,b){
    if (a.score > b.score)
        return -1;
    if (a.score < b.score)
        return 1;
    return 0;
}

//load json
function loadJSON(path, success, error){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}
