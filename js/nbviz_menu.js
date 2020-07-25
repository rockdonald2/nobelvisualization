(function (nbviz) {
    'use strict';

    const catList = [nbviz.ALL_CATS].concat(nbviz.CATEGORIES);
    const catSelect = d3.select('#cat-select select');

    catSelect.selectAll('option').data(catList).enter().append('option').attr('value', function (d) {
        return d;
    }).html(function (d) {
        return d;
    });

    catSelect.on('change', function (d) {
        const category = d3.select(this).property('value');
        nbviz.filterByCategory(category);
        nbviz.onDataChange();
    });

    d3.select('#gender-select select').on('change', function (d) {
        const gender = d3.select(this).property('value');

        if (gender == 'All') {
            nbviz.genderDim.filter(); // visszaállítja a szűrő nélküli állapotot
        } else {
            nbviz.genderDim.filter(gender);
        }

        nbviz.onDataChange();
    });

    nbviz.initMenu = function () {
        const ALL_WINNERS = 'All Winners';
        const SINGLE_WINNERS = 'Single Winning Countries';
        const DOUBLE_WINNERS = 'Double Winning Countries';

        // létrehozzuk az országcsoportokat, ahol mindenik tömbelemnek van egy key és egy value property-je, csökkenő sorrend
        const nats = nbviz.countryDim.group().all().sort(function (a, b) {
            return b.value - a.value;
        });

        // nyilván tartjuk a keveset nyert országokat
        let fewWinners = {
            1: [],
            2: []
        };
        let selectData = [ALL_WINNERS];

        // hozzáadjuk a selectData-hez azokat, ahol min. 3 győztes volt,
        // hozzáadjuk a fewWinners-hez azokat, ahol max. 2 győztes volt, a megfelelő mezőhöz
        nats.forEach(function (o) {
            if (o.value >= 3) {
                selectData.push(o.key);
            } else {
                fewWinners[o.value].push(o.key);
            }
        });

        selectData.push(DOUBLE_WINNERS, SINGLE_WINNERS);

        const countrySelect = d3.select('#country-select select');

        countrySelect.selectAll('option').data(selectData).enter().append('option').attr('value', function (d) {
            return d;
        }).html(function (d) {
            return d;
        });

        countrySelect.on('change', function (d) {
            let countries;

            let country = d3.select(this).property('value');

            if (country === ALL_WINNERS) {
                countries = [];
            } else if (country === DOUBLE_WINNERS) {
                countries = fewWinners[2];
            } else if (country === SINGLE_WINNERS) {
                countries = fewWinners[1];
            } else {
                countries = [country];
            }

            nbviz.filterByCountries(countries);
            nbviz.onDataChange();
        });

        d3.selectAll('#metric-radio input').on('change', function () {
            const val = d3.select(this).property('value');
            nbviz.valuePerCapita = parseInt(val);
            nbviz.onDataChange();
        });
    }
}(window.nbviz = window.nbviz || {}));