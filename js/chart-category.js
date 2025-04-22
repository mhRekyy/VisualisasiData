const svg = d3.select("svg"),
  margin = { top: 50, right: 20, bottom: 120, left: 60 },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom;

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

// Load the data
async function drawChart() {
  try {
    const data = await d3.csv("data/googleplaystore.csv");

    const categories = Array.from(new Set(data.map(d => d.Category))).sort();
    const dropdown = d3.select("#categoryFilter");
    categories.forEach(cat => dropdown.append("option").attr("value", cat).text(cat));

    dropdown.on("change", () => updateChart(dropdown.property("value")));
    updateChart("All");

    function updateChart(selectedCategory) {
      const filtered = selectedCategory === "All" ? data : data.filter(d => d.Category === selectedCategory);
      const categoryCounts = d3.rollup(filtered, v => v.length, d => d.Category);
      const chartData = Array.from(categoryCounts, ([category, count]) => ({ category, count }));

      const x = d3.scaleBand()
        .domain(chartData.map(d => d.category))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count) || 100])
        .nice()
        .range([height, 0]);

      chart.selectAll("*").remove();

      chart.selectAll("rect")
        .data(chartData)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.category))
          .attr("y", d => y(d.count))
          .attr("width", x.bandwidth())
          .attr("height", d => height - y(d.count))
          .on("mousemove", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`<strong>${d.category}</strong><br>Jumlah: ${d.count}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

      chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("font-size", "10px")
          .style("fill", "#c9d1d9");

      chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
          .style("fill", "#c9d1d9");
    }
  } catch (error) {
    console.error("Gagal memuat data CSV:", error);
  }
}

drawChart();
