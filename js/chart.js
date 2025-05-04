let allData = [];
let chartInstance = null;

window.onload = function () {
    moveChartLegendToTop();
    loadData();
    setupEventListeners();
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', function() {
        if (chartInstance) {
            setTimeout(rerenderActiveChart, 100);
        }
    });
};

// Fungsi untuk memindahkan chart-legend ke atas chart
function moveChartLegendToTop() {
    const chartLegend = document.getElementById('chart-legend');
    const chartContainer = document.getElementById('chart');
    
    if (chartLegend && chartContainer) {
        // Ambil parent dari chartContainer
        const parent = chartContainer.parentNode;
        
        // Sisipkan legend sebelum chart container
        parent.insertBefore(chartLegend, chartContainer);
        
        // Tambahkan sedikit margin bawah pada legend
        chartLegend.style.marginBottom = '15px';
        // Tambahkan style untuk memperjelas bahwa ini adalah judul
        chartLegend.style.fontWeight = 'bold';
        chartLegend.style.fontSize = '16px';
        chartLegend.style.textAlign = 'center';
    }
}

function loadData() {
    // Tampilkan loading
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    Papa.parse('data/googleplaystore.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function (results) {
            allData = preprocessData(results.data);
            populateCategoryOptions(allData);
            renderByCategory(); // Default chart
            
            // Sembunyikan loading setelah selesai
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        },
        error: function(error) {
            console.error('Error loading data:', error);
            if (loadingElement) {
                loadingElement.innerHTML = 'Error loading data. Please check console.';
                loadingElement.style.color = 'red';
            }
        }
    });
}

function preprocessData(data) {
    return data.filter(d =>
        d.Category && d.Rating && !isNaN(d.Rating) &&
        d.Reviews && !isNaN(d.Reviews) &&
        d.Installs && d.Installs !== '0' &&
        d.Type && (d.Type === 'Free' || d.Type === 'Paid')
    ).map(d => {
        d.Installs = parseInt(d.Installs.toString().replace(/[+,]/g, '')) || 0;
        d.Price = parseFloat(d.Price) || 0;
        d.Reviews = parseInt(d.Reviews) || 0;
        d.SizeMB = parseSizeToMB(d.Size);
        return d;
    });
}

function parseSizeToMB(size) {
    if (typeof size !== 'string') return null;
    if (size.includes('M')) {
        return parseFloat(size.replace('M', ''));
    } else if (size.includes('k')) {
        return parseFloat(size.replace('k', '')) / 1024;
    } else if (size.includes('G')) {
        return parseFloat(size.replace('G', '')) * 1024;
    } else {
        return null;
    }
}

function setupEventListeners() {
    document.getElementById('categoryBtn').addEventListener('click', renderByCategory);
    document.getElementById('ratingBtn').addEventListener('click', renderByRating);
    document.getElementById('installsBtn').addEventListener('click', renderByInstalls);
    document.getElementById('paidVsFreeBtn').addEventListener('click', renderPaidVsFree);
    document.getElementById('reviewsVsRatingBtn').addEventListener('click', renderReviewsVsRating);
    document.getElementById('sizeVsRatingBtn').addEventListener('click', renderSizeVsRating);
    document.getElementById('priceDistributionBtn').addEventListener('click', renderPriceDistribution);

    document.getElementById('limitSelect').addEventListener('change', rerenderActiveChart);
    document.getElementById('sortSelect').addEventListener('change', rerenderActiveChart);
    document.getElementById('appTypeSelect').addEventListener('change', rerenderActiveChart);
    document.getElementById('categorySelect').addEventListener('change', rerenderActiveChart);
    document.getElementById('installRange').addEventListener('change', rerenderActiveChart);
    document.getElementById('minReviewsInput').addEventListener('input', rerenderActiveChart);
    document.getElementById('sizeRangeSelect').addEventListener('change', rerenderActiveChart);
    document.getElementById('priceRangeSelect').addEventListener('change', rerenderActiveChart);
}

function rerenderActiveChart() {
    const activeId = document.querySelector('.btn.active')?.id || 'categoryBtn';
    switch (activeId) {
        case 'categoryBtn': renderByCategory(); break;
        case 'ratingBtn': renderByRating(); break;
        case 'installsBtn': renderByInstalls(); break;
        case 'paidVsFreeBtn': renderPaidVsFree(); break;
        case 'reviewsVsRatingBtn': renderReviewsVsRating(); break;
        case 'sizeVsRatingBtn': renderSizeVsRating(); break;
        case 'priceDistributionBtn': renderPriceDistribution(); break;
    }
}

