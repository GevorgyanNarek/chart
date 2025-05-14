<script setup>
import { ref, watch, shallowRef } from "vue"
import { useIndexStore } from "@/stores/indexStore";
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { enUS, hy } from 'date-fns/locale';

Chart.register(zoomPlugin);

const localeMap = {
    arm: hy,
    en: enUS
};

const indexStore = useIndexStore();
const chartCanvas = ref(null);
const myLineChart = shallowRef(null);
const defaultFontSize = 12;
const visibilityState = ref({});

function toggleVisibility(name) {
    visibilityState.value[name] = !visibilityState.value[name];
    updateChartCurve(); // Refresh chart visibility
}

const indexNames = [
    {
        en: "G03",
        arm: "G03"
    },
    {
        en: "G05",
        arm: "G05"
    },
    {
        en: "G5I",
        arm: "G5I"
    },
    {
        en: "GMI",
        arm: "GMI"
    },
    {
        en: "TBI",
        arm: "TBI"
    }
]

watch(
    () => indexStore.allData,
    (newValue) => {
        if (newValue) {
            updateChartCurve();
        }
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

// Update the chart with new data (index changed)
function updateChartCurve() {
    if (!myLineChart.value) {
        createChart();
    }

    myLineChart.value.options.scales.x.labels = [...indexStore.labelsX];
    myLineChart.value.data.datasets = [...Object.keys(indexStore.allData)].map((key, index) => ({
        label: key.toUpperCase(),
        data: [...indexStore.allData[key].map(el => el.value)], // Y-axis data
        borderColor: indexStore.colors[index], // Different color for each line
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointRotation: 90,
        pointStyle: 'line',
        hidden: !!visibilityState.value[key.toUpperCase()]

    }));

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



    myLineChart.value = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [...Object.keys(indexStore.allData)].map((key, index) => ({
                label: key,
                data: [...indexStore.allData[key].map(el => el.value)],
                borderColor: indexStore.colors[index],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                hidden: !!visibilityState.value[key]
            })),
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            const date = new Date(tooltipItems[0].parsed.x);
                            return format(new Date(date), 'PPP', { locale: localeMap[indexStore.language] }); // e.g. "2025 թ. ապրիլի 1"
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: 'x',
                        onZoom: (event) => {
                            
                            // Ensure the X-axis zoom is limited to the 2013 start date
                            if (event.chart.scales['x'].min < new Date('2013-01-01')) {
                                event.chart.scales['x'].min = new Date('2013-01-01');
                            }
                        }
                    },
                    limits: {
                        x: { minRange: 5 * 24 * 60 * 60 * 1000 } // Minimum 5 days zoom range
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    adapters: {
                        date: {
                            locale: localeMap[indexStore.language], // Set adapter locale
                        },
                    },
                    time: {
                        unit: 'month', // Show months by default
                        tooltipFormat: 'yyyy-MM-dd',
                        displayFormats: {
                            day: 'MMM dd',
                            month: 'MMM yyyy',
                        },
                    },
                    ticks: {
                        font: {
                            size: adjustFontSize(),
                        },
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0,
                    },
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: adjustFontSize(),
                        }
                    }
                }
            },
        },
    });
}
</script>

<template>
    <div class="chartView">
        <div class="chart__menu">
            <div v-for="(name, index) in indexNames" :key="`yield${name}`" class="header__menu_index">
                <div class="header__menu_index_color" :style="{ background: indexStore.colors[index] }"></div>
                <span>
                    {{ indexStore.language === 'arm' ? name.arm : name.en }}
                </span>
                <button class="header__menu_index_visibleBut" @click="toggleVisibility(name.en)">
                    <img v-if="!visibilityState[indexStore.language === 'arm' ? name.arm : name.en]"
                        src="@/assets/icons/visibility.svg" alt="" />
                    <img v-else src="@/assets/icons/visibility_off.svg" alt="" />
                </button>
            </div>
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
    gap: 10px;
    flex-wrap: wrap;
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


.header__menu_index {
    width: 90px;
    height: 28px;
    display: flex;
    align-items: center;
    background-color: #f4f4f4;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
    font-size: 15px;
}

.header__menu_index>span {
    padding-left: 10px;
}

.header__menu_index_color {
    width: 10px;
    height: 100%;
}

.header__menu_index>button {
    position: absolute;
    top: 4px;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    border-radius: 4px;
    opacity: .6;
    cursor: pointer;
}

.header__menu_index>button:hover {
    opacity: 1;
}

.header__menu_index>button>img {
    width: 15px;
    height: 15px;
    object-fit: contain;
    object-position: center;
}

.header__menu_index_visibleBut {
    right: 4px;
    border: 1px solid #db9303;
}

</style>