let spiderChart;
let lineChart;
let barChart;
let parallelChart;
let statDeviationChart;
let statDeviationChartCentered;

let allData;
let selectedPlayers = [];
let statMeans;

// Consistent colors across all charts
const playerColors = [
	"steelblue",
	"darkorange",
	"seagreen",
	"crimson",
	"mediumpurple",
];

// ----------------------------------
// Load all CSV files
// ----------------------------------

Promise.all([
	d3.csv("data/boxscore_percentiles.csv"),
	d3.csv("data/boxscore_raw.csv"),
	d3.csv("data/boxscore_mean_std.csv"),
])
	.then(([percentileData, rawData, meanStdData]) => {
		// ----------------------------------
		// Join raw data to percentile data
		// ----------------------------------

		const rawLookup = new Map(rawData.map((d) => [d.PLAYER_ID, d]));

		allData = percentileData
			.map((player, i) => {
				const rawPlayer = rawLookup.get(player.PLAYER_ID);

				if (!rawPlayer) {
					console.warn(`Missing raw data for ${player.PLAYER_NAME}`);
					return null;
				}

				return {
					...player,
					...rawPlayer,
					chartId: String(i),
				};
			})
			.filter((d) => d !== null);

		// ----------------------------------
		// Prepare mean and standard deviation data
		// ----------------------------------

		statMeans = {};

		meanStdData.forEach((d) => {
			statMeans[d.stat || d[""]] = {
				MEAN: +d.MEAN,
				STD: +d.STD,
			};
		});

		// ----------------------------------
		// Populate team dropdown
		// ----------------------------------

		const teams = [...new Set(allData.map((d) => d.TEAM_ABBREVIATION))].sort();

		d3.select("#team-filter")
			.selectAll("option.team-option")
			.data(teams)
			.join("option")
			.attr("class", "team-option")
			.attr("value", (d) => d)
			.text((d) => d);

		// Initialize player dropdown
		updatePlayerDropdown();

		// ----------------------------------
		// Team selection
		// ----------------------------------

		d3.select("#team-filter").on("change", function () {
			updatePlayerDropdown();
		});

		// ----------------------------------
		// Player selection
		// ----------------------------------

		d3.select("#player-filter").on("change", function () {
			const selectedIds = Array.from(
				this.selectedOptions,
				(option) => option.value,
			);

			// Limit selection to five players
			if (selectedIds.length > 5) {
				alert("You can select a maximum of five players.");

				d3.select(this)
					.selectAll("option")
					.property("selected", function () {
						return selectedPlayers.some((d) => d.chartId === this.value);
					});

				return;
			}

			selectedPlayers = allData.filter((d) => selectedIds.includes(d.chartId));

			updateCharts();
			updateLegend();
		});
	})
	.catch((error) => console.error("Error loading CSV files:", error));

// ----------------------------------
// Update player dropdown
// ----------------------------------

function updatePlayerDropdown() {
	const selectedTeam = d3.select("#team-filter").property("value");

	const filteredData = selectedTeam
		? allData.filter((d) => d.TEAM_ABBREVIATION === selectedTeam)
		: allData;

	const players = [...filteredData].sort((a, b) =>
		a.PLAYER_NAME.localeCompare(b.PLAYER_NAME),
	);

	const playerDropdown = d3.select("#player-filter");

	playerDropdown.selectAll("option").remove();

	playerDropdown
		.selectAll("option")
		.data(players)
		.join("option")
		.attr("value", (d) => d.chartId)
		.text((d) => `${d.PLAYER_NAME} (${d.TEAM_ABBREVIATION})`);

	// Reset selections
	selectedPlayers = [];

	// Automatically select first player
	if (players.length > 0) {
		selectedPlayers = [players[0]];

		playerDropdown.selectAll("option").property("selected", function () {
			return this.value === players[0].chartId;
		});
	}

	updateCharts();
	updateLegend();
}

// ----------------------------------
// Update all five charts
// ----------------------------------

function updateCharts() {
	if (selectedPlayers.length === 0) {
		d3.select("#spider-charts").selectAll("*").remove();
		d3.select("#line-chart").selectAll("*").remove();
		d3.select("#bar-chart").selectAll("*").remove();
		d3.select("#parallel-coordinates").selectAll("*").remove();
		d3.select("#stat-deviation-chart").selectAll("*").remove();
		d3.select("#stat-deviation-chart-centered").selectAll("*").remove();

		spiderChart = null;
		lineChart = null;
		barChart = null;
		parallelChart = null;
		statDeviationChart = null;
		statDeviationChartCentered = null;

		return;
	}

	// ----------------------------------
	// Initialize charts
	// ----------------------------------

	if (!spiderChart) {
		spiderChart = new SpiderChart(
			{ parentElement: "#spider-charts" },
			selectedPlayers,
		);

		lineChart = new LineChart(
			{ parentElement: "#line-chart" },
			selectedPlayers,
		);

		barChart = new BarChart({ parentElement: "#bar-chart" }, selectedPlayers);

		parallelChart = new ParallelCoordinates(
			{ parentElement: "#parallel-coordinates" },
			selectedPlayers,
		);

		statDeviationChart = new StatDeviationChart(
			{ parentElement: "#stat-deviation-chart" },
			selectedPlayers,
			statMeans,
		);

		statDeviationChartCentered = new StatDeviationChartCentered(
			{ parentElement: "#stat-deviation-chart-centered" },
			selectedPlayers,
			statMeans,
		);
	} else {
		// Update spider chart
		spiderChart.data = selectedPlayers;
		spiderChart.updateVis();

		// Update line chart
		lineChart.data = selectedPlayers;
		lineChart.updateVis();

		// Update bar chart
		barChart.data = selectedPlayers;
		barChart.updateVis();

		// Update parallel coordinates
		parallelChart.data = selectedPlayers;
		parallelChart.updateVis();

		// Update standard deviation chart
		statDeviationChart.data = selectedPlayers;
		statDeviationChart.updateVis();

		statDeviationChartCentered.data = selectedPlayers;
		statDeviationChartCentered.updateVis();
	}
}

// ----------------------------------
// Update shared player legend
// ----------------------------------

function updateLegend() {
	const legend = d3.select("#player-legend");

	legend.selectAll("*").remove();

	selectedPlayers.forEach((player, i) => {
		const item = legend.append("div").attr("class", "legend-item");

		item
			.append("span")
			.attr("class", "legend-color")
			.style("background-color", playerColors[i]);

		item
			.append("span")
			.text(`${player.PLAYER_NAME} (${player.TEAM_ABBREVIATION})`);
	});
}
