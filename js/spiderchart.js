class SpiderChart {
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

		vis.centerX = vis.config.width / 2;
		vis.centerY = vis.config.height / 2;

		vis.radius = Math.min(vis.config.width, vis.config.height) / 2 - 20;

		vis.rScale = d3.scaleLinear().domain([0, 100]).range([0, vis.radius]);

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
		vis.labelsG = vis.chart.append("g");
		vis.playersG = vis.chart.append("g");

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

		vis.angleSlice = (2 * Math.PI) / vis.labels.length;

		// Prepare data for every selected player
		vis.radarData = vis.data.map((player, playerIndex) => {
			const values = vis.variables.map((variable, i) => {
				const value = +player[variable];

				const angle = i * vis.angleSlice - Math.PI / 2;

				return {
					variable: vis.labels[i],
					value: Number.isFinite(value) ? value : 0,
					angle: angle,
					x:
						vis.centerX +
						vis.rScale(Number.isFinite(value) ? value : 0) * Math.cos(angle),
					y:
						vis.centerY +
						vis.rScale(Number.isFinite(value) ? value : 0) * Math.sin(angle),
				};
			});

			return {
				player: player,
				playerIndex: playerIndex,
				color: playerColors[playerIndex],
				values: values,
			};
		});

		// Radar polygon generator
		vis.radarLine = d3
			.line()
			.x((d) => d.x)
			.y((d) => d.y)
			.curve(d3.curveLinearClosed);

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
		// Grid circles
		// ----------------------------------

		const gridLevels = [20, 40, 60, 80, 100];

		vis.gridG
			.selectAll(".grid-circle")
			.data(gridLevels)
			.join("circle")
			.attr("class", "grid-circle")
			.attr("cx", vis.centerX)
			.attr("cy", vis.centerY)
			.attr("r", (d) => vis.rScale(d))
			.attr("fill", "none")
			.attr("stroke", "#ccc")
			.attr("stroke-width", 1);

		// Grid labels
		vis.gridG
			.selectAll(".grid-label")
			.data(gridLevels)
			.join("text")
			.attr("class", "grid-label")
			.attr("x", vis.centerX + 4)
			.attr("y", (d) => vis.centerY - vis.rScale(d))
			.attr("font-size", 10)
			.attr("fill", "#888")
			.text((d) => d);

		// ----------------------------------
		// Axes
		// ----------------------------------

		const axisData = vis.labels.map((label, i) => {
			const angle = i * vis.angleSlice - Math.PI / 2;

			return {
				label: label,
				x: vis.centerX + vis.radius * Math.cos(angle),
				y: vis.centerY + vis.radius * Math.sin(angle),
				labelX: vis.centerX + (vis.radius + 18) * Math.cos(angle),
				labelY: vis.centerY + (vis.radius + 18) * Math.sin(angle),
			};
		});

		vis.axesG
			.selectAll(".axis")
			.data(axisData)
			.join("line")
			.attr("class", "axis")
			.attr("x1", vis.centerX)
			.attr("y1", vis.centerY)
			.attr("x2", (d) => d.x)
			.attr("y2", (d) => d.y)
			.attr("stroke", "#aaa")
			.attr("stroke-dasharray", "3,3");

		// ----------------------------------
		// Variable labels
		// ----------------------------------

		vis.labelsG
			.selectAll(".axis-label")
			.data(axisData)
			.join("text")
			.attr("class", "axis-label")
			.attr("x", (d) => d.labelX)
			.attr("y", (d) => d.labelY)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.text((d) => d.label);

		// ----------------------------------
		// Player radar polygons
		// ----------------------------------

		const playerGroups = vis.playersG
			.selectAll(".player-group")
			.data(vis.radarData, (d) => d.player.chartId)
			.join(
				(enter) => enter.append("g").attr("class", "player-group"),
				(update) => update,
				(exit) => exit.remove(),
			);

		// Radar areas
		playerGroups
			.selectAll(".radar-area")
			.data((d) => [d])
			.join("path")
			.attr("class", "radar-area")
			.attr("d", (d) => vis.radarLine(d.values))
			.attr("fill", (d) => d.color)
			.attr("fill-opacity", 0.12)
			.attr("stroke", (d) => d.color)
			.attr("stroke-width", 2);

		// ----------------------------------
		// Data points
		// ----------------------------------

		playerGroups
			.selectAll(".radar-point")
			.data((d) =>
				d.values.map((v) => ({
					...v,
					color: d.color,
					playerId: d.player.chartId,
				})),
			)
			.join("circle")
			.attr("class", "radar-point")
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y)
			.attr("r", 3.5)
			.attr("fill", (d) => d.color);
	}
}
