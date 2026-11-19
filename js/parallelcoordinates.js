class ParallelCoordinates {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 400,
			containerHeight: 400,
			margin: { top: 60, right: 30, bottom: 40, left: 30 },
		};

		this.data = _data;
		this.initVis();
	}

	/**
	 * Initialize scales and create SVG area
	 */
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

		// SVG drawing area
		vis.svg = d3
			.select(vis.config.parentElement)
			.append("svg")
			.attr("width", vis.config.containerWidth)
			.attr("height", vis.config.containerHeight);

		// Main chart group
		vis.chart = vis.svg
			.append("g")
			.attr(
				"transform",
				`translate(${vis.config.margin.left},${vis.config.margin.top})`,
			);

		// Groups for chart elements
		vis.gridG = vis.chart.append("g").attr("class", "grid-group");

		vis.axesG = vis.chart.append("g").attr("class", "axes-group");

		vis.playersG = vis.chart.append("g").attr("class", "players-group");

		// X scale: position of each statistic axis
		vis.xScale = d3.scalePoint().range([0, vis.config.width]).padding(0.15);

		// Y scale: percentile values
		vis.yScale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([vis.config.height, 0]);

		vis.updateVis();
	}

	/**
	 * Prepare data and scales before rendering
	 */
	updateVis() {
		let vis = this;

		// Percentile variables
		vis.variables = [
			"PTS_percentile",
			"REB_percentile",
			"AST_percentile",
			"TOV_percentile",
			"STL_percentile",
			"BLK_percentile",
		];

		// Human-readable labels
		vis.labels = ["PTS", "REB", "AST", "TOV", "STL", "BLK"];

		// Update X scale
		vis.xScale.domain(vis.labels);

		// Prepare data for every selected player
		vis.parallelData = vis.data.map((player, playerIndex) => {
			const values = vis.variables.map((variable, i) => {
				const value = +player[variable];

				return {
					variable: vis.labels[i],
					value: Number.isFinite(value) ? value : 0,
				};
			});

			return {
				player: player,
				playerIndex: playerIndex,
				color: playerColors[playerIndex],
				values: values,
			};
		});

		// Line generator
		vis.line = d3
			.line()
			.x((d) => vis.xScale(d.variable))
			.y((d) => vis.yScale(d.value));

		vis.renderVis();
	}

	/**
	 * Bind data to visual elements
	 */
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
			.style("font-size", "15px")
			.style("font-weight", "bold")
			.text("Parallel Coordinates");

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
			.attr("stroke", "#ddd")
			.attr("stroke-width", 0.7)
			.attr("stroke-dasharray", "2,3");

		// ----------------------------------
		// Vertical axes
		// ----------------------------------

		const axisGroups = vis.axesG
			.selectAll(".parallel-axis")
			.data(vis.labels)
			.join("g")
			.attr("class", "parallel-axis")
			.attr("transform", (d) => `translate(${vis.xScale(d)},0)`);

		// Axis lines and ticks
		axisGroups.each(function () {
			d3.select(this).call(
				d3.axisLeft(vis.yScale).tickValues(gridLevels).tickSize(4),
			);
		});

		// ----------------------------------
		// Axis labels
		// ----------------------------------

		axisGroups
			.selectAll(".axis-label")
			.data((d) => [d])
			.join("text")
			.attr("class", "axis-label")
			.attr("x", 0)
			.attr("y", -12)
			.attr("text-anchor", "middle")
			.attr("font-size", 11)
			.attr("font-weight", "bold")
			.attr("fill", "#444")
			.text((d) => d);

		// ----------------------------------
		// Player groups
		// ----------------------------------

		const playerGroups = vis.playersG
			.selectAll(".player-group")
			.data(vis.parallelData, (d) => d.player.chartId)
			.join(
				(enter) => enter.append("g").attr("class", "player-group"),
				(update) => update,
				(exit) => exit.remove(),
			);

		// ----------------------------------
		// Player lines
		// ----------------------------------

		playerGroups
			.selectAll(".parallel-line")
			.data((d) => [d])
			.join("path")
			.attr("class", "parallel-line")
			.attr("d", (d) => vis.line(d.values))
			.attr("fill", "none")
			.attr("stroke", (d) => d.color)
			.attr("stroke-width", 1.5)
			.attr("stroke-opacity", 0.9);
	}
}
