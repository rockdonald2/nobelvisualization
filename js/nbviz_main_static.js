d3.queue()
    /* a statikus fájlok magukba foglalnak egy világtérképet, némi országadatot, 
    valamint egy dinamikus lehívást a Python Eve RESTful API-nkon keresztül a győztes-adatokra, kihagyva az életrajzot */
    .defer(d3.json, "data/world-110m.json")
    .defer(d3.csv, "data/world-country-names-nobel.csv")
    /* a fenti egy topojson-nál megkapható térkép, 1:110millióhoz skálával */
    .defer(d3.json, "data/winning_country_data.json")
    .defer(d3.json, "data/winners.json")
    .await(ready);

function ready(error, worldMap, countryNames, countryData, winnersData) {
    // mindig az oldal tetején tölt be
    window.scrollTo(0, 0);

    // logulunk bármiféle hibát a console-ra
    if (error) {
        return console.warn(error);
    }

    // tároljuk az országadat adatsorunkat
    nbviz.data.countryData = countryData;
    // létrehozzuk a szűrönket és annak dimenzióit
    nbviz.makeFilterAndDimensions(winnersData);
    // inicializáljuk a menüt és a térképet
    nbviz.initMenu();
    nbviz.initMap(worldMap, countryNames);
    // triggereljük a frissítést a teljes győztes adatsorral
    nbviz.onDataChange();

    // eltűntetjük a betöltést
    setTimeout(function () {
        d3.select('.loading').attr('class', 'loaded');
        d3.select('body').attr('class', '');
    }, 3000);
}