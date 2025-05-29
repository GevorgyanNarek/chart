<script setup>
import { useIndexStore } from '@/stores/indexStore';

const indexStore = useIndexStore()


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

</script>

<template>
    <div class="gridView">
        <table>
            <thead>
                <tr>
                    <th>{{ indexStore.language === 'arm' ? "Ամսաթիվ" : 'Date' }}</th>
                    <th v-for="(name) in indexNames" :key="`grid${name}`">
                        {{ name[indexStore.language] }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, index) in indexStore.labelsX" :key="`row${row}`">
                    <td>{{ row }}</td>
                    <td v-for="(key, i) in Object.keys(indexStore.allData)" :key="`row-${key}`">
                        {{ indexStore.allData[key][index]?.value }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.gridView {
    width: 100%;
    height: 102%;
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

.gridView123 thead {
    position: sticky;
    top: -2px;
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
/* 
.gridView td:first-child {
    width: 13vw;
} */

@media screen and (max-width: 750px) {
    .gridView td {
        padding: 0.6vh;
        font-size: 1.8vh;
    }
}


@media screen and (max-width: 600px) {
    .gridView th {
        font-size: 1.2vh;
    }

    .gridView td {
        padding: 0.6vh;
        font-size: 1.1vh;
    }
}

@media screen and (max-width: 470px) {
    .gridView {
        height: 130%;
        margin-top: 90px;
    }
}
</style>