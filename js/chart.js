// Variabel state untuk menyimpan data dan grafik aktif
let data = [];
let activeChart = "lineChart";
let svg, tooltip;

// Inisialisasi setelah halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    // Setup event listener untuk tombol
    document
        .getElementById("lineChartBtn")
        .addEventListener("click", function () {
            setActiveChart("lineChart");
            this.classList.add("active");
            document.getElementById("barChartBtn").classList.remove("active");
        });

    document
        .getElementById("barChartBtn")
        .addEventListener("click", function () {
            setActiveChart("barChart");
            this.classList.add("active");
            document.getElementById("lineChartBtn").classList.remove("active");
        });

    // Inisialisasi tooltip
    tooltip = d3.select("#tooltip");

    // Muat data dari CSV
    loadData();
});

// Fungsi untuk memuat data dari CSV
function loadData() {
    d3.csv("data/googleplaystore.csv")
        .then(function (csvData) {
            // Konversi string menjadi angka untuk data numerik
            csvData.forEach((d) => {
                d.Rating = +d.Rating;
                d.Reviews = +d.Reviews;
                d.Size = +d.Size;
                d.Installs = +d.Installs;
                d.Price = +d.Price;
                d.Current_Ver = +d.Current_Ver;
            });

            data = csvData;
            processData();
        })
        .catch((error) => {
            console.error("Error loading CSV:", error);
            showError(
                "Gagal memuat file CSV. Pastikan file vgsales_clean.csv tersedia di folder yang sama dengan file HTML ini."
            );
        });
}

// Fungsi untuk menampilkan pesan error
function showError(message) {
    document.querySelector(".loading").style.display = "none";
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    document.getElementById("chart-container").appendChild(errorDiv);
}

// Fungsi untuk memproses data
function processData() {
    // Hapus pesan loading
    document.querySelector(".loading").style.display = "none";

    // Render grafik default (Line Chart)
    renderChart();
}

// Fungsi untuk mengatur grafik aktif dan merender ulang
function setActiveChart(chartType) {
    activeChart = chartType;
    renderChart();
}

// Fungsi untuk merender grafik berdasarkan tipe yang aktif
function renderChart() {
    // Bersihkan container grafik
    const container = document.getElementById("chart-container");
    container.innerHTML = "";

    // Buat elemen SVG baru
    svg = d3
        .select("#chart-container")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "80%")
        .attr("display", "flex")
        .attr("justify-content", "center")
        .attr("viewBox", "0 0 900 500");

    // Render berdasarkan tipe grafik yang aktif
    if (activeChart === "lineChart") {
        renderLineChart();
    } else {
        renderBarChart();
    }
}

// Fungsi untuk render Line Chart (Tahun vs Total Penjualan Global)
function renderLineChart() {
    // Filter data dengan tahun yang valid
    const validData = data.filter((d) => d.Year && !isNaN(d.Year));

    // Persiapkan data untuk line chart (agregat penjualan per tahun)
    const yearlyData = d3.rollup(
        validData,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Year
    );

    const lineData = Array.from(yearlyData, ([year, sales]) => ({
        year,
        sales,
    })).sort((a, b) => a.year - b.year); // UrutkFan berdasarkan tahun

    // Setup margin dan dimensi
    const margin = { top: 50, right: 50, bottom: 70, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left + 8},${margin.top})`);

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(lineData, (d) => d.year))
        .range([0, width]);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(lineData, (d) => d.sales) * 1.1]) // 10% margin atas
        .range([height, 0]);

    // Buat line generator
    const line = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.sales))
        .curve(d3.curveMonotoneX);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Tahun Rilis");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan judul
    svg.append("text")
        .attr("x", 450)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Tren Penjualan Game Global Per Tahun");

    // Tambahkan garis
    g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Tambahkan titik data
    g.selectAll(".dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.sales))
        .attr("r", 5)
        .attr("fill", "#45a049")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 8).attr("fill", "#2E7D32");

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>Tahun:</strong> ${
                        d.year
                    }<br><strong>Penjualan:</strong> ${d.sales.toFixed(2)} Juta`
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("r", 5).attr("fill", "#45a049");

            tooltip.style("opacity", 0);
        });

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan total penjualan game (dalam juta unit) untuk setiap tahun rilis. Total ${lineData.length} tahun ditampilkan.`;
}

// Fungsi untuk render Bar Chart (Platform vs Total Penjualan)
function renderBarChart() {
    // Persiapkan data untuk bar chart (agregat penjualan per platform)
    const platformData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Platform
    );

    const barData = Array.from(platformData, ([platform, sales]) => ({
        platform,
        sales,
    })).sort((a, b) => b.sales - a.sales); // Urutkan dari terbesar ke terkecil

    // Setup margin dan dimensi
    const margin = { top: 50, right: 50, bottom: 70, left: 120 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Truncate data jika terlalu banyak (ambil top 15)
    const displayData = barData.slice(0, 15);

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 24},${margin.top - 12})`);

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(displayData, (d) => d.sales) * 1.1]) // 10% margin kanan
        .range([0, width]);

    const yScale = d3
        .scaleBand()
        .domain(displayData.map((d) => d.platform))
        .range([0, height])
        .padding(0.2);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 10)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 70)
        .style("text-anchor", "middle")
        .text("Platform");

    // Tambahkan judul
    svg.append("text")
        .attr("x", 450)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Penjualan Game Per Platform");

    // Tambahkan bar
    g.selectAll(".bar")
        .data(displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.platform))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", (d) => xScale(d.sales))
        .attr("fill", "#4CAF50")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#2E7D32");

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>Platform:</strong> ${
                        d.platform
                    }<br><strong>Penjualan:</strong> ${d.sales.toFixed(2)} Juta`
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#4CAF50");

            tooltip.style("opacity", 0);
        });

    // Tambahkan label pada bar
    g.selectAll(".bar-label")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => xScale(d.sales) + 5)
        .attr("y", (d) => yScale(d.platform) + yScale.bandwidth() / 2 + 5)
        .text((d) => d.sales.toFixed(1))
        .style("font-size", "12px")
        .style("fill", "#666");

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan 15 platform teratas berdasarkan total penjualan game (dalam juta unit) dari total ${barData.length} platform.`;
}