function renderChart({ type = 'bar', labels, datasets, options = {} }) {
    // Ambil elemen chart
    const chartContainer = document.getElementById('chart');
    
    // Periksa apakah chartContainer ada
    if (!chartContainer) {
        console.error('Chart container tidak ditemukan');
        return;
    }
    
    // Tampilkan loading indicator
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    // Hapus semua child element dari chart container
    while (chartContainer.firstChild) {
        chartContainer.removeChild(chartContainer.firstChild);
    }
    
    // Buat elemen canvas baru untuk chart
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    // Sesuaikan tinggi canvas agar memenuhi container
    adjustChartHeight();
    
    // Dapatkan context untuk canvas yang baru dibuat
    const ctx = canvas.getContext('2d');
    
    // Hapus chart sebelumnya jika ada
    if (chartInstance) chartInstance.destroy();
    
    // Buat chart baru dengan opsi yang ditingkatkan
    chartInstance = new Chart(ctx, {
        type,
        data: { labels, datasets },
        options: {
            ...options,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...options.plugins,
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 15,
                        padding: 10,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 10
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 0,
                    bottom: 10
                }
            },
            scales: {
                ...options.scales,
                x: {
                    ...options.scales?.x,
                    ticks: {
                        ...options.scales?.x?.ticks,
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                y: {
                    ...options.scales?.y,
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
    
    // Sembunyikan loading indicator
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Fungsi untuk menyesuaikan tinggi chart
function adjustChartHeight() {
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) return;
    
    // Ambil tinggi window dan posisi container
    const windowHeight = window.innerHeight;
    const containerRect = chartContainer.getBoundingClientRect();
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const controlsHeight = document.querySelector('.controls')?.offsetHeight || 0;
    const footerHeight = document.querySelector('footer')?.offsetHeight || 0;
    const legendHeight = document.getElementById('chart-legend')?.offsetHeight || 0;
    
    // Hitung tinggi yang tersedia
    const availableHeight = windowHeight - headerHeight - controlsHeight - footerHeight - legendHeight - 40;
    
    // Setel tinggi minimal
    const minHeight = 400;
    const chartHeight = Math.max(availableHeight, minHeight);
    
    // Terapkan tinggi
    chartContainer.style.height = `${chartHeight}px`;
}

function getFilterValues() {
    return {
        limit: document.getElementById('limitSelect').value,
        sort: document.getElementById('sortSelect').value,
        appType: document.getElementById('appTypeSelect').value,
        category: document.getElementById('categorySelect').value,
        downloadMin: parseInt(document.getElementById('installRange').value),
        minReviews: parseInt(document.getElementById('minReviewsInput').value),
        sizeRange: document.getElementById('sizeRangeSelect').value,
        priceRange: document.getElementById('priceRangeSelect').value
    };
}

function setFilterVisibility(filters) {
    const ids = ['limitSortFilters', 'appTypeFilter', 'categoryFilter', 'rangeFilters', 'minReviewsFilter', 'sizeFilter', 'priceRangeFilter'];
    ids.forEach(id => {
        document.getElementById(id).style.display = filters.includes(id) ? 'inline-block' : 'none';
    });
}

function populateCategoryOptions(data) {
    const categories = [...new Set(data.map(d => d.Category))].sort();
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

function renderByCategory() {
    activateButton('categoryBtn');
    setFilterVisibility(['limitSortFilters']);

    const { limit, sort } = getFilterValues();
    const categoryCount = {};

    allData.forEach(app => {
        categoryCount[app.Category] = (categoryCount[app.Category] || 0) + 1;
    });

    let sorted = Object.entries(categoryCount).sort((a, b) =>
        sort === 'asc' ? a[1] - b[1] : b[1] - a[1]
    );

    if (limit !== 'all') sorted = sorted.slice(0, +limit);

    // Truncate long category names
    const labels = sorted.map(e => {
        const category = e[0];
        return category.length > 15 ? category.substring(0, 12) + '...' : category;
    });

    renderChart({
        type: 'bar', // We'll use Chart.js indexAxis to make it horizontal
        labels,
        datasets: [{
            label: 'Jumlah Aplikasi',
            data: sorted.map(e => e[1]),
            backgroundColor: 'teal',
            borderColor: 'rgba(0, 128, 128, 0.8)',
            borderWidth: 1
        }],
        options: { 
            responsive: true,
            indexAxis: 'y', // This is the key change that makes the bar chart horizontal
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // Menampilkan nama kategori asli di tooltip
                            const index = tooltipItems[0].dataIndex;
                            return sorted[index][0];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            }
        }
    });

    setLegend('Menampilkan kategori terpopuler berdasarkan jumlah aplikasi.');
}

function renderByRating() {
    activateButton('ratingBtn');
    setFilterVisibility(['limitSortFilters', 'appTypeFilter']);

    const { limit, sort, appType } = getFilterValues();
    const filtered = allData.filter(app =>
        (appType === 'both' || app.Type.toLowerCase() === appType.toLowerCase())
    );

    const avgRatings = {};
    const count = {};

    filtered.forEach(app => {
        if (app.Category) {
            avgRatings[app.Category] = (avgRatings[app.Category] || 0) + app.Rating;
            count[app.Category] = (count[app.Category] || 0) + 1;
        }
    });

    const result = Object.entries(avgRatings).map(([cat, total]) => [cat, total / count[cat]]);

    let sorted = result.sort((a, b) =>
        sort === 'asc' ? a[1] - b[1] : b[1] - a[1]
    );

    if (limit !== 'all') sorted = sorted.slice(0, +limit);

    // Truncate long category names
    const labels = sorted.map(e => {
        const category = e[0];
        return category.length > 15 ? category.substring(0, 12) + '...' : category;
    });

    renderChart({
        type: 'bar',
        labels,
        datasets: [{
            label: 'Rata-rata Rating',
            data: sorted.map(e => e[1]),
            backgroundColor: 'orange',
            borderColor: 'rgba(255, 165, 0, 0.8)',
            borderWidth: 1
        }],
        options: { 
            responsive: true,
            indexAxis: 'y', // Make the bar chart horizontal
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return sorted[index][0];
                        },
                        label: function(context) {
                            return `Rating: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax: 5 // Since ratings are typically up to 5
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            }
        }
    });

    setLegend('Distribusi rating aplikasi berdasarkan kategori.');
}

function renderByInstalls() {
    activateButton('installsBtn');
    setFilterVisibility(['limitSortFilters', 'appTypeFilter']);

    const { limit, sort, appType } = getFilterValues();
    const filtered = allData.filter(app =>
        (appType === 'both' || app.Type.toLowerCase() === appType.toLowerCase())
    );

    const avgInstalls = {};
    const count = {};

    filtered.forEach(app => {
        if (app.Category) {
            avgInstalls[app.Category] = (avgInstalls[app.Category] || 0) + app.Installs;
            count[app.Category] = (count[app.Category] || 0) + 1;
        }
    });

    const result = Object.entries(avgInstalls).map(([cat, total]) => [cat, total / count[cat]]);

    let sorted = result.sort((a, b) =>
        sort === 'asc' ? a[1] - b[1] : b[1] - a[1]
    );

    if (limit !== 'all') sorted = sorted.slice(0, +limit);

    // Truncate long category names
    const labels = sorted.map(e => {
        const category = e[0];
        return category.length > 15 ? category.substring(0, 12) + '...' : category;
    });

    renderChart({
        type: 'bar',
        labels,
        datasets: [{
            label: 'Rata-rata Unduhan',
            data: sorted.map(e => e[1]),
            backgroundColor: 'purple',
            borderColor: 'rgba(128, 0, 128, 0.8)',
            borderWidth: 1
        }],
        options: { 
            responsive: true,
            indexAxis: 'y', // Make the bar chart horizontal
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return sorted[index][0];
                        },
                        label: function(context) {
                            return `Unduhan: ${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            }
        }
    });

    setLegend('Kategori dengan rata-rata unduhan tertinggi.');
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

function renderPaidVsFree() {
    activateButton('paidVsFreeBtn');
    setFilterVisibility(['categoryFilter', 'rangeFilters']);

    const { category, downloadMin } = getFilterValues();
    const filtered = allData.filter(app =>
        app.Category === category && app.Installs >= downloadMin
    );

    const grouped = { Free: [], Paid: [] };
    filtered.forEach(app => {
        if (app.Type && (app.Type === 'Free' || app.Type === 'Paid')) {
            grouped[app.Type].push(app.Rating);
        }
    });

    const avgFree = average(grouped.Free);
    const avgPaid = average(grouped.Paid);
    const countFree = grouped.Free.length;
    const countPaid = grouped.Paid.length;

    renderChart({
        labels: ['Free', 'Paid'],
        datasets: [{
            label: 'Rata-rata Rating',
            data: [avgFree, avgPaid],
            backgroundColor: ['rgba(0, 128, 0, 0.7)', 'rgba(255, 0, 0, 0.7)'],
            borderColor: ['green', 'red'],
            borderWidth: 1
        }],
        options: { 
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const count = context.dataIndex === 0 ? countFree : countPaid;
                            return [
                                `Rating: ${context.raw.toFixed(2)}`,
                                `Jumlah Aplikasi: ${count}`
                            ];
                        }
                    }
                }
            }
        }
    });

    setLegend(`Perbandingan rating antara aplikasi Free dan Paid di kategori ${category}.`);
}

function renderReviewsVsRating() {
    activateButton('reviewsVsRatingBtn');
    setFilterVisibility(['minReviewsFilter']);

    const { minReviews } = getFilterValues();
    const data = allData.filter(app => app.Reviews >= minReviews);

    renderChart({
        type: 'scatter',
        labels: data.map(d => d.App),
        datasets: [{
            label: 'Review vs Rating',
            data: data.map(app => ({ x: app.Reviews, y: app.Rating })),
            backgroundColor: 'rgba(0, 0, 255, 0.6)',
            pointRadius: 4,
            pointHoverRadius: 6,
        }],
        options: {
            responsive: true,
            scales: {
                x: { 
                    type: 'logarithmic', 
                    title: { text: 'Jumlah Ulasan (log scale)', display: true },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                y: { 
                    title: { text: 'Rating', display: true },
                    min: 1,
                    max: 5
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return data[index].App;
                        },
                        label: function(context) {
                            const app = data[context.dataIndex];
                            return [
                                `Rating: ${app.Rating}`,
                                `Reviews: ${formatNumber(app.Reviews)}`,
                                `Category: ${app.Category}`
                            ];
                        }
                    }
                }
            }
        }
    });

    setLegend('Hubungan antara jumlah ulasan dan rating.');
}

function renderSizeVsRating() {
    activateButton('sizeVsRatingBtn');
    setFilterVisibility(['sizeFilter']);

    const { sizeRange } = getFilterValues();
    const [minSize, maxSize] = sizeRange === 'all' ? [0, Infinity] :
        sizeRange === '100+' ? [100, Infinity] : sizeRange.split('-').map(Number);

    const filtered = allData.filter(app =>
        app.SizeMB !== null && app.SizeMB >= minSize && app.SizeMB <= maxSize
    );

    renderChart({
        type: 'scatter',
        labels: filtered.map(d => d.App),
        datasets: [{
            label: 'Size vs Rating',
            data: filtered.map(app => ({ x: app.SizeMB, y: app.Rating })),
            backgroundColor: 'rgba(255, 140, 0, 0.6)',
            pointRadius: 4,
            pointHoverRadius: 6,
        }],
        options: {
            responsive: true,
            scales: {
                x: { 
                    type: 'linear', 
                    title: { text: 'Ukuran Aplikasi (MB)', display: true } 
                },
                y: { 
                    title: { text: 'Rating', display: true },
                    min: 1,
                    max: 5
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return filtered[index].App;
                        },
                        label: function(context) {
                            const app = filtered[context.dataIndex];
                            return [
                                `Rating: ${app.Rating}`,
                                `Size: ${app.SizeMB.toFixed(1)} MB`,
                                `Category: ${app.Category}`
                            ];
                        }
                    }
                }
            }
        }
    });

    setLegend('Hubungan antara ukuran aplikasi dan rating.');
}

