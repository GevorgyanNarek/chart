<script setup>
import { ref, onMounted } from "vue";
import ChartView from "@/components/ChartView.vue";
import GridView from "@/components/GridView.vue";
import VCalendar from "@/components/VCalendar.vue";
import { useCurveStore } from "@/stores/curveStore";

const curveStore = useCurveStore();
const showChart = ref(true);
const showCalendar = ref(false);
const curveNames = [
  {
    eng: "YIELD",
    arm: "Մինչև մարում"
  },
  {
    eng: "SPOT",
    arm: "Սպոտ"
  },
  {
    eng: "TBILL",
    arm: "Զեղչատոկոսային պարտատոմսեր"
  }
]
const visibilityState = ref({}); // Local state to track visibility for each day
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
  curveStore.toggleLineInChart(day);
}


onMounted(() => {
  curveStore.getLanguageFromParam()
  curveStore.fetchData();
});

</script>

<template>
  <div class="board">
    <header>
      <div class="header__date">
        <div v-for="(day, index) in curveStore.getSelectedDays" :key="`headerDay${day}`" class="header__date_item">
          <div class="header__date_item_color" :style="{ background: curveStore.lineColors[index] }"></div>
          <span>{{ day }}</span>
          <button class="header__date_item_visibleBut">
            <img v-if="!visibilityState[day]" src="@/assets/icons/visibility.svg" alt=""
              @click="toggleVisibility(day)">
            <img v-else src="@/assets/icons/visibility_off.svg" alt="" @click="toggleVisibility(day)">
          </button>
          <button class="header__date_item_closeBut">
            <img src="@/assets/icons/close.svg" alt="" @click="curveStore.removeDay(day)">
          </button>
        </div>
        <div class="header__date_calendarBut">
          <img src="@/assets/icons/calendar_add.svg" alt="" @click="toggleCalendar" />
        </div>
        <VCalendar v-if="showCalendar" />
      </div>
      <div class="header_menu">
        <div>
          <button v-for="name in curveNames" :key="`curve${name}`" class="header_menu_curveBut"
            :class="{ activeCurveBut: curveStore.selectedCurve === name.eng }"
            @click="curveStore.changeSelectedCurve(name.eng)">
            {{ curveStore.language === 'arm' ? name.arm : name.eng }}
          </button>
        </div>
        <button @click="toggleView" class="header_menu_toggleBut">
          {{
            showChart ? curveStore.language === 'arm' ? 'Ցուցադրել աղյուսակի տեսքը' : 'Show Grid View' :
              curveStore.language === 'arm' ? 'Ցուցադրել գծապատկերի տեսքը' : 'Show Chart View'
          }}
        </button>
      </div>
    </header>
    <main>
      <ChartView v-show="showChart" />
      <GridView v-show="!showChart" />
    </main>

    <footer>
      <h3>
        {{ curveStore.language === "arm" ? 'Ներբեռնումներ' : 'Downloads' }}
      </h3>
      <div v-for="(item, index) in downloadItems" :key="index" class="footer__dowload">
        <span>- {{ curveStore.language === "arm" ? item.title.arm : item.title.eng }} -</span>
        <button class="downBut" @click="curveStore.downloadJSON(`${item.fileName}CurveData.json`, item.type)">
          JSON
        </button>
        <button class="downBut" @click="curveStore.downloadCSV(`${item.fileName}CurveData.csv`, item.type)">
          CSV
        </button>
        <button class="downBut" @click="curveStore.downloadXML(`${item.fileName}CurveData.xml`, item.type)">
          XML
        </button>
        <span v-if="item.isLarge">
          {{ curveStore.language === "arm" ? '(մեծ ֆայլ)' : '(large file)' }}
        </span>
      </div>
    </footer>
  </div>
</template>


<style scoped>
.board {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5vh 0;
  position: relative;
}

/* ---------------- HEADER ------------------  */

header {
  width: 70%;
  height: 100%;
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
}

.header__date_item>span {
  font-size: 16px;
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

.header_menu_curveBut {
  background-color: transparent;
  border: none;
  border-left: 1px solid #d5d5d5;
  padding: 0 14px;
  color: #003299;
  font-size: 16px;
  cursor: pointer;
}

.header_menu_curveBut:first-child {
  border-left: none;
}

.activeCurveBut {
  font-weight: 800;
  text-decoration: underline;
}

.header_menu_curveBut:not(.activeCurveBut):hover {
  text-decoration: underline;
}

.header_menu_toggleBut {
  width: fit-content;
  height: 35px;
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
  width: 70%;
  height: 75vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2vh 0 3vh;
}

/* --------------- FOOTER ------------------- */
footer {
  width: 70%;
  padding: 5vh 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

footer h3 {
  font-size: 23px;
  color: #003299;
}

.footer__dowload {
  display: flex;
  gap: 14px;
  color: #6c6c6c;
  font-size: 18px;
}

.footer__dowload span {
  font-size: 16px;
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

@media screen and (max-width: 1200px) {
  header,
  main,
  footer {
    width: 90%;
  }
}


@media screen and (max-width: 900px) {
  header,
  main,
  footer {
    width: 95%;
  }

  .header_menu {
    flex-direction: column;
    gap: 20px;
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

  .header_menu_curveBut,
  .footer__dowload span {
    font-size: 15px;
  }

  .header__date_item>button {
    top: 5px;
  }

  footer {
    padding: 12vh 0 3vh;
  }

  footer h3 {
    font-size: 20px;
  }

  .footer__dowload>button {
    font-size: 16px;
  }
}

@media screen and (max-width: 600px) {
  .header__date_item {
    width: 200px;
    height: 35px;
  }

  .header__date_item>span {
    font-size: 16px;
  }

  .header_menu_curveBut {
    width: 33%;
    font-size: 15px;
    line-height: 25px;
  }

  .header_menu>div {
    width: 100%;
  }

  .header__date_item>button {
    top: 7px;
  }
}

@media screen and (max-width: 450px) {
  .header_menu_curveBut {
    width: 27%;
    font-size: 14px;
  }

  footer {
    padding: 16vh 0 3vh;
  }

  .header_menu_toggleBut{
    height: 30px;
    padding: 0 15px;
    border-radius: 5px;
    border-width: 2px;
  }
}

@media screen and (max-width: 400px) {
  footer {
    padding: 18vh 0 3vh;
  }
}
</style>