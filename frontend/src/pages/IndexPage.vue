<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useIndexStore } from "@/stores/indexStore";
import IndexCalendar from "@/components/Index/IndexCalendar.vue";
import IndexChart from "@/components/Index/IndexChart.vue";
import IndexGrid from "@/components/Index/IndexGrid.vue";

const indexStore = useIndexStore();
const showChart = ref(true);
const showCalendar = ref(false);
const calendarRef = ref(null);

// Store date input and previous valid range
const dateRangeInput = ref(`${indexStore.startDate} - ${indexStore.endDate}`);

const downloadItems = [
    {
        title: {
            eng: 'Selected range',
            arm: 'Ընտրված միջակայք'
        },
        fileName: "range",
        type: 'range'
    },
    {
        title: {
            eng: 'Current year',
            arm: 'Ընթացիկ տարի'
        },
        fileName: "currentYear",
        type: 'currentYear'
    },
    {
        title: {
            eng: 'All years',
            arm: 'Բոլոր տարիներ'
        },
        fileName: "all",
        type: 'all',
        isLarge: true
    },
]

watch(
    () => [indexStore.startDate, indexStore.endDate],
    ([start, end]) => {
        const formatted = `${start} - ${end}`;
        dateRangeInput.value = formatted;
    }
);

function toggleCalendar() {
    showCalendar.value = !showCalendar.value
}

function toggleView() {
    showChart.value = !showChart.value
}

const handleClickOutside = (event) => {
    if (calendarRef.value && !calendarRef.value.contains(event.target)) {
        showCalendar.value = false;
    }
};

function handleDateChange() {
    indexStore.setDateRange(dateRangeInput.value);
    // Sync input value again in case it was invalid
    dateRangeInput.value = `${indexStore.startDate} - ${indexStore.endDate}`;
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
    indexStore.getLanguageFromParam();
    indexStore.fetchData();
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
    <div class="index">
        <header>
            <div class="header__menu">
                <div class="header__date" ref="calendarRef">
                    <input type="text" class="header__date_item" placeholder="YYYY-MM-DD - YYYY-MM-DD"
                        v-model="dateRangeInput" @blur="handleDateChange" />
                    <button class="header__date_calendarBut" @click="toggleCalendar">
                        <img src="@/assets/icons/calendar_add.svg" alt="" />
                    </button>
                    <div v-if="showCalendar" class="calendar__container">
                        <IndexCalendar />
                    </div>
                </div>
                <button @click="toggleView" class="header__menu_toggleBut">
                    {{
                        showChart ? indexStore.language === 'arm' ? 'Ցուցադրել աղյուսակի տեսքը' : 'Show Grid View' :
                            indexStore.language === 'arm' ? 'Ցուցադրել գծապատկերի տեսքը' : 'Show Chart View'
                    }}
                </button>
            </div>
        </header>
        <main>
            <IndexChart v-show="showChart" />
            <IndexGrid v-show="!showChart" />
        </main>

        <footer>
            <h3>
                {{ indexStore.language === "arm" ? 'Ներբեռնումներ' : 'Downloads' }}
            </h3>
            <div v-for="(item, index) in downloadItems" :key="index" class="footer__dowload">
                <span>- {{ indexStore.language === "arm" ? item.title.arm : item.title.eng }} -</span>
                <button class="downBut" @click="indexStore.downloadJSON(`${item.fileName}IndexData.json`, item.type)">
                    JSON
                </button>
                <button class="downBut" @click="indexStore.downloadCSV(`${item.fileName}IndexData.csv`, item.type)">
                    CSV
                </button>
                <button class="downBut" @click="indexStore.downloadXML(`${item.fileName}IndexData.xml`, item.type)">
                    XML
                </button>
                <span v-if="item.isLarge">
                    {{ indexStore.language === "arm" ? '(մեծ ֆայլ)' : '(large file)' }}
                </span>
            </div>
        </footer>
    </div>
</template>


<style scoped>
.index {
    width: 100%;
    height: 1000px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

/* ---------------- HEADER ------------------  */
header {
    width: 98%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 2vh;
    border-bottom: 1px solid #d5d5d5;
}

.header__date {
    display: flex;
    flex-wrap: wrap;
    position: relative;
}

.header__date_item {
    width: 210px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f4f4f4;
    border-radius: 4px 0 0 4px;
    border: 1px solid #d5d5d5;
    outline: none;
    font-size: 16px;
    padding-left: 10px;
}

.header__date_calendarBut {
    width: 40px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #003299;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    outline: none;
    border: none;
    transition: .2s;
}

.header__date_calendarBut:hover {
    background-color: #4076bf;
}

.header__menu {
    display: flex;
    justify-content: space-between;
}


.header__menu_yieldBut {
    background-color: transparent;
    border: none;
    border-left: 1px solid #d5d5d5;
    padding: 0 14px;
    color: #003299;
    font-size: 16px;
    cursor: pointer;
}

.header__menu_yieldBut:first-child {
    border-left: none;
}

.activeYieldBut {
    font-weight: 800;
    text-decoration: underline;
}

.header__menu_yieldBut:not(.activeYieldBut):hover {
    text-decoration: underline;
}

.header__menu_toggleBut {
    width: fit-content;
    min-height: 35px;
    padding: 0 20px;
    background-color: rgb(255, 174, 0);
    border: 3px solid rgb(255, 174, 0);
    border-radius: 5px;
    color: #fff;
    outline: none;
    cursor: pointer;
    transition: .5s;
}

.header__menu_toggleBut:hover {
    background-color: transparent;
    color: rgb(255, 174, 0);
}

/* ---------------- MAIN ------------------  */
main {
    width: 98%;
    height: 60%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2vh 0 3vh;
}

/* --------------- FOOTER ------------------- */
footer {
    width: 98%;
    padding: 5vh 0;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

footer h3 {
    font-size: 20px;
    color: #003299;
}

.footer__dowload {
    display: flex;
    gap: 14px;
    color: #6c6c6c;
    font-size: 18px;
}

.footer__dowload span {
    font-size: 15px;
}

.footer__dowload>button {
    background: none;
    border: none;
    color: #003299;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 18px;
}

.footer__dowload>button:hover {
    opacity: 1;
    text-decoration: underline;
}

.footer__dowload>button>img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}


@media screen and (max-width: 900px) {
    main {
        width: 98%;
        height: 55%;
    }
}

@media screen and (max-width: 750px) {
    main {
        height: 50%;
    }
}

@media screen and (max-width: 700px) {
    footer {
        padding: 85px 0 3vh;
    }

    footer h3 {
        font-size: 20px;
    }

    .footer__dowload>button {
        font-size: 16px;
    }

    .footer__dowload span {
        font-size: 15px;
    }
}

@media screen and (max-width: 600px) {
    .header__menu {
        flex-direction: column;
        gap: 8px;
    }
}

@media screen and (max-width: 450px) {
    footer {
        padding: 110px 0 3vh;
    }

    footer h3 {
        font-size: 17px;
    }

    .footer__dowload span {
        font-size: 14px;
    }

    .footer__dowload>button {
        font-size: 15px;
    }
}

@media screen and (max-width: 380px) {
    .header__date_item {
        width: 150px;
    }

    .header__date_item>span {
        font-size: 12px;
    }

    footer {
        padding: 130px 0 3vh;
    }

    .footer__dowload span {
        font-size: 12px;
    }

    .footer__dowload>button {
        font-size: 14px;
    }
}
</style>