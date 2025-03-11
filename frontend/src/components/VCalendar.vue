<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCurveStore } from '@/stores/curveStore';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { hy } from 'date-fns/locale';

const curveStore = useCurveStore()

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const currentDay = currentDate.getDate();

const selectedYear = ref(currentYear);
const selectedMonth = ref(currentMonth);
const weekDays = computed(() => {
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((_, i) =>
        format(new Date(2022, 0, i + 3), 'eee', { locale: curveStore.language === "arm" ? hy : enUS }).toUpperCase()
    );
});

const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(0, i), 'MMM', { locale: curveStore.language === "arm" ? hy : enUS })
);

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const firstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

const daysArray = computed(() => {
    let emptyFieldsCount = firstDayOfMonth(selectedYear.value, selectedMonth.value) - 1;
    if (emptyFieldsCount < 0) emptyFieldsCount = 6;
    return [
        ...Array(emptyFieldsCount).fill(''),
        ...Array.from({ length: daysInMonth(selectedYear.value, selectedMonth.value) }, (_, i) => i + 1)
    ];
});

const getCellClass = (day, index) => {
    if (!day) return 'cell--empty';

    if (index % 7 === 6 || index % 7 === 5) {
        return 'cell--blocked'
    }

    if (selectedMonth.value === currentMonth && selectedYear.value === currentYear && day === currentDay) {
        return 'cell--today';
    }

    if (curveStore.selectedDays.has(
        `${selectedYear.value}/${selectedMonth.value}/${day < 10 ? "0" + day : day}`
    )) {
        return 'cell--active'
    }

    return '';
};


const goToPrevMonth = () => {
    if (selectedMonth.value === 1) {
        selectedMonth.value = 12;
        selectedYear.value--;
    } else {
        selectedMonth.value--;
    }
};

const goToNextMonth = () => {
    if (selectedMonth.value === 12) {
        selectedMonth.value = 1;
        selectedYear.value++;
    } else {
        selectedMonth.value++;
    }
};

const updateCalendar = () => {
    if (selectedYear.value < 2016) selectedYear.value = 2016;
    if (selectedYear.value > currentYear) {
        selectedYear.value = currentYear;
        selectedMonth.value = currentMonth
    }
};

onMounted(updateCalendar);
</script>

<template>
    <div class="calendar">
        <div class="calendar__head">
            <div class="calendar__head_arrow arrowLeft" @click="goToPrevMonth">
                <img src="@/assets/icons/arrow_left.svg" alt="" />
            </div>
            <div class="calendar_head_date">
                <select class="calendar_head_date_month" v-model="selectedMonth" @change="updateCalendar">
                    <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
                </select>
                <input type="number" class="calendar_head_date_year" v-model="selectedYear" min="2016"
                    @change="updateCalendar" />
            </div>
            <div class="calendar__head_arrow arrowRight" @click="goToNextMonth">
                <img src="@/assets/icons/arrow_right.svg" alt="" />
            </div>
            <!-- v-if="selectedYear !== currentYear && selectedMonth !== currentMonth" -->
        </div>
        <div class="calendar__body">
            <div v-for="weekDay in weekDays" :key="`week${weekDay}`" class="cell cell--unselectable">{{ weekDay }}</div>
            <div v-for="(day, index) in daysArray" :key="`day${index}`" class="cell" :class="getCellClass(day, index)"
                @click="curveStore.toggleDay(day, months[selectedMonth - 1], selectedYear)">
                {{ day }}
            </div>
        </div>
        <div class="calendar__message" v-if="curveStore.errorMsg">
            {{ curveStore.language === "arm" ?
                "Առկա չէ տվյալներ " + curveStore.errorMsg :
                "Data unavailable on " + curveStore.errorMsg
            }}
        </div>
    </div>
</template>
<style scoped>
/* ------------------- Calendar -------------------- */

.calendar {
    width: 270px;
    height: fit-content;
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-radius: 5px;
    background-color: #fff;
    color: black;
    padding: 5px;
    -webkit-box-shadow: 0px 1px 3px 0px rgba(34, 60, 80, 0.76);
    -moz-box-shadow: 0px 1px 3px 0px rgba(34, 60, 80, 0.76);
    box-shadow: 0px 1px 3px 0px rgba(34, 60, 80, 0.76);
}

.calendar__head {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #000;
    padding: 7px 0 13px;
}

.calendar_head_date {
    display: flex;
    gap: 12px;
}

.calendar__body {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: max-content;
    grid-auto-flow: row;
    place-items: center;
}

.calendar_head_date_year {
    appearance: none;
    width: 70px;
    font-size: 20px;
    padding-left: 4px;
    border-bottom: 1px solid #6c6c6c;
    border: none;
    outline: none;
}

.calendar_head_date_month {
    font-size: 22px;
    border: none;
    cursor: pointer;
}

#calendar_head_date_month>option {
    font-size: 20px;
    padding: 10px;
}

.calendar__head_arrow {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    cursor: pointer;
}

.calendar__head_arrow:hover {
    opacity: .65;
}

.calendar__head_arrow>img {
    height: 100%;
    object-position: center;
    object-fit: contain;
}

.cell {
    width: 98%;
    text-align: center;
    padding: 6px 0;
    font-size: 15px;
    border-radius: 3px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.cell:hover:not(.cell--unselectable, .cell--blocked) {
    color: hsl(231, 20%, 85%);
    background-color: #003299;
}

.cell:not(.cell--unselectable, .cell--blocked) {
    cursor: pointer;
}

.cell--blocked {
    user-select: none;
    opacity: .4;
    cursor: no-drop;
}

.cell:empty {
    width: 0;
    padding: 0;
}

.cell--unselectable {
    font-size: 12px;
    color: #003299;
}

.cell--unselectable:hover,
.cell--unselectable:focus {
    color: hsl(231, 20%, 50%);
    background-color: transparent;
}

.cell--active {
    color: hsl(231, 20%, 85%);
    background-color: #003299;
}

.cell--today {
    border: 1px solid #aaaaaa;
}

.calendar__message{
    width: 100%;
    padding: 5px;
    font-size: 14px;
    color: #003299;
    margin-top: 5px;
    border-top: 1px solid #6c6c6c;
}
</style>