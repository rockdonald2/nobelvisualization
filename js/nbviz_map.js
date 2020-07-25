(function (nbviz) {
    'use strict';

    // a konténer méretei, valamint az SVG kontextus hozzáadása a DOM-hoz
    const mapContainer = d3.select('#nobel-map');
    const boundingRect = mapContainer.node().getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;

    const svg = mapContainer.append('svg').attr('height', height).attr('width', width);

    // a scalefaktor lineárisan megfelel a kivetített pontok közötti távolsággal,
    // alapértelmezetten a magasság 480, míg a scalefaktor 153, a mi scalefaktorunk ennél nagyobb 193, és a magasságunk kisebb,
    // így kissé felnagyítsa ez a beállítás a térképet
    // a center a térképünk középpontját határozza meg, 15fok keletre és 15fok északra
    // a translate a projection középpontjának pixelkoordinátáit határozza meg, az alapértelmezett a 480 és 250
    // a precision az adaptive samplinget állítsa be
    const projection = d3.geoEquirectangular().scale(193 * (height / 480)).center([15, 15])
        .translate([width / 2, height / 2]).precision(.1);

    const path = d3.geoPath().projection(projection);

    // 20 fokonként fognak a hálórácsok elhelyezkedni, nem az alapértelmezett 10-esével
    const graticule = d3.geoGraticule().step([20, 20]);

    // kiválasztottuk a projection-t, létrehoztuk a path-et a kiválasztott projection-el, valamint hozzáadtuk a graticule-t is
    // a projection azt határozza meg, hogyan jelenítsük meg a térképet
    // a path a megjelenítésnek megfelelően fogja a JSON állomány koordinátáit SVG path-kké alakítani
    // a graticule a hálót adja hozzá a térképhez a path-nek megfelelően

    // datum(graticule) == datum([graticule])
    svg.append('path').datum(graticule)
        .attr('class', 'graticule').attr('d', path);

    const radiusScale = d3.scaleSqrt().range([nbviz.MIN_CENTROID_RADIUS, nbviz.MAX_CENTROID_RADIUS]);

    // egy objektum, amellyel az országnévnek egy GeoJSON objektumot feleltetünk meg
    const cnameToCountry = {};

    const getCentroid = function (d) {
        const latlng = nbviz.data.countryData[d.name].latlng;
        return projection([latlng[1], latlng[0]]); // átalakítjuk a megszerzett koordinátákat SVG koordinátákká a projection-nek megfelelően
    }

    nbviz.initMap = function(world, countryNames) {
        // kinyerjük a földrészeket
        const land = topojson.feature(world, world.objects.land);
        // kinyerjük az országokat, arra használjuk a features mezőt, hogy kinyerjük a FeatureCollection egyenkénti Feature-jeit, mint tömb
        const countries = topojson.feature(world, world.objects.countries).features;
        // kinyerjük a határokat
        // amennyiben az a és b mértani objektum nem egyezik meg, abban az esetben közös határról beszélhetünk
        // amennyiben megegyezik, akkor külső határról
        const borders = topojson.mesh(world, world.objects.countries, function(a, b) {
            return a !== b;
        });

        // hozzáadja a világtérképet
        svg.insert('path', '.graticule').datum(land).attr('class', 'land').attr('d', path);

        // országpath-ek
        svg.insert('g', '.graticule').attr('class', 'countries');

        // az értékindikátorok, amelyek az ország nyerteseit fogják jelölni == piros körök
        svg.insert('g').attr('class', 'centroids');

        // határvonalak
        svg.insert('path', '.graticule') // beilleszti a graticule class-al rendelkező tag elé
            .datum(borders).attr('class', 'boundary').attr('d', path);

        // országnévnek GeoJSON shape-t megfeleltetni
        const idToCountry = {};

        countries.forEach(function (c) {
            idToCountry[c.id] = c;
        });

        countryNames.forEach(function (n) {
            cnameToCountry[n.name] = idToCountry[n.id];
        });

        // tehát, a fenti objektum, egy adott országnévnek megfelelteti a GeoJSON shape-jét
        // ez azt jelenti, hogy ha beadjuk például Ausztráliát, visszatéríti annak a GeoJSON megfelelőjét
    }

    const tooltip = d3.select('#map-tooltip');

    nbviz.updateMap = function (countryData) {
        const mapData = countryData.filter(function (d) {
            return d.value > 0;
        })
        .map(function (d) {
            return {
                geo: cnameToCountry[d.key],
                name: d.key,
                number: d.value,
                population: d.population
            };
        });

        const maxWinners = d3.max(mapData.map(function (d) {
            return d.number;
        }));

        // 0 és maxWinners közötti tartományra 2px és 30px közötti sugárt fog megfeleltetni
        radiusScale.domain([0, maxWinners]);

        const countries = svg.select('.countries').selectAll('.country').data(mapData, function (d) {
            return d.name;
        });

        countries.enter().append('path').attr('class', 'country').on('mouseenter', function(d) {
            const country = d3.select(this);

            // ne csináljon semmit, ha az adott ország nem látható
            if (!country.classed('visible')) { return; }

            // megszerezzük az adott ország adatobjektumát
            const cData = country.datum();

            const winnerValue = (nbviz.valuePerCapita) ? Math.floor(cData.number * cData.population) : cData.number;

            // ha csak 1 győztes van az adott országban
            const prize_string = (cData.number === 1) ? ' prize in ' : ' prizes in ';

            // beállítja a tooltip kategóriájának színét
            const textColor = (nbviz.activeCategory === nbviz.ALL_CATS) ? 'goldenrod' : nbviz.categoryFill(nbviz.activeCategory);

            // beállítjuk a tooltip fejlécét és szövegét
            tooltip.select('h2').text(cData.name);
            tooltip.select('p').text(winnerValue + prize_string + nbviz.activeCategory).style('color', textColor);

            // beállítja a tooltip keretszínét, a kategóriának megfelelően
            /* const borderColor = (nbviz.activeCategory === nbviz.ALL_CATS) ? 'goldenrod' : nbviz.categoryFill(nbviz.activeCategory);

            tooltip.style('border-color', borderColor); */

            const mouseCoords = d3.mouse(this);

            const w = parseInt(tooltip.style('width'));
            const h = parseInt(tooltip.style('height'));
            tooltip.style('top', (mouseCoords[1] - h) + 'px');
            tooltip.style('left', (mouseCoords[0] - w / 2) + 'px');

            d3.select(this).classed('active', true);
        }).on('mouseout', function (d) {
            tooltip.style('left', '-9999px');

            d3.select(this).classed('active', false);
        })
        .merge(countries)
        .attr('name', function (d) {
            return d.name;
        }).classed('visible', true)
        .transition().duration(nbviz.TRANS_DURATION)
        .style('opacity', 1)
        .attr('d', function (d) {
            return path(d.geo);
        });

        countries.exit().classed('visible', false).transition().duration(nbviz.TRANS_DURATION).style('opacity', 0);

        const centroids = svg.select('.centroids').selectAll('.centroid').data(mapData, function (d) {
            return d.name;
        });

        // beállítja a centroid színet kategóriának megfelelően
        const centroidColor = (nbviz.activeCategory === nbviz.ALL_CATS) ? 'goldenrod' : nbviz.categoryFill(nbviz.activeCategory);

        centroids.enter().append('circle').attr('class', 'centroid').merge(centroids)
            .attr('name', function (d) {
                return d.name;
            })
            .attr('cx', function (d) {
                return getCentroid(d)[0];
            })
            .attr('cy', function (d) {
                return getCentroid(d)[1];
            })
            .classed('active', function (d) {
                return d.name === nbviz.activeCountry;
            })
            .transition().duration(nbviz.TRANS_DURATION)
            .style('opacity', 1)
            .attr('r', function (d) {
                return radiusScale(+d.number)
            }).style('fill', centroidColor);

        centroids.exit().transition().duration(nbviz.TRANS_DURATION).style('opacity', 0);
    };

} (window.nbviz = window.nbviz || {}));