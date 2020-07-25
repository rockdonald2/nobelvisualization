(function (nbviz) {
    'use strict';

    nbviz.updateList = function (winnersData) {
        let rows, cells;

        // rendezi a győztes adatokat év szerint
        const data = winnersData.sort(function (a, b) {
            return +b.year - +a.year;
        });

        // hozzáköti a győztes adatokat a táblasorokhoz
        rows = d3.select('#nobel-list tbody').selectAll('tr').data(data);

        // a törlendő sorok először elhalványulnak, majd törlődnek
        rows.exit().transition().duration(nbviz.TRANS_DURATION).style('opacity', 0).remove();

        // hozzáadjuk az új sorokat, valamint egy eventListener-t is
        rows.enter().append('tr').on('click', function (d) {
            nbviz.displayWinner(d);
        });

        // feltöltjük a sorokat adatokkal
        cells = d3.selectAll('#nobel-list tbody tr').selectAll('td').data(function (d) {
            return [d.year, d.category, d.name];
        });

        cells.enter().append('td').merge(cells).text(function (d) {
            return d;
        });

        // ha nincs kiválasztva jelenleg győztes a listából, akkor random mutasson egyet
        // a cover arra az esetre van, ha nincs győztes a kritériumoknak megfelelően
        if (data.length) {
            d3.select('#nobel-winner .cover').style('display', 'none');
            nbviz.displayWinner(data[Math.floor(Math.random() * data.length)]);
        } else {
            d3.select('#nobel-winner .cover').style('display', 'flex');
        }
    }

    nbviz.displayWinner = function (wData) {
        const nw = d3.select('#nobel-winner');

        nw.select('#winner-title').text(wData.name);

        nw.selectAll('.property span').text(function (d) {
            const property = d3.select(this).attr('name');
            return wData[property];
        });

        nw.select('#biobox').html(wData.mini_bio);

        if (wData.bio_image) {
            nw.select('#picbox img').attr('src', 'images/' + wData.bio_image).style('display', 'inline');
        } else {
            nw.select('#picbox img').style('display', 'none');
        }

        nw.select('#readmore a').attr('href', 'https://en.wikipedia.org/wiki/' + wData.name)
    }

}(window.nbviz = window.nbviz || {}));