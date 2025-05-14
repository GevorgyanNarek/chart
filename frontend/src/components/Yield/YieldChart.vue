<script setup>
import { ref, watch, shallowRef } from "vue"
import { useYieldStore } from "@/stores/yieldStore";
import Chart from 'chart.js/auto';

const yieldStore = useYieldStore();
const chartCanvas = ref(null);
const myLineChart = shallowRef(null);
const isFilled = shallowRef(false)
const defaultFontSize = 14;

watch(
    () => yieldStore.chartDataReady,
    (newValue) => {
        if (newValue) {
            updateChartCurve();
        }
    },
    { flush: "post" }
);

watch(
    () => yieldStore.filter,
    () => {
        updateChartLabel();
    }
);

watch(
    () => yieldStore.allData,
    (newValue) => {
        if (newValue) {
            createChart();
        }
    },
    { deep: true, flush: "post", once: true }
);


watch(
    () => yieldStore.newLineData,
    (newData) => {
        if (newData) {
            addNewLine(newData.label, newData.data, newData.color);
        }
    },
    { deep: true, flush: "post" }
);

watch(
    () => yieldStore.removeKey,
    () => {
        removeLine();
    },
    { deep: true, flush: "post" }
)

watch(
    () => yieldStore.toggleKey,
    () => {
        toggleLine();
    },
    { deep: true, flush: "post" }
);

function adjustFontSize() {
    if (window.innerWidth < 400) {
        return defaultFontSize * 0.6;
    } else if (window.innerWidth < 600) {
        return defaultFontSize * 0.7;
    } else if (window.innerWidth < 700) {
        return defaultFontSize * 0.8;
    } else {
        return defaultFontSize;
    }
}

// ----------------- Chart functions ------------------

// Get the minimum value from the dataset
function getMinValue(dataSets) {
    const values = dataSets.flat()
    return Math.min(...values) || 0;
}

// Get the maximum value from the dataset
function getMaxValue(dataSets) {
    const values = dataSets.flat()
    return Math.max(...values) || 100;
}

// Slice labels for Filters
function updateChartLabel() {
    if (!myLineChart.value) return;

    myLineChart.value.options.scales.x.labels = [...yieldStore.filteredLabelX];
    myLineChart.value.data.datasets.forEach((dataset, index) => {
        dataset.data = yieldStore.filteredData[index] || [];
    });
    myLineChart.value.options.scales.y.suggestedMin = getMinValue(...yieldStore.filteredData);
    myLineChart.value.options.scales.y.suggestedMax = getMaxValue(...yieldStore.filteredData);

    myLineChart.value.update();
}

// Update the chart with new data (yield changed)
function updateChartCurve() {
    if (!myLineChart.value) {
        createChart();
        return;
    }
    
    myLineChart.value.options.scales.x.labels = [...yieldStore.filteredLabelX];
    myLineChart.value.data.datasets.forEach((dataset, index) => {
        dataset.data = yieldStore.filteredData[index] || [];
    });

    myLineChart.value.options.scales.y.suggestedMin = getMinValue(...yieldStore.filteredData);
    myLineChart.value.options.scales.y.suggestedMax = getMaxValue(...yieldStore.filteredData);

    myLineChart.value.update();
}

// Add new date (line)
function addNewLine(labelName, data, color) {
    if (!myLineChart.value) return;

    const newDataset = {
        label: labelName,
        data: data, // Y-axis values
        borderColor: color || `hsl(${myLineChart.value.data.datasets.length * 50}, 70%, 50%)`,
        backgroundColor: hexToRGBA(color, 0.3),
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: isFilled.value ? "start" : false,
    };


    myLineChart.value.data.datasets.push(newDataset);

    myLineChart.value.options.scales.y.suggestedMin = getMinValue(...yieldStore.filteredData);
    myLineChart.value.options.scales.y.suggestedMax = getMaxValue(...yieldStore.filteredData);
    myLineChart.value.update();
}

// Remove date (line)
function removeLine() {
    if (!myLineChart.value) return;

    myLineChart.value.data.datasets.splice(yieldStore.removedLineIndex, 1);
    myLineChart.value.update();
}

function toggleLine() {
    if (!myLineChart.value) return;

    let meta = myLineChart.value.getDatasetMeta(yieldStore.toggleLineIndex);
    meta.hidden = meta.hidden === null ? true : !meta.hidden; // Toggle visibility
    myLineChart.value.update();
}


// Create the chart
function createChart() {
    if (!chartCanvas.value) {
        console.error("Canvas element not found!");
        return;
    }

    const ctx = chartCanvas.value.getContext("2d");

    if (myLineChart.value) {
        myLineChart.value.destroy(); // Destroy previous chart if it exists
        myLineChart.value = null;
    }

    // Determine if y-axis title should be displayed based on device width
    const displayYTitle = window.innerWidth >= 700;

    myLineChart.value = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [...yieldStore.filteredData].map((dataSet, index) => ({
                label: yieldStore.getSelectedDays[index],
                data: dataSet, // Y-axis data
                borderColor: yieldStore.lineColors[index], // Different color for each line
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                backgroundColor: hexToRGBA(yieldStore.lineColors[index], 0.3),
                fill: false,
            })),
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: "category",
                    labels: yieldStore.filteredLabelX,
                    ticks: {
                        font: {
                            size: adjustFontSize(),
                        },
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                    },
                },
                y: {
                    beginAtZero: false,
                    suggestedMin: getMinValue(yieldStore.allData),
                    suggestedMax: getMaxValue(yieldStore.allData),
                    ticks: {
                        font: {
                            size: adjustFontSize(),
                        }
                    },
                    title: {
                        display: displayYTitle,
                        text: yieldStore.language === "arm" ? "Արժեքը %-ով" : "Value in %",
                        font: {
                            weight: "bold",
                        },
                    },
                },
            },
        },
    });
}

function handleFillOption() {
    if (!myLineChart.value) return;

    myLineChart.value.data.datasets.forEach(dataset => {
        dataset.fill = isFilled.value ? false : "start";
    });

    isFilled.value = !isFilled.value
    myLineChart.value.update();
}


function hexToRGBA(hex, alpha = 0.5) {
    // Ensure hex is valid
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
        console.error("Invalid hex color:", hex);
        return hex;
    }

    // Convert shorthand hex (e.g., #abc) to full format (e.g., #aabbcc)
    if (hex.length === 4) {
        hex = "#" + [...hex.slice(1)].map((x) => x + x).join("");
    }

    // Parse RGB values
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Return RGBA string with transparency
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
</script>

<template>
    <div class="chartView">
        <div class="chart__menu">
            <div v-show="yieldStore.selectedCurve !== 'TBILL'">
                <button class="chart__menu_filterBut" :class="{ activeBut: yieldStore.filter === ',' }"
                    @click="yieldStore.setFilter(',')">
                    {{ yieldStore.language === "arm" ? 'Բոլորը' : 'All' }}
                </button>
                <button class="chart__menu_filterBut" :class="{ activeBut: yieldStore.filter === ',1' }"
                    @click="yieldStore.setFilter(',1')">
                    0-1 {{ yieldStore.language === "arm" ? 'տարիները' : 'years' }}
                </button>
                <button class="chart__menu_filterBut" :class="{ activeBut: yieldStore.filter === '2,5' }"
                    @click="yieldStore.setFilter('2,5')">
                    2-5 {{ yieldStore.language === "arm" ? 'տարիները' : 'years' }}
                </button>
                <button class="chart__menu_filterBut" :class="{ activeBut: yieldStore.filter === '7,' }"
                    @click="yieldStore.setFilter('7,')">
                    7-30 {{ yieldStore.language === "arm" ? 'տարիները' : 'years' }}
                </button>
            </div>
            <button class="chart__menu_filterBut" :class="{ activeBut: isFilled }" @click="handleFillOption()">
                {{ yieldStore.language === "arm" ? 'Լրացնել գծերը' : 'Fill lines' }}
            </button>
        </div>
        <canvas ref="chartCanvas" width="800" height="600"></canvas>
    </div>
</template>

<style scoped>
.chartView {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 3vh;
}

.chart__menu {
    width: 100%;
    display: flex;
    justify-content: space-between;
}

.chart__menu>div {
    width: fit-content;
    display: flex;
    gap: 6px;
}

.chart__menu>div:last-child {
    justify-self: flex-end;
}

.chart__menu_filterBut {
    width: fit-content;
    height: fit-content;
    padding: 5px 10px;
    background-color: transparent;
    border: 1px solid #d5d5d5;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
}

.chart__menu_filterBut:not(.activeBut):hover {
    border: 1px solid rgb(122, 177, 122);
}

.activeBut {
    border: 1px solid green;
}

canvas {
    height: 100% !important;
}

@media screen and (max-width: 700px) {
    .chart__menu>div {
        width: 60%;
        flex-wrap: wrap
    }
}

@media screen and (max-width: 380px) {
    .chart__menu_filterBut{
        font-size: 13px;
}
}


</style>