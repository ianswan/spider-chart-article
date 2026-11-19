class BarChart {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 400,
			containerHeight: 400,
			margin: { top: 60, right: 30, bottom: 65, left: 55 },
		};

		this.data = _data;
		this.initVis();
	}

	initVis() {
		let vis = this;

		vis.config.width =
			vis.config.containerWidth -
			vis.config.margin.left -
			vis.config.margin.right;

		vis.config.height =
			vis.config.containerHeight -
			vis.config.margin.top -
			vis.config.margin.bottom;

		vis.svg = d3
			.select(vis.config.parentElement)
			.append("svg")
			.attr("width", vis.config.containerWidth)
			.attr("height", vis.config.containerHeight);

		vis.chart = vis.svg
			.append("g")
			.attr(
				"transform",
				`translate(${vis.config.margin.left},${vis.config.margin.top})`,
			);

		vis.gridG = vis.chart.append("g");
		vis.axesG = vis.chart.append("g");
		vis.barsG = vis.chart.append("g");
		vis.labelsG = vis.chart.append("g");

		// X scale: statistics
		vis.xScale = d3.scaleBand().range([0, vis.config.width]).padding(0.15);

		// Nested X scale: players within each statistic
		vis.xSubScale = d3.scaleBand().padding(0.08);

		// Y scale: percentiles
		vis.yScale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([vis.config.height, 0]);

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.variables = [
			"PTS_percentile",
			"REB_percentile",
			"AST_percentile",
			"TOV_percentile",
			"STL_percentile",
			"BLK_percentile",
		];

		vis.labels = ["PTS", "REB", "AST", "TOV", "STL", "BLK"];

		// Prepare data for all selected players
		vis.barData = vis.data.map((player, playerIndex) => ({
			player: player,
			playerIndex: playerIndex,
			playerId: player.chartId,
			color: playerColors[playerIndex],
			values: vis.variables.map((variable, i) => {
				const value = +player[variable];

				return {
					variable: vis.labels[i],
					value: Number.isFinite(value) ? value : 0,
					playerId: player.chartId,
					playerIndex: playerIndex,
					color: playerColors[playerIndex],
				};
			}),
		}));

		// Update scales
		vis.xScale.domain(vis.labels);

		vis.xSubScale
			.domain(vis.barData.map((d) => d.playerId))
			.range([0, vis.xScale.bandwidth()]);

		// Flatten data for grouped bars
		vis.flatData = vis.barData.flatMap((d) => d.values);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		// ----------------------------------
		// Chart title
		// ----------------------------------

		vis.svg
			.selectAll(".chart-title")
			.data([null])
			.join("text")
			.attr("class", "chart-title")
			.attr("x", vis.config.containerWidth / 2)
			.attr("y", 30)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("font-weight", "bold")
			.text("Player Percentile Comparison");

		// ----------------------------------
		// Grid lines
		// ----------------------------------

		const gridLevels = [0, 20, 40, 60, 80, 100];

		vis.gridG
			.selectAll(".grid-line")
			.data(gridLevels)
			.join("line")
			.attr("class", "grid-line")
			.attr("x1", 0)
			.attr("x2", vis.config.width)
			.attr("y1", (d) => vis.yScale(d))
			.attr("y2", (d) => vis.yScale(d))
			.attr("stroke", "#ccc")
			.attr("stroke-width", 1)
			.attr("stroke-dasharray", "3,3");

		// ----------------------------------
		// Y axis
		// ----------------------------------

		vis.axesG
			.selectAll(".y-axis")
			.data([null])
			.join("g")
			.attr("class", "y-axis")
			.call(d3.axisLeft(vis.yScale).tickValues(gridLevels));

		// ----------------------------------
		// X axis
		// ----------------------------------

		vis.axesG
			.selectAll(".x-axis")
			.data([null])
			.join("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${vis.config.height})`)
			.call(d3.axisBottom(vis.xScale));

		// ----------------------------------
		// Y axis label
		// ----------------------------------

		vis.axesG
			.selectAll(".y-axis-label")
			.data([null])
			.join("text")
			.attr("class", "y-axis-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -vis.config.height / 2)
			.attr("y", -40)
			.attr("text-anchor", "middle")
			.attr("fill", "#444")
			.attr("font-size", 11)
			.text("Percentile");

		// ----------------------------------
		// Grouped bars
		// ----------------------------------

		vis.barsG
			.selectAll(".bar")
			.data(vis.flatData, (d) => `${d.playerId}-${d.variable}`)
			.join("rect")
			.attr("class", "bar")
			.attr("x", (d) => vis.xScale(d.variable) + vis.xSubScale(d.playerId))
			.attr("y", (d) => vis.yScale(d.value))
			.attr("width", vis.xSubScale.bandwidth())
			.attr("height", (d) => vis.config.height - vis.yScale(d.value))
			.attr("fill", (d) => d.color);

		// ----------------------------------
		// Value labels
		// ----------------------------------

		vis.labelsG
			.selectAll(".value-label")
			.data(vis.flatData, (d) => `${d.playerId}-${d.variable}`)
			.join("text")
			.attr("class", "value-label")
			.attr(
				"x",
				(d) =>
					vis.xScale(d.variable) +
					vis.xSubScale(d.playerId) +
					vis.xSubScale.bandwidth() / 2,
			)
			.attr("y", (d) => vis.yScale(d.value) - 4)
			.attr("text-anchor", "middle")
			.attr("font-size", 8)
			.attr("fill", "#444")
			.text((d) => Math.round(d.value));
	}
}
