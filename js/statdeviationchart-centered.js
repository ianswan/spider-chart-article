class StatDeviationChartCentered {
	/**
	 * Class constructor
	 * @param {Object} _config
	 * @param {Array} _data - Selected player objects
	 * @param {Object} _stats - Mean and standard deviation data
	 */
	constructor(_config, _data, _stats) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 500,
			containerHeight: 430,
			margin: { top: 65, right: 35, bottom: 30, left: 55 },
		};

		this.data = _data;
		this.stats = _stats;

		this.initVis();
	}

	/**
	 * Initialize scales and SVG area
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
		vis.backgroundG = vis.chart.append("g");
		vis.referenceG = vis.chart.append("g");
		vis.axesG = vis.chart.append("g");
		vis.playersG = vis.chart.append("g");
		vis.labelsG = vis.chart.append("g").attr("class", "labels-group");

		// Statistic labels
		vis.labels = ["PTS", "REB", "AST", "TOV", "STL", "BLK"];

		// Vertical positioning of each statistic
		vis.yScale = d3
			.scalePoint()
			.domain(vis.labels)
			.range([0, vis.config.height])
			.padding(0.5);

		vis.updateVis();
	}

	/**
	 * Prepare data and scales before rendering
	 */
	updateVis() {
		let vis = this;

		// Prepare statistic information
		vis.statData = vis.labels.map((stat) => {
			const mean = +vis.stats[stat].MEAN;
			const std = +vis.stats[stat].STD;

			// Find the largest deviation from the mean
			const playerValues = vis.data
				.map((player) => +player[stat])
				.filter(Number.isFinite);

			const maxDeviation = Math.max(
				std * 2.5,
				...playerValues.map((value) => Math.abs(value - mean)),
			);

			// Symmetrical scale centered on the mean
			const xScale = d3
				.scaleLinear()
				.domain([mean - maxDeviation, mean + maxDeviation])
				.range([0, vis.config.width]);

			return {
				stat: stat,
				mean: mean,
				std: std,
				lower: mean - std,
				upper: mean + std,
				xScale: xScale,
			};
		});

		// Prepare selected player data
		vis.playerData = vis.data.map((player, playerIndex) => ({
			player: player,
			playerIndex: playerIndex,
			color: playerColors[playerIndex],

			values: vis.labels.map((stat) => ({
				stat: stat,
				value: +player[stat],
			})),
		}));

		// Line generator connecting each player's statistics
		vis.playerLine = d3
			.line()
			.x((d) => {
				const stat = vis.statData.find((s) => s.stat === d.stat);

				return stat.xScale(d.value);
			})
			.y((d) => vis.yScale(d.stat));

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
			.text("Player Statistics vs. Mean (Centered)");

		// ----------------------------------
		// Statistic groups
		// ----------------------------------

		const statGroups = vis.chart
			.selectAll(".stat-group")
			.data(vis.statData, (d) => d.stat)
			.join("g")
			.attr("class", "stat-group")
			.attr("transform", (d) => `translate(0,${vis.yScale(d.stat)})`);

		// ----------------------------------
		// Statistic labels
		// ----------------------------------

		vis.labelsG
			.selectAll(".stat-label")
			.data(vis.statData, (d) => d.stat)
			.join("text")
			.attr("class", "stat-label")
			.attr("x", -12)
			.attr("y", (d) => vis.yScale(d.stat))
			.attr("text-anchor", "end")
			.attr("dominant-baseline", "middle")
			.attr("font-size", 12)
			.attr("font-weight", "bold")
			.text((d) => d.stat);

		// ----------------------------------
		// Standard deviation bands
		// ----------------------------------

		statGroups
			.selectAll(".std-band")
			.data((d) => [d])
			.join("rect")
			.attr("class", "std-band")
			.attr("x", (d) => d.xScale(d.lower))
			.attr("y", -12)
			.attr("width", (d) => d.xScale(d.upper) - d.xScale(d.lower))
			.attr("height", 24)
			.attr("fill", "#a7a7a7")
			.attr("fill-opacity", 0.45);

		// ----------------------------------
		// Horizontal reference line
		// ----------------------------------

		statGroups
			.selectAll(".reference-line")
			.data((d) => [d])
			.join("line")
			.attr("class", "reference-line")
			.attr("x1", 0)
			.attr("x2", vis.config.width)
			.attr("y1", 0)
			.attr("y2", 0)
			.attr("stroke", "#888")
			.attr("stroke-width", 1.2);

		// ----------------------------------
		// Mean marker
		// ----------------------------------

		statGroups
			.selectAll(".mean-line")
			.data((d) => [d])
			.join("line")
			.attr("class", "mean-line")
			.attr("x1", (d) => d.xScale(d.mean))
			.attr("x2", (d) => d.xScale(d.mean))
			.attr("y1", -15)
			.attr("y2", 15)
			.attr("stroke", "#222")
			.attr("stroke-width", 2);

		// ----------------------------------
		// Mean and standard deviation labels
		// ----------------------------------

		statGroups
			.selectAll(".mean-label")
			.data((d) => [d])
			.join("text")
			.attr("class", "mean-label")
			.attr("x", (d) => d.xScale(d.mean))
			.attr("y", 23)
			.attr("text-anchor", "middle")
			.attr("font-size", 9)
			.attr("fill", "#555");
		// .text((d) => `μ ${d.mean.toFixed(1)}`);

		// ----------------------------------
		// Player data points
		// ----------------------------------

		const playerGroups = vis.playersG
			.selectAll(".player-group")
			.data(vis.playerData, (d) => d.player.chartId)
			.join(
				(enter) => enter.append("g").attr("class", "player-group"),
				(update) => update,
				(exit) => exit.remove(),
			);

		playerGroups
			.selectAll(".player-point")
			.data((d) =>
				d.values.map((v) => ({
					...v,
					color: d.color,
					player: d.player,
				})),
			)
			.join("circle")
			.attr("class", "player-point")
			.attr("cx", (d) => {
				const stat = vis.statData.find((s) => s.stat === d.stat);

				return stat.xScale(d.value);
			})
			.attr("cy", (d) => vis.yScale(d.stat))
			.attr("r", 5)
			.attr("fill", (d) => d.color)
			.attr("stroke", "white")
			.attr("stroke-width", 1.2)
			.append("title")
			.text(
				(d) =>
					`${d.player.PLAYER_NAME}\n` +
					`${d.stat}: ${d.value}\n` +
					`Mean: ${vis.stats[d.stat].MEAN}`,
			);

		// ----------------------------------
		// Lines connecting player points
		// ----------------------------------

		playerGroups
			.selectAll(".player-line")
			.data((d) => [d])
			.join("path")
			.attr("class", "player-line")
			.attr("d", (d) => vis.playerLine(d.values))
			.attr("fill", "none")
			.attr("stroke", (d) => d.color)
			.attr("stroke-width", 1.5)
			.attr("stroke-opacity", 0.25);

		// ----------------------------------
		// X-axis reference ticks
		// ----------------------------------

		statGroups
			.selectAll(".stat-ticks")
			.data((d) => [d])
			.join("g")
			.attr("class", "stat-ticks")
			.attr("transform", "translate(0,15)")
			.each(function (d) {
				const axis = d3
					.axisBottom(d.xScale)
					.tickValues([d.lower, d.mean, d.upper])
					.tickFormat((value) => value.toFixed(1))
					.tickSize(3);

				d3.select(this).call(axis);
			});

		vis.backgroundG.lower();
		vis.referenceG.raise();
		vis.axesG.raise();
		vis.playersG.raise();
	}
}
