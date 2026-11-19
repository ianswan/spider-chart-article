class LineChart {
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
		vis.playersG = vis.chart.append("g");

		vis.xScale = d3.scalePoint().range([0, vis.config.width]).padding(0.2);

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

		vis.xScale.domain(vis.labels);

		// Prepare data for every player
		vis.lineData = vis.data.map((player, playerIndex) => ({
			player: player,
			playerIndex: playerIndex,
			color: playerColors[playerIndex],
			values: vis.variables.map((variable, i) => {
				const value = +player[variable];

				return {
					variable: vis.labels[i],
					value: Number.isFinite(value) ? value : 0,
				};
			}),
		}));

		vis.line = d3
			.line()
			.x((d) => vis.xScale(d.variable))
			.y((d) => vis.yScale(d.value))
			.curve(d3.curveLinear);

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
		// Player groups
		// ----------------------------------

		const playerGroups = vis.playersG
			.selectAll(".player-group")
			.data(vis.lineData, (d) => d.player.chartId)
			.join(
				(enter) => enter.append("g").attr("class", "player-group"),
				(update) => update,
				(exit) => exit.remove(),
			);

		// ----------------------------------
		// Lines
		// ----------------------------------

		playerGroups
			.selectAll(".line")
			.data((d) => [d])
			.join("path")
			.attr("class", "line")
			.attr("d", (d) => vis.line(d.values))
			.attr("fill", "none")
			.attr("stroke", (d) => d.color)
			.attr("stroke-width", 2.5);

		// ----------------------------------
		// Data points
		// ----------------------------------

		playerGroups
			.selectAll(".line-point")
			.data((d) =>
				d.values.map((v) => ({
					...v,
					color: d.color,
				})),
			)
			.join("circle")
			.attr("class", "line-point")
			.attr("cx", (d) => vis.xScale(d.variable))
			.attr("cy", (d) => vis.yScale(d.value))
			.attr("r", 4)
			.attr("fill", (d) => d.color)
			.attr("stroke", "white")
			.attr("stroke-width", 1);
	}
}
