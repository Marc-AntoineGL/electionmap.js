//
//
// loadJSON('http://localhost:8000/bv_fontenilles_2017_4326.geojson',function(data) {
//   mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ';
//   var map = new mapboxgl.Map({
//       container: 'map',
//       style: 'mapbox://styles/mapbox/streets-v9',
//       center : [1.223549303040727, 43.55362036156569],
//       zoom : 12.5,
//       minZoom : 12.5
//   });
//   initMap(data,map)
//   setTimeout(function(){  loadJSON('http://localhost:8000/suffragiaV9.json',function(json) {
//         setData(json,map)
//         },function(xhr) {
//           console.error(xhr);
//         }
//       )
//   }, 3000);
//   setInterval(function() {loadJSON('http://localhost:8000/suffragiaV8.json',function(blabla) {
//       setData(blabla,map)
//       },function(xhr) {
//         console.error(xhr);
//       }
//     )}
//     ,5000
//   )
//   },function(xhr) {
//     console.error(xhr);
//   }
// );

function createWholeMap(geojsonFile,jsonFileV1,jsonFileV2){

  loadJSON(geojsonFile,function(data) {
    console.log(data)

      mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ';
      var map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v9',
          center : [1.223549303040727, 43.55362036156569],
          zoom : 12.5,
          minZoom : 12.5
      });
      calculCenterPolygon(data.features[0].geometry.coordinates,map)
      calculCenterPolygon(data.features[1].geometry.coordinates,map)
      calculCenterPolygon(data.features[2].geometry.coordinates,map)
      calculCenterPolygon(data.features[3].geometry.coordinates,map)
      calculCenterPolygon(data.features[4].geometry.coordinates,map)
      initMap(data,map)

      setTimeout(function(){
        loadJSON(jsonFileV1,function(json)
          {
            setData(json,map)
          },function(xhr) {
            console.error(xhr);
          }
        )
      }
      , 3000);
      setInterval(function () {
        loadJSON(jsonFileV2,function(a)
          {
            setData(a,map)
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
function calculCenterPolygon(polygon,map){
  var p = polylabel(polygon,1.0);
  //console.log(p)
  // var popup = new mapboxgl.Popup({closeOnClick: true});
  // popup.setLngLat(p)
  // .setText('coucou')
  // .addTo(map);
}
function initMap(data,map){
    map.on("load",function(){

        map.addSource("dataBV",{
            "type" : "geojson",
            "data" : data
        });
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
        //fill empty
        map.addLayer({
            id : "fillBVEmpty",
            type : "fill",
            source : "dataBV",
            filter : ["==","$type","Polygon"],
            paint :
                {
                    'fill-color': 'white',
                    'fill-opacity': 0.0
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
    });//end onLoad
}
function setData(json,map){
    map.on("click", function(e) {
        //console.log([e.lngLat.lng,e.lngLat.lat])
        console.log(e)
    });
    var listCandidates = json[0],listDesks = json[1], generalInfos = json[2];
    //console.log("listDesks",listDesks)
    editGeneralPanel(generalInfos)
    //edit json to add total voices by bureau
    setTotalVoices(listDesks)
    //console.log('json',json)
    //calculate the first of every bureau
    var layersColor = [];
    setFirsts(listCandidates,listDesks,generalInfos)
    //console.log('listDesks',listDesks)
    //getTop5
    getTop5(listDesks);
    calculPercentage(listDesks)
    //console.log('listDesks',listDesks)

    //creates bureau panel
    if(!document.getElementById('1')){
        initDivs(listCandidates,listDesks);
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

    var lastBureauID,popup;

    //for Divs on the Map
    showDivs(json,map)
}

function getFeatureColor(tab,i){
    var color;
    tab.forEach(function(e){
        if(e.idBureau == i){
        color = e.colorLayer;
        }
    })
    return color;
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
function getStops(json){
  var tab = [];
  for (var bureau in json){
    tab.push([bureau,json[bureau].detailsFirst.colorLayer])
  }
  console.log(tab)
  return tab;
}
function initDivs(listCandidates,listDesks){
    var j = 0;
    for (var bureau in listDesks){
        var el = document.createElement('div');
        el.id = listDesks[bureau].detailDesk[1];
        el.className = "bureau";
        //el.onclick = clicked;
        el.style.border = '5px solid '+listDesks[bureau].detailsFirst.colorLayer;
        el.innerHTML = '<h1 id='+'"'+"idBureau"+listDesks[bureau].detailDesk[1]+'">'+listDesks[bureau].detailDesk[0]+" "+replaceWithIcon(listDesks[bureau].detailDesk[2])+'</h1>'
        document.body.appendChild(el)
        var ul = document.createElement('ul');
        ul.className = "listCandidats"
        el.appendChild(ul);
        for (var i = 0; i < deskNumber; i++) {
            var li = document.createElement('li');
            li.className = "candidat"
            li.id = bureau.toString()+i;
            li.innerText = listCandidates[listDesks[bureau].top5[i].idC][0]+' ('+listCandidates[listDesks[bureau].top5[i].idC][1]+') '+listDesks[bureau].top5[i].scorePerc+'%';
            ul.appendChild(li);
        }
        var text = document.createElement('div');
        text.className = "bureauText";//nuero sur la carte
        text.id = "text"+listDesks[bureau].detailDesk[1];
        text.innerHTML = '<h1>'+listDesks[bureau].detailDesk[1]+'</h1>';
        document.body.appendChild(text);
        j++;
    }
}
function updateDivs(listCandidates,listDesks){
    var j = 0;
    for (var bureau in listDesks){
        var el = document.getElementById("idBureau"+listDesks[bureau].detailDesk[1]);
        el.innerHTML = listDesks[bureau].detailDesk[0]+ " "+replaceWithIcon(listDesks[bureau].detailDesk[2]);
        var el = document.getElementById(listDesks[bureau].detailDesk[1]);
        el.style.border = '5px solid '+listDesks[bureau].detailsFirst.colorLayer;

        for (var i = 0; i < 5; i++) {
            var li = document.getElementById(bureau.toString()+i);
            li.innerText = listCandidates[listDesks[bureau].top5[i].idC][0]+' ('+listCandidates[listDesks[bureau].top5[i].idC][1]+') '+listDesks[bureau].top5[i].scorePerc+'%';
        }
        j++;
    }}
    function showDivs(json,map){
        // for (var bureau in data[1]){
        var el = document.getElementById('1');
        new mapboxgl.Marker(el)//,{offset: [-25, -25]}
            .setLngLat([1.1296722167269877, 43.543666405007656])
            .addTo(map)

        var el = document.getElementById('2');
        new mapboxgl.Marker(el)//,{offset: [-25, -25]}
            .setLngLat([1.2206927895318245, 43.543847658081916])
            .addTo(map)

        var el = document.getElementById('3');
        new mapboxgl.Marker(el)//,{offset: [-25, -25]}
            .setLngLat([1.1267965667528301, 43.58860047808773])
            .addTo(map)

        var el = document.getElementById('4');
        new mapboxgl.Marker(el)//,{offset: [-25, -25]}
            .setLngLat([1.1961167622924904, 43.58818258745134])
            .addTo(map)

        var el = document.getElementById('5');
        new mapboxgl.Marker(el)//,{offset: [-25, -25]}
            .setLngLat([1.2466120585726799, 43.58739130800956])
            .addTo(map)

        //TEXT OF bureau
        var text = document.getElementById('text1');
        new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
            .setLngLat([1.1766954945074417, 43.547022263252956])
            .addTo(map)
        var text = document.getElementById('text2');
        new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
            .setLngLat([1.2038852694260243, 43.54904575686737])
            .addTo(map)
        var text = document.getElementById('text3');
        new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
            .setLngLat([1.1820363431605472, 43.56373604274361])
            .addTo(map)
        var text = document.getElementById('text4');
        new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
            .setLngLat([1.2000010158690202, 43.56065753694847])
            .addTo(map)
        var text = document.getElementById('text5');
        new mapboxgl.Marker(text,{offset: [-25, -25]})//
            .setLngLat([1.2219713250526638, 43.56136120929477])
            .addTo(map)

        // }

    }
function editGeneralPanel(generalInfos){
    //console.log(json)
    var el = document.getElementById('general')
    table = "<table class='table'><tr><td>Nombre de votes : </td><td>"+generalInfos.totalVote+"</td></tr>"+
    '<tr><td>Avancement : </td><td>'+ generalInfos.advancement + '</td></tr>'+
    '<tr><td>Votes Blanc : </td><td>'+ generalInfos.totalBlanc + '</td></tr>'+
    '<tr><td>Votes Nuls : </td><td>'+ generalInfos.totalNul + '</td></tr>'+
    '<tr><td>Votes Valides : </td><td>'+ generalInfos.totalValidlyExpressed + '</td></tr>'+
        '<tr><td>Meneur 1 : </td><td>'+ generalInfos.leader + '</td></tr>'+
        '<tr><td>Meneur 2 : </td><td>'+ generalInfos.leader2 + '</td></tr>'+
    '<tr><td>Etat de l\'élection : </td><td>'+ generalInfos.stateElection + '</td></tr></table>';

    el.innerHTML =
        '<h1>'+ generalInfos.townHall + '</h1>'+
        '<h2>'+ generalInfos.election + '</h2>'+
        '<h3>'+ generalInfos.date + '</h3>'+table;
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
        json[bureau].top5 = json[bureau].top5.slice(0,5);
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

//else
function clicked(e){
  if(document.getElementById(e.target.id).className.includes("bureau")){
    var el = document.getElementById(e.target.id);
    el.style.backgroundColor = 'red';
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
