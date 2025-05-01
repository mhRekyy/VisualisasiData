 // Variables to store state
 let playStoreData = [];
 let chartType = 'category';
 let limit = 15;
 let sortOrder = 'desc';
 let chart, tooltip;

 // Initialize after page loaded
 document.addEventListener('DOMContentLoaded', function() {
     // Setup event listeners for controls
     document.getElementById('categoryBtn').addEventListener('click', function() {
         setActiveChart('category');
         setActiveButton(this);
     });
     
     document.getElementById('ratingBtn').addEventListener('click', function() {
         setActiveChart('rating');
         setActiveButton(this);
     });
     
     document.getElementById('installsBtn').addEventListener('click', function() {
         setActiveChart('installs');
         setActiveButton(this);
     });
     
     document.getElementById('limitSelect').addEventListener('change', function() {
         limit = this.value === 'all' ? null : parseInt(this.value);
         renderChart();
     });
     
     document.getElementById('sortSelect').addEventListener('change', function() {
         sortOrder = this.value;
         renderChart();
     });
     
     // Initialize tooltip
     tooltip = d3.select("#tooltip");
     
     // Load data
     loadData();
 });

 function setActiveButton(button) {
     // Remove active class from all buttons
     document.querySelectorAll('.control-group .btn').forEach(btn => {
         btn.classList.remove('active');
     });
     
     // Add active class to the clicked button
     button.classList.add('active');
 }

 // Function to load data from CSV
 function loadData() {
     // Use PapaParse to load the CSV file
     Papa.parse('data/googleplaystore.csv', {
         header: true,
         download: true,
         dynamicTyping: true,
         skipEmptyLines: true,
         complete: function(results) {
             // Process data
             playStoreData = results.data;
             
             // Clean and prepare data
             playStoreData.forEach(d => {
                 // Convert string values to numbers where appropriate
                 if (typeof d.Rating === 'string') d.Rating = parseFloat(d.Rating);
                 if (typeof d.Reviews === 'string') d.Reviews = parseInt(d.Reviews.replace(/,/g, ''));
                 
                 // Process installs (remove '+' and ',' and convert to number)
                 if (typeof d.Installs === 'string') {
                     d.Installs = parseInt(d.Installs.replace(/[+,]/g, '')) || 0;
                 }
             });
             
             // Hide loading and render chart
             document.querySelector('.loading').style.display = 'none';
             renderChart();
         },
         error: function(error) {
             console.error('Error loading CSV:', error);
             document.querySelector('.loading').style.display = 'none';
             document.getElementById('chart').innerHTML = '<div class="error">Failed to load data. Please check if the CSV file is accessible.</div>';
         }
     });
 }

 // Function to set active chart type and render
 function setActiveChart(type) {
     chartType = type;
     renderChart();
 }

 // Function to render the chart based on current settings
 function renderChart() {
     // Clear the chart container
     document.getElementById('chart').innerHTML = '';
     
     // Setup SVG
     const width = document.getElementById('chart').clientWidth;
     const height = 500;
     const margin = { top: 40, right: 30, bottom: 80, left: 120 };
     const innerWidth = width - margin.left - margin.right;
     const innerHeight = height - margin.top - margin.bottom;
     
     // Create SVG element
     const svg = d3.select('#chart')
         .append('svg')
         .attr('width', width)
         .attr('height', height);
     
     // Create group for the chart with margins
     const g = svg.append('g')
         .attr('transform', `translate(${margin.left},${margin.top})`);
     
     // Process data based on chart type
     let processedData;
     let legendText;
     
     if (chartType === 'category') {
         // Count apps per category
         const categoryCount = d3.rollup(
             playStoreData,
             v => v.length,
             d => d.Category
         );
         
         processedData = Array.from(categoryCount, ([category, count]) => ({
             key: category,
             value: count
         }));
         
         legendText = `Showing ${limit ? `top ${limit}` : 'all'} categories by number of apps in the Google Play Store.`;
     } 
     else if (chartType === 'rating') {
         // Average rating per category
         const categoryRatings = d3.rollup(
             playStoreData.filter(d => !isNaN(d.Rating)),
             v => d3.mean(v, d => d.Rating),
             d => d.Category
         );
         
         processedData = Array.from(categoryRatings, ([category, avgRating]) => ({
             key: category,
             value: avgRating
         }));
         
         legendText = `Showing ${limit ? `top ${limit}` : 'all'} categories by average app rating in the Google Play Store.`;
     } 
     else if (chartType === 'installs') {
         // Total installs per category
         const categoryInstalls = d3.rollup(
             playStoreData.filter(d => !isNaN(d.Installs)),
             v => d3.sum(v, d => d.Installs),
             d => d.Category
         );
         
         processedData = Array.from(categoryInstalls, ([category, installs]) => ({
             key: category,
             value: installs
         }));
         
         legendText = `Showing ${limit ? `top ${limit}` : 'all'} categories by total installations in the Google Play Store.`;
     }
     
     // Sort data
     processedData.sort((a, b) => {
         return sortOrder === 'desc' 
             ? b.value - a.value 
             : a.value - b.value;
     });
     
     // Apply limit if specified
     if (limit) {
         processedData = processedData.slice(0, limit);
     }
     
     // Update the legend text
     document.getElementById('chart-legend').textContent = legendText;
     
     // Create scales
     const xScale = d3.scaleLinear()
         .domain([0, d3.max(processedData, d => d.value) * 1.1])
         .range([0, innerWidth]);
     
     const yScale = d3.scaleBand()
         .domain(processedData.map(d => d.key))
         .range([0, innerHeight])
         .padding(0.2);
     
     // Add axes
     g.append('g')
         .attr('class', 'x-axis')
         .attr('transform', `translate(0,${innerHeight})`)
         .call(d3.axisBottom(xScale)
             .ticks(5)
             .tickFormat(d => {
                 if (chartType === 'installs' && d >= 1000000) {
                     return d3.format('.1s')(d);
                 }
                 return chartType === 'rating' ? d3.format('.1f')(d) : d3.format(',')(d);
             })
         )
         .selectAll('text')
         .attr('dy', '0.5em');
     
     g.append('g')
         .attr('class', 'y-axis')
         .call(d3.axisLeft(yScale))
         .selectAll('text')
         .attr('font-size', '12px');
     
     // Add axis labels
     g.append('text')
         .attr('class', 'x-axis-label')
         .attr('x', innerWidth / 2)
         .attr('y', innerHeight + 40)
         .attr('text-anchor', 'middle')
         .text(() => {
             if (chartType === 'category') return 'Number of Apps';
             if (chartType === 'rating') return 'Average Rating (1-5)';
             if (chartType === 'installs') return 'Total Installations';
         });
     
     g.append('text')
         .attr('class', 'y-axis-label')
         .attr('transform', 'rotate(-90)')
         .attr('x', -innerHeight / 2)
         .attr('y', -60)
         .attr('text-anchor', 'middle')
         .text('Category');
     
     // Add bars
     const bars = g.selectAll('.bar')
         .data(processedData)
         .enter()
         .append('rect')
         .attr('class', 'bar')
         .attr('x', 0)
         .attr('y', d => yScale(d.key))
         .attr('width', d => xScale(d.value))
         .attr('height', yScale.bandwidth())
         .attr('fill', '#4551FC')
         .attr('rx', 4) // Rounded corners
         .on('mouseover', function(event, d) {
             // Highlight bar
             d3.select(this)
                 .attr('fill', '#FF8D58')
                 .transition()
                 .duration(200);
             
             // Show tooltip
             let tooltipContent = '';
             
             if (chartType === 'category') {
                 tooltipContent = `
                     <h4>${d.key}</h4>
                     <p><strong>Number of Apps:</strong> ${d3.format(',')(d.value)}</p>
                     <p><strong>Percentage:</strong> ${d3.format('.1%')(d.value / playStoreData.length)}</p>
                 `;
             } else if (chartType === 'rating') {
                 tooltipContent = `
                     <h4>${d.key}</h4>
                     <p><strong>Average Rating:</strong> ${d3.format('.2f')(d.value)}/5.0</p>
                     <p><strong>Apps:</strong> ${d3.format(',')(playStoreData.filter(app => app.Category === d.key).length)}</p>
                 `;
             } else if (chartType === 'installs') {
                 tooltipContent = `
                     <h4>${d.key}</h4>
                     <p><strong>Total Installs:</strong> ${d3.format('.2s')(d.value)}</p>
                     <p><strong>Apps:</strong> ${d3.format(',')(playStoreData.filter(app => app.Category === d.key).length)}</p>
                 `;
             }
             
             tooltip
                 .style('opacity', 1)
                 .style('left', (event.pageX + 10) + 'px')
                 .style('top', (event.pageY - 28) + 'px')
                 .html(tooltipContent);
         })
         .on('mouseout', function() {
             // Restore bar color
             d3.select(this)
                 .attr('fill', '#4551FC')
                 .transition()
                 .duration(200);
             
             // Hide tooltip
             tooltip.style('opacity', 0);
         });
     
     // Add labels to bars
     g.selectAll('.bar-label')
         .data(processedData)
         .enter()
         .append('text')
         .attr('class', 'bar-label')
         .attr('x', d => xScale(d.value) + 5)
         .attr('y', d => yScale(d.key) + yScale.bandwidth() / 2)
         .attr('dy', '.35em')
         .text(d => {
             if (chartType === 'rating') {
                 return d3.format('.1f')(d.value);
             } else if (chartType === 'installs') {
                 return d3.format('.1s')(d.value);
             } else {
                 return d3.format(',')(d.value);
             }
         })
         .attr('font-size', '12px')
         .attr('fill', '#787878');
     
     // Add chart title
     svg.append('text')
         .attr('x', width / 2)
         .attr('y', 20)
         .attr('text-anchor', 'middle')
         .attr('font-size', '18px')
         .attr('font-weight', 'bold')
         .attr('font-family', 'Space Grotesk, sans-serif')
         .attr('fill', '#4551FC')
         .text(() => {
             if (chartType === 'category') return 'App Distribution by Category';
             if (chartType === 'rating') return 'Average Rating by Category';
             if (chartType === 'installs') return 'Total Installations by Category';
         });
 }