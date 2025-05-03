// Variables to store state
let playStoreData = [];
let chartType = 'category';
let limit = 15;
let sortOrder = 'desc';
let downloadRange = '1+';
let ratingRange = 3.0;
let tooltip;

// Initialize after page loaded
document.addEventListener('DOMContentLoaded', function () {
    // Setup event listeners for controls
    document.getElementById('categoryBtn').addEventListener('click', function () {
        setActiveChart('category');
        setActiveButton(this);
        updateFilters('category');
    });

    document.getElementById('ratingBtn').addEventListener('click', function () {
        setActiveChart('rating');
        setActiveButton(this);
        updateFilters('rating');
    });

    document.getElementById('installsBtn').addEventListener('click', function () {
        setActiveChart('installs');
        setActiveButton(this);
        updateFilters('installs');
    });

    document.getElementById('paidVsFreeBtn').addEventListener('click', function () {
        setActiveChart('paidvsfree');
        setActiveButton(this);
        updateFilters('paidvsfree');
    });

    document.getElementById('limitSelect').addEventListener('change', function () {
        limit = this.value === 'all' ? null : parseInt(this.value);
        renderChart();
    });

    document.getElementById('sortSelect').addEventListener('change', function () {
        sortOrder = this.value;
        renderChart();
    });

    // NEW: Event listeners for download and rating range
    document.getElementById('installRange').addEventListener('change', function () {
        downloadRange = this.value;
        renderChart();
    });

    document.getElementById('ratingRange').addEventListener('change', function () {
        ratingRange = parseFloat(this.value);
        renderChart();
    });

    tooltip = d3.select("#tooltip");

    loadData();
});

function setActiveButton(button) {
    document.querySelectorAll('.control-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

function setActiveChart(type) {
    chartType = type;
    renderChart();
}

// Show/hide filters depending on selected chart type
function updateFilters(type) {
    const limitSortFilters = document.getElementById('limitSortFilters');
    const rangeFilters = document.getElementById('rangeFilters');

    if (type === 'category' || type === 'installs') {
        limitSortFilters.style.display = 'flex';
        rangeFilters.style.display = 'none';
    } else if (type === 'rating' || type === 'paidvsfree') {
        limitSortFilters.style.display = 'none';
        rangeFilters.style.display = 'flex';
    }
}

function loadData() {
    Papa.parse('data/googleplaystore.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            playStoreData = results.data;

            playStoreData.forEach(d => {
                if (typeof d.Rating === 'string') d.Rating = parseFloat(d.Rating);
                if (typeof d.Reviews === 'string') d.Reviews = parseInt(d.Reviews.replace(/,/g, ''));
                if (typeof d.Installs === 'string') {
                    d.Installs = parseInt(d.Installs.replace(/[+,]/g, '')) || 0;
                }
            });

            document.querySelector('.loading').style.display = 'none';
            renderChart();
        },
        error: function (error) {
            document.querySelector('.loading').style.display = 'none';
            document.getElementById('chart').innerHTML =
                '<div class="error">Failed to load data. Please check if the CSV file is accessible.</div>';
        }
    });
}

function renderChart() {
    document.getElementById('chart').innerHTML = '';

    const width = document.getElementById('chart').clientWidth;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 80, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    let processedData;
    let legendText;

    if (chartType === 'category') {
        const categoryCount = d3.rollup(playStoreData, v => v.length, d => d.Category);
        processedData = Array.from(categoryCount, ([key, value]) => ({ key, value }));
        legendText = `Showing ${limit ? `top ${limit}` : 'all'} categories by number of apps in the Google Play Store.`;

    } else if (chartType === 'rating') {
        const minInstalls = parseInt(downloadRange.replace('+', '')) || 0;

        const filteredData = playStoreData.filter(d => {
            return !isNaN(d.Rating) && d.Rating >= ratingRange && d.Installs >= minInstalls;
        });

        const categoryRatings = d3.rollup(
            filteredData,
            v => d3.mean(v, d => d.Rating),
            d => d.Category
        );
        processedData = Array.from(categoryRatings, ([key, value]) => ({ key, value }));
        legendText = `Showing average ratings by category with at least ${downloadRange} installs and rating ≥ ${ratingRange}.`;

    } else if (chartType === 'installs') {
        const categoryInstalls = d3.rollup(
            playStoreData.filter(d => !isNaN(d.Installs)),
            v => d3.sum(v, d => d.Installs),
            d => d.Category
        );
        processedData = Array.from(categoryInstalls, ([key, value]) => ({ key, value }));
        legendText = `Showing ${limit ? `top ${limit}` : 'all'} categories by total installations.`;

    } else if (chartType === 'paidvsfree') {
        const typeRatings = d3.rollup(
            playStoreData.filter(d => (d.Type === 'Free' || d.Type === 'Paid') && !isNaN(d.Rating)),
            v => d3.mean(v, d => d.Rating),
            d => d.Type
        );
        processedData = Array.from(typeRatings, ([key, value]) => ({ key, value }));
        legendText = `Comparing average app ratings between Free and Paid apps.`;
    }

    if (processedData && chartType !== 'paidvsfree') {
        processedData.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
        if (limit) processedData = processedData.slice(0, limit);
    }

    document.getElementById('chart-legend').textContent = legendText;

    const xScale = chartType === 'paidvsfree'
        ? d3.scaleBand().domain(processedData.map(d => d.key)).range([0, innerWidth]).padding(0.2)
        : d3.scaleLinear().domain([0, d3.max(processedData, d => d.value) * 1.1]).range([0, innerWidth]);

    const yScale = chartType === 'paidvsfree'
        ? d3.scaleLinear().domain([0, d3.max(processedData, d => d.value)]).range([innerHeight, 0])
        : d3.scaleBand().domain(processedData.map(d => d.key)).range([0, innerHeight]).padding(0.2);

    if (chartType === 'paidvsfree') {
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale));
        g.append('g')
            .call(d3.axisLeft(yScale));
    } else {
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d3.format(chartType === 'rating' ? '.1f' : ',')(d)));
        g.append('g')
            .call(d3.axisLeft(yScale));
    }

    g.selectAll('.bar')
        .data(processedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => chartType === 'paidvsfree' ? xScale(d.key) : 0)
        .attr('y', d => chartType === 'paidvsfree' ? yScale(d.value) : yScale(d.key))
        .attr('width', d => chartType === 'paidvsfree' ? xScale.bandwidth() : xScale(d.value))
        .attr('height', d => chartType === 'paidvsfree' ? innerHeight - yScale(d.value) : yScale.bandwidth())
        .attr('fill', '#4551FC')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('fill', '#FF8D58');
            tooltip
                .style('opacity', 1)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .html(`
                    <h4>${d.key}</h4>
                    <p><strong>Value:</strong> ${d3.format('.2f')(d.value)}</p>
                `);
        })
        .on('mouseout', function () {
            d3.select(this).attr('fill', '#4551FC');
            tooltip.style('opacity', 0);
        });

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Space Grotesk, sans-serif')
        .attr('fill', '#4551FC')
        .text(() => {
            if (chartType === 'category') return 'Most Popular Categories';
            if (chartType === 'rating') return 'Average Rating by Category';
            if (chartType === 'installs') return 'Total Installs by Category';
            if (chartType === 'paidvsfree') return 'Paid vs Free App Ratings';
        });
}