function renderPriceDistribution() {
    activateButton('priceDistributionBtn');
    setFilterVisibility(['categoryFilter', 'priceRangeFilter']);

    const { category, priceRange } = getFilterValues();
    const [minP, maxP] = priceRange === 'all' ? [0, Infinity] :
        priceRange === '50+' ? [50, Infinity] : priceRange.split('-').map(Number);

    const data = allData.filter(app =>
        app.Type === 'Paid' && app.Category === category &&
        app.Price >= minP && app.Price <= maxP
    );

    // Lebih banyak bin untuk distribusi yang lebih halus
    const maxPrice = Math.ceil(Math.max(...data.map(app => app.Price)));
    const binSize = maxPrice > 50 ? 5 : maxPrice > 20 ? 2 : 1;
    const bins = {};

    data.forEach(app => {
        const binIndex = Math.floor(app.Price / binSize) * binSize;
        bins[binIndex] = (bins[binIndex] || 0) + 1;
    });

    const labels = Object.keys(bins).sort((a, b) => a - b).map(p => 
        `$${p}-$${Number(p) + binSize}`
    );

    const values = labels.map((_, i) => {
        const binIndex = Number(Object.keys(bins).sort((a, b) => a - b)[i]);
        return bins[binIndex] || 0;
    });

    renderChart({
        type: 'bar',
        labels,
        datasets: [{
            label: 'Jumlah Aplikasi',
            data: values,
            backgroundColor: 'rgba(128, 128, 128, 0.7)',
            borderColor: 'rgba(70, 70, 70, 0.9)',
            borderWidth: 1
        }],
        options: { 
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Jumlah Aplikasi: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });

    setLegend(`Distribusi harga aplikasi berbayar di kategori ${category}.`);
}

function activateButton(id) {
    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function setLegend(text) {
    const legendElement = document.getElementById('chart-legend');
    if (legendElement) {
        legendElement.textContent = text;
    } else {
        console.warn('Elemen legend tidak ditemukan');
    }
}

function average(arr) {
    return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}