<script setup>
import { useCurveStore } from '@/stores/curveStore';
const curveStore = useCurveStore() 
</script>

<template>
    <div class="gridView">
        <table>
            <thead>
                <tr>
                    <th>{{ curveStore.language === 'arm' ? "Ժամկետայնություն" : 'Maturity' }}</th>
                    <th v-for="(day, index) in curveStore.getSelectedDays" :key="`gridDay${day}`"
                        :style="{ backgroundColor: curveStore.lineColors[index] }">{{ day }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, index) in curveStore.getLabels" :key="`row${row}`">
                    <td>{{ row }}</td>
                    <td v-for="value in curveStore.allData" :key="`rowValue${value}`">
                        {{ value[index] }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.gridView {
    width: 100%;
    height: 110%;
    overflow: auto;
}

.gridView table {
    width: 100%;
    max-height: 100%;
    border-collapse: collapse;
    border: 1px solid #EEE;
    box-shadow: 0px 1px 3px 3px rgb(242, 242, 242);
    position: relative;
}

.gridView thead {
    position: sticky;
    top: -1px;
}

.gridView thead tr {
    background: #808080;
    font-family: "Titillium";
}

.gridView th {
    padding: 1.2vh 2vw;
    font-size: 1.7vh;
    color: #fff;
}

.gridView tr:nth-child(2n) {
    background-color: #EEE;
}

.gridView td {
    text-align: center;
    padding: 0.4vh;
    border: 1px solid #EEE;
    font-size: 2vh;
}

.gridView td:first-child {
    width: 13vw;
}

@media screen and (max-width: 750px) {
    .gridView td {
        padding: 0.6vh;
        font-size: 1.8vh;
    }
}


@media screen and (max-width: 600px) {
    .gridView th{
        font-size: 1.2vh;
    }
    .gridView td {
        padding: 0.6vh;
        font-size: 1.1vh;
    }
}

@media screen and (max-width: 470px) {
    .gridView{
        height: 130%;
        margin-top: 90px;
    }
}
</style>