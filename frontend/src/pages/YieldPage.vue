<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useYieldStore } from "@/stores/yieldStore";
import YieldChart from "@/components/Yield/YieldChart.vue";
import YieldGrid from "@/components/Yield/YieldGrid.vue";
import YieldCalendar from "@/components/Yield/YieldCalendar.vue";

const yieldStore = useYieldStore();
const showChart = ref(true);
const showCalendar = ref(false);
const calendarRef = ref(null);
const visibilityState = ref({});

const yieldNames = [
  {
    eng: "YIELD TO MATURITY",
    arm: "Մինչև մարում եկամտաբերություն"
  },
  {
    eng: "SPOT",
    arm: "Սփոթ եկամտաբերություն"
  },
  {
    eng: "TBILL",
    arm: "Զեղչատոկոսային պարտատոմսերի եկամտաբերություն"
  }
]
const downloadItems = [
  {
    title: {
      eng: 'Filtered days',
      arm: 'Զտված օրեր'
    },
    fileName: "filtered",
    type: 'filter'
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

function toggleCalendar() {
  showCalendar.value = !showCalendar.value
}

function toggleView() {
  showChart.value = !showChart.value
}

function toggleVisibility(day) {
  visibilityState.value[day] = !visibilityState.value[day];
  yieldStore.toggleLineInChart(day);
}

const handleClickOutside = (event) => {
  if (calendarRef.value && !calendarRef.value.contains(event.target)) {
    showCalendar.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  yieldStore.getLanguageFromParam();
  yieldStore.fetchData();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});


</script>

<template>
  <div class="yield">
    <header>
      <div class="header__date">
        <div v-for="(day, index) in yieldStore.getSelectedDays" :key="`headerDay${day}`" class="header__date_item">
          <div class="header__date_item_color" :style="{ background: yieldStore.lineColors[index] }"></div>
          <span>{{ day }}</span>
          <button class="header__date_item_visibleBut">
            <img v-if="!visibilityState[day]" src="@/assets/icons/visibility.svg" alt="" @click="toggleVisibility(day)">
            <img v-else src="@/assets/icons/visibility_off.svg" alt="" @click="toggleVisibility(day)">
          </button>
          <button class="header__date_item_closeBut">
            <img src="@/assets/icons/close.svg" alt="" @click="yieldStore.removeDay(day)">
          </button>
        </div>
        <div ref="calendarRef">
          <div class="header__date_calendarBut">
            <img src="@/assets/icons/calendar_add.svg" alt="" @click="toggleCalendar" />
          </div>
          <YieldCalendar v-if="showCalendar" />
        </div>
      </div>
      <div class="header_menu">
        <div>
          <button v-for="name in yieldNames" :key="`yield${name}`" class="header_menu_yieldBut"
            :class="{ activeYieldBut: yieldStore.selectedYield === name.eng.split(' ')[0] }"
            @click="yieldStore.changeSelectedYield(name.eng)">
            {{ yieldStore.language === 'arm' ? name.arm : name.eng }}
          </button>
        </div>
        <button @click="toggleView" class="header_menu_toggleBut">
          {{
            showChart ? yieldStore.language === 'arm' ? 'Ցուցադրել աղյուսակի տեսքը' : 'Show Grid View' :
              yieldStore.language === 'arm' ? 'Ցուցադրել գծապատկերի տեսքը' : 'Show Chart View'
          }}
        </button>
      </div>
    </header>
    <main>
      <YieldChart v-show="showChart" />
      <YieldGrid v-show="!showChart" />
    </main>

    <footer>
      <h3>
        {{ yieldStore.language === "arm" ? 'Ներբեռնումներ' : 'Downloads' }}
      </h3>
      <div v-for="(item, index) in downloadItems" :key="index" class="footer__dowload">
        <span>- {{ yieldStore.language === "arm" ? item.title.arm : item.title.eng }} -</span>
        <button class="downBut" @click="yieldStore.downloadJSON(`${item.fileName}YieldData.json`, item.type)">
          JSON
        </button>
        <button class="downBut" @click="yieldStore.downloadCSV(`${item.fileName}YieldData.csv`, item.type)">
          CSV
        </button>
        <button class="downBut" @click="yieldStore.downloadXML(`${item.fileName}YieldData.xml`, item.type)">
          XML
        </button>
        <span v-if="item.isLarge">
          {{ yieldStore.language === "arm" ? '(մեծ ֆայլ)' : '(large file)' }}
        </span>
      </div>
    </footer>
  </div>
</template>


<style scoped>
.yield {
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
  gap: 8px;
  position: relative;
}

.header__date_calendarBut {
  width: 40px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #003299;
  border-radius: 6px;
  cursor: pointer;
  transition: .2s;
}

.header__date_calendarBut:hover {
  background-color: #4076bf;
}

.header__date_item {
  width: 190px;
  height: 35px;
  display: flex;
  align-items: center;
  background-color: #f4f4f4;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  font-size: 16px;
}

.header__date_item>span {
  padding-left: 10px;
}

.header__date_item_color {
  width: 10px;
  height: 100%;
}

.header__date_item>button {
  position: absolute;
  top: 7px;
  width: 23px;
  height: 23px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 4px;
  opacity: .6;
  cursor: pointer;
}

.header__date_item>button:hover {
  opacity: 1;
}

.header__date_item>button>img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  object-position: center;
}

.header__date_item_closeBut {
  right: 4px;
  border: 1px solid #f00;
}

.header__date_item_visibleBut {
  right: 31px;
  border: 1px solid #db9303;
}

.header_menu {
  display: flex;
  justify-content: space-between;
}

.header_menu>div {
  display: flex;
}

.header_menu_yieldBut {
  background-color: transparent;
  border: none;
  border-left: 1px solid #d5d5d5;
  padding: 0 14px;
  color: #003299;
  font-size: 16px;
  cursor: pointer;
}

.header_menu_yieldBut:first-child {
  border-left: none;
}

.activeYieldBut {
  font-weight: 800;
  text-decoration: underline;
}

.header_menu_yieldBut:not(.activeYieldBut):hover {
  text-decoration: underline;
}

.header_menu_toggleBut {
  width: fit-content;
  min-height: 35px;
  padding: 0 20px;
  background-color: rgb(255, 174, 0);
  border: 3px solid rgb(255, 174, 0);
  border-radius: 10px;
  color: #fff;
  outline: none;
  cursor: pointer;
  transition: .5s;
}

.header_menu_toggleBut:hover {
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
  .header_menu {
    flex-direction: column;
    gap: 20px;
  }

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
  .header__date_item {
    width: 170px;
    height: 32px;
  }

  .header__date_item>span {
    font-size: 14px;
  }

  .header_menu_yieldBut,
  .footer__dowload span {
    font-size: 15px;
  }

  .header__date_item>button {
    top: 5px;
  }

  footer {
    padding: 85px 0 3vh;
  }

  footer h3 {
    font-size: 20px;
  }

  .footer__dowload>button {
    font-size: 16px;
  }
}

@media screen and (max-width: 600px) {
  .board {
    width: 100%;
  }

  .header__date_item {
    width: 200px;
    height: 32px;
  }

  .header__date_calendarBut {
    height: 32px;
  }

  .header_menu_yieldBut {
    font-size: 14px;
    line-height: 25px;
  }

  .header_menu>div {
    width: 100%;
  }

  .header__date_item>button {
    top: 5px;
  }
}

@media screen and (max-width: 550px) {
  .header_menu>div {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .header_menu_yieldBut {
    text-align: left;
    font-size: 15px;
    line-height: 17px;
    padding: 0;
  }

  .header_menu_yieldBut {
    border-left: none;
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

  main {
    height: 45%;
  }

  .header__date_item {
    width: 170px;
    font-size: 14px;
  }

  .header__date_item>button {
    top: 5px;
  }

  .header_menu_yieldBut {
    font-size: 14px;
  }

  .header_menu_toggleBut {
    height: 30px;
    padding: 0 15px;
    border-radius: 5px;
    border-width: 2px;
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