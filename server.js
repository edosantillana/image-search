
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var googleImages = require('google-images');
var path = require('path');

var port = process.env.PORT || 8080;
var dburl = process.env.MONGOLAB_URI;
var cx = process.env.cx;
var apiKey = process.env.apiKey;
var client = new googleImages(cx, apiKey);
var searches = null;

var app = express();

app.use('/', express.static(path.join(__dirname, 'public')));

app.get("/api/imagesearch/:search", (req, res) => {

	var search = req.params.search;
	var offset = req.query.offset ? req.query.offset : 1;
	var term = decodeURIComponent(search);
	var when = new Date();

  	//Las primeras 10 imágenes
	client.search(search, {page: offset}).then (images => {
		if(images.length > 0) {
			MongoClient.connect(dburl, function(err,db) {
				searches = db.collection('searches');
				if (err) {
					console.error(err);
					return res.status(500).end(err.message);
				} else {
					searches.insert([{term: term, when: when}], () => {
						db.close();
						res.json(images.map(resultToImage));
					});
				}
			});
		}
	});

});

app.get("/api/latest/imagesearch/", (req, res) => {
	
	MongoClient.connect(dburl, (err,db) => {
		searches = db.collection('searches');
		//Últimas búsquedas
		searches.find().limit(10).sort({when: -1}).toArray((err, results) => {
			if (err) {
				console.error(err);
				return res.status(500).end(err.message);
			}
			res.json(results.map((d) => {
				return {
					term: d.term,
					when: d.when
				}
			}));
		});
	});

});

function resultToImage(item) {
	return {
		url:       item.url,
		snippet:   item.description,
		thumbnail: item.thumbnail.url,
		context:   item.parentPage
	}
}

MongoClient.connect(dburl, (err, res) => {
	if (err) {
		return console.log(`Error al conectar a la base de datos: ${err}`)
	}
	console.log('Conexión a la base de datos establecida...')
});

app.listen(port, () => {
	console.log('Corriendo en puerto: ' + port);
});
