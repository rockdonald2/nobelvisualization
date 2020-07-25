(function (nbviz) {
    'use strict';

    const chartHolder = d3.select('#nobel-time');
    const margin = {
        top: 0,
        right: 20,
        bottom: 50,
        left: 40
    };

    const boundingRect = chartHolder.node().getBoundingClientRect();
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    const svg = chartHolder.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const MAX_WINNERS_PER_YEAR = 15
    const xScale = d3.scaleBand().range([0, width]).padding(0.1).domain(d3.range(1900, 2021));
    const yScale = d3.scalePoint().range([height, 60]).domain(d3.range(MAX_WINNERS_PER_YEAR));

    const xAxis = d3.axisBottom().scale(xScale).tickValues(xScale.domain().filter(function (d, i) {
        return !(d % 10);
    }));

    setTimeout(function () {
        svg.append('g').attr('class', 'xaxis').attr('transform', 'translate(0,' + height + ')')
            .call(xAxis).call(function (g) {
                return g.select('.domain').remove();
            }).selectAll('text').style('text-anchor', 'end').attr('dx', '-.8em').attr('dy', '.15em')
            .attr('transform', 'rotate(-65)').style('font-size', '1.2rem');

        const catLabels = chartHolder.select('svg').append('g')
            .attr('transform', 'translate(10, 10)').attr('class', 'labels')
            .selectAll('label').data(nbviz.CATEGORIES)
            .enter().append('g').attr('transform', function (d, i) {
                return 'translate(0,' + i * 16 + ')';
            });

        catLabels.append('circle')
            .attr('fill', nbviz.categoryFill)
            .attr('r', xScale.bandwidth() / 1.5);

        catLabels.append('text')
            .text(function (d) {
                return d;
            })
            .attr('dy', '.4em')
            .attr('x', 10)
            .style('font-size', '1.3rem');
    }, nbviz.TRANS_DURATION);

    const tooltip = d3.select('#time-tooltip');
    const tooltipHeader = tooltip.select('h2');
    const tooltipWrapper = tooltip.select('.wrapper');

    nbviz.updateTimeChart = function (data) {
        data.forEach(function (d) {
            d.values.sort(function (a, b) {
                if (a.category < b.category) {
                    return -1;
                } else if (a.category > b.category) {
                    return 1;
                }

                return 0;
            });
        });

        data.sort(function (a, b) {
            return b.key - a.key;
        });

        // hozzákössük az adatot a neki megfelelő évoszlopnak, nem index, hanem év szerint, így az esetleges
        // hézagok nem okoznak megjelenítésbeli hibákat, amikoris az index megváltozik
        const years = svg.selectAll('.year')
            .data(data, function (d) {
                return d.key;
            });

        // a hozzákötött adatoknak megfelelően létrehozzuk az oszlopokat
        years.enter().append('g').on('mouseenter', function (d) {
                const year = d3.select(this);

                const yData = year.datum();

                const winners = {
                    'Physiology or Medicine': 0,
                    'Chemistry': 0,
                    'Physics': 0,
                    'Peace': 0,
                    'Literature': 0,
                    'Economics': 0
                };

                yData.values.forEach(function (data) {
                    winners[data.category] += 1;
                });

                tooltipHeader.text(yData.key);

                nbviz.CATEGORIES.forEach(function (c) {
                    let p = tooltipWrapper.append('p');

                    p.html('<span class="time-tooltip-circle" style="background-color:' + ((winners[c] == 0) ? '#999' : nbviz.categoryFill(c)) + '"></span>' +
                        winners[c] + ' ' + c);

                    if (winners[c] == 0) {
                        p.classed('empty', true);
                    } else {
                        p.classed('empty', false);
                    }
                });

                const mouseCoords = d3.mouse(d3.select('#nobel-time').node());

                const w = parseInt(tooltip.style('width'));
                const h = parseInt(tooltip.style('height'));

                if (mouseCoords[0] < w) {
                    tooltip.style('left', (mouseCoords[0]) + 'px');
                } else {
                    tooltip.style('left', (mouseCoords[0] - w) + 'px');
                }

                tooltip.style('top', (mouseCoords[1] - h * 1.25) + 'px');
            }).on('mouseout', function (d) {
                tooltipWrapper.selectAll('*').remove();
                tooltip.style('left', '-9999px');
            })
            .classed('year', true)
            .merge(years)
            .attr('name', function (d) {
                return d.key;
            })
            .attr('transform', function (year) {
                return "translate(" + xScale(+year.key) + ",-5)"; // azért használjuk a +year-t, hogy átalakítsuk az str-t int-té
            });

        // töröl minden olyan évoszlopot, amelyhez nem került adat hozzákötésre
        years.exit().remove();

        const winners = svg.selectAll('.year').selectAll('.winner').data(function (d) {
            return d.values;
        }, function (d) {
            return d.name;
        });

        /* a merge függvényre azért van szükség, mert ötvözi a winners és a winners.enter() szelekciókat
            alapvetően, úgy lehet felfogni, hogy a merge metódus előtti attribútumok az újonnan hozzáadott DOM elemekre lesznek applikálva,
            míg az az utániak a meglévőkre is, az újak mellett
            más alakban írva akár felfogható a merge, mint: (winners.enter()).merge(winners) */

        winners.enter().append('circle').classed('winner', true)
            .attr('fill', function (d) {
                return nbviz.categoryFill(d.category);
            })
            .attr('cy', height)
            .attr('cx', xScale.bandwidth() / 2)
            .attr('r', xScale.bandwidth() / 2)
            .merge(winners)
            .transition().duration(nbviz.TRANS_DURATION)
            .attr('cy', function (d, i) {
                return yScale(i);
            });

        winners.exit().remove();
    };

}(window.nbviz = window.nbviz || {}));