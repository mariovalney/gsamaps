// THE MAIN
	var map;
// JUST SYNONYMOUS
	var GMaps = google.maps;
	var geocoder = new GMaps.Geocoder();
// DEFINE THE WORLD BOUNDS
	var worldEnd = new GMaps.LatLngBounds(
    	new GMaps.LatLng(-85, -180), 
    	new GMaps.LatLng(85, 180)
	);
	var lastValidBound;
// THINGS
	var embaixadores;
	var markers = {};

// FUNCTION TO START EVERYTHING
function initMap() {
	GMaps.visualRefresh = true;
	
	var mapOptions = {
		center: new GMaps.LatLng(11.373552, -83.304128),
		zoom: 3,
		mapTypeId: GMaps.MapTypeId.SATELLITE,
		disableDefaultUI: true,
		minZoom: 3,
		keyboardShortcuts: false
	};
	
	var mapElement = document.getElementById('mapa-mundi');

	map = new GMaps.Map(mapElement,mapOptions);

	lastValidBound = map.getBounds();
}

function resetMap() {
	closeInfoWindows();
	map.setCenter(new GMaps.LatLng(11.373552, -83.304128));
	map.setZoom(3);
}

// FUNCTION TO READ THE JSON
function embaixadoresInit() {
	$.each(embaixadores, function(ix, embaixador) {
		var nome = embaixador.nome;
		var instituicao = embaixador.instituição;
		var localizacao = embaixador.localização;
		
		// DEFAULT LOCATION IS "0,0"
		if (localizacao != "0,0") {
			criarMarcador(nome,instituicao,localizacao);
		}
	});

	ordenarSelect('#embaixadores select');
}

// FUNCTION TO CLOSE ALL INFO WINDOWS
function closeInfoWindows() {
	$.each(markers, function(ix, marker) {
		marker.infowindow.close();
	});
}

/* FUNCTION TO CREATE A MARKET FOR A AMBASSADOR
 * @nome = The Ambassador's name.
 * @instituicao = The name of Ambassador's University.
 * @localizacao = The Ambassador's geolocation.
 */
function criarMarcador(nome,instituicao,localizacao) {

	var posicao = localizacao.split(",");
	posicao[0] = posicao[0].trim();
	posicao[1] = posicao[1].trim();

	var posicao = new GMaps.LatLng(posicao[0],posicao[1]);

	var marker = new GMaps.Marker({
		animation: GMaps.Animation.DROP,
		map: map,
		position: posicao,
		title: nome,
		icon: 'img/marker.png'
	});

	// CONVERT THE NAME OF AMBASSADOR FOR A STRING WE CAN USE IN NAME FOR OBJECT
	var nome_obj = converterNome(nome);
	// ADD THE OBJECT "MARKET" TO THE "MARKERS"
	markers[nome_obj] = marker;

	// CREATE A INFO WINDOW
	var infoWindowOpt = {
		content: nome + ".<br>Ambassador in " + instituicao
	};

	var infowindow = new GMaps.InfoWindow(infoWindowOpt);
 
	// CREATE A LISTENET EVENT TO THE CLICK IN A MARKER
	GMaps.event.addListener(marker, 'click', (function(marker, i) {
	    return function() {
	    	// CLOSE ALL THE INFO WINDOWS
	    	closeInfoWindows();

	    	// OPEN THIS INFO WINDOW
	    	marker.infowindow.open(map, marker);
	    }
	})(marker));

	// ADD THE OBJECT "INFOWINDOW" TO THE RESPECTIVE "MARKER"
	markers[nome_obj]['infowindow'] = infowindow;

	// WRITE THE HTML FOR THIS MARKER IN THE AMBASSADOR LIST	
	$('<option value="'+nome+'">'+nome+'</option>').appendTo('#embaixadores select');
}

/* FUNCTION TO ZOOM THE AMBASSADOR
 * @nome = The Ambassador's name AFTER the converterNome() function RETURN.
 */
function focarEmbaixador(nome) {
	var embaixador = markers[nome];

	// GET THE MAX ZOOM TO THIS POINT
	var maxZoom = new google.maps.MaxZoomService();
	
	// CENTER THE MAP
	map.setCenter(embaixador.position);

	// SET THE ZOOM TO MAX - 1
	maxZoom.getMaxZoomAtLatLng(embaixador.position, function(zoom){
		if (zoom.status == 'OK') {
			map.setZoom(zoom.zoom - 1);
		}
	});

	// SHOW THE INFO WINDOW
	closeInfoWindows();
	embaixador['infowindow'].open(map, embaixador);
}

/* FUNCTION TO CONVERT THE NAME OF AMBASSADOR FOR A STRING WE CAN USE IN NAME FOR OBJECT
 * @nome = Ambassador's name. It will be converted.
 */
function converterNome(nome) {
	// THE WRONG STRING
	str_original = "áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇABCDEFGHIJKLMNOPQRSTUVWXYZ";
	// THE WRITE STRING WITH THE SAME INDEXES OF WRONG STRING
	str_convertida = "aaaaaeeeeiiiiooooouuuucaaaaaeeeeiiiiooooouuuucabcdefghijklmnopqrstuvwxyz";

	var nome_convertido = "";
	var len = nome.length;

	for (var i = 0; i < len ; i++) {

		if (str_original.indexOf(nome.charAt(i)) != -1) {
			nome_convertido+=str_convertida.substr(str_original.search(nome.substr(i,1)),1);
		} else {
			nome_convertido+=nome.substr(i,1);
		}
	}

	nome_convertido = nome_convertido.replace(/ /gi,"");

	return nome_convertido;
}

/* FUNCTION TO PUT LIST IN ALPHABETICAL ORDER
 * @elemento = The node "select"
 */
function ordenarSelect(elemento) {
    var liCard = $(elemento+' option');
    var vals = [];

    for(var i = 0, l = liCard.length; i < l; i++) {
        vals.push(liCard[i].outerHTML);
    }

    vals = vals.sort();

    for(var i = 0, l = liCard.length; i < l; i++) {
        liCard[i].outerHTML = vals[i];
    } 
}

// WHEN READY
$(document).ready(function(){
	initMap();

	// READING JSON
	$.get('js/embaixadores.json', function(data){
		embaixadores = data.embaixadores;
		embaixadoresInit();
	});

	// THE HEADER
	$(".fechar-header").on('click', function(){
		if ($(".hud").is(":visible")) {
			$(".hud").hide();
			$("header").css('min-height', '0');
		} else {
			$(".hud").show();
			$("header").css('min-height', '90');
		}
	})

	$(".logo").on('click', function(event) {
		event.preventDefault();
		resetMap();
	});

	// THE MENU OF AMBASSADORS
	$("#embaixadores select").on('change', function(){
		var nome_convertido = converterNome($(this).val());
		focarEmbaixador(nome_convertido);
		$("#neutro").remove();
	})

	// AVOID TO FALL OUT THE WORLD
	GMaps.event.addListener(map, 'bounds_changed', function() {
		var actualBounds = map.getBounds();
		var actualNE = actualBounds.getNorthEast();
		var actualSW = actualBounds.getSouthWest();

		if (worldEnd.contains(actualNE) && worldEnd.contains(actualSW)) {
			lastValidBound = new GMaps.LatLngBounds(actualSW,actualNE);
		} else {
			map.fitBounds(lastValidBound);
		}
	});
});