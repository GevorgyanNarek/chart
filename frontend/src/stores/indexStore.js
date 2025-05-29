import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Axios from "axios";

const today = new Date();
const day = String(today.getDate()).padStart(2, "0");
const month = String(today.getMonth() + 1).padStart(2, "0");
const year = today.getFullYear();

export const useIndexStore = defineStore("indexStore", () => {
  // State
  const chartDataReady = ref(false);
  const startDate = ref(`01/01/${year - 1}`);
  const endDate = ref(`${day}/${month}/${year}`);
  const language = ref("en");
  const errorMsg = ref("");

  const colors = ["#0E4A2D", "#003299", "#b25b2e", "#971f8f", "#F2B518"];

  const labelsX = ref([]);
  const allData = ref({});

  const getLanguageFromParam = () => {
    const params = new URLSearchParams(window.location.search);
    language.value = params.get("lang") || "en"; // Get language or default to 'en'
  };

  const getLabels = computed(() => {
    return language.value == "arm"
      ? labelsX.value.map((el) => {
          return el
            .replace(/\bday\b/g, "օր")
            .replace(/\bmonth\b/g, "ամիս")
            .replace(/\byear\b/g, "տարի");
        })
      : labelsX.value;
  });

  // Actions
  const fetchData = async () => {
    try {
      const response = await Axios.post(
        `${import.meta.env.VITE_API_URL}/api/index-data/date-range`,
        {
          startDate: startDate.value,
          endDate: endDate.value,
        }
      );

      handleDataLoad(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleDataLoad = (resData) => {
    chartDataReady.value = true;
    allData.value = resData.data;
    labelsX.value = resData.labelsX;
  };

  const changeDates = (day, month, year) => {
    const newDate = `${day}/${month}/${year}`;
    if (endDate.value) {
      startDate.value = newDate;
      endDate.value = "";
    } else {
      if (toDate(newDate) > toDate(startDate.value)) {
        endDate.value = newDate;
      } else {
        endDate.value = startDate.value;
        startDate.value = newDate;
      }
      fetchData();
    }
  };

  const setDateRange = (input) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const [start, end] = input.split(" - ");
    console.log(input);
    

    // Validate format first
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      console.warn("Invalid date format. Expected DD/MM/YYYY.");
      return;
    }

    const [startDay, startMonth, startYear] = start.split("/");
    const [endDay, endMonth, endYear] = end.split("/");

    const startDt = new Date(`${startYear}-${startMonth}-${startDay}`);
    const endDt = new Date(`${endYear}-${endMonth}-${endDay}`);
    // Validate logical order
    if (startDt >= endDt) {
      console.warn("End date must be after start date");
      return;
    }

    // Set dates if valid
    startDate.value = start;
    endDate.value = end;
    fetchData();
  };

  const toDate = (str) => {
    const [day, month, year] = str.split("/");
    return new Date(+year, month - 1, +day);
  };

  const downloadJSON = async (fileName, type) => {
    let data;
    switch (type) {
      case "range":
        data = allData.value;

        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/current-year`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/all`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
    }
    const jsonData = JSON.stringify(data, null, 2);
    downloadFile(fileName, jsonData, "application/json");
  };

  const downloadCSV = async (fileName, type) => {
    let data;
    switch (type) {
      case "range":
        data = allData.value;

        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/current-year`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/all`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
    }
    const csvData = convertToCSV(data);
    downloadFile(fileName, csvData, "text/csv");
  };

  const downloadXML = async (fileName, type) => {
    let data;
    switch (type) {
      case "range":
        data = allData.value;

        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/current-year`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/index-data/all`
          );

          if (response.status === 200) {
            data = response.data.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
    }
    const xmlData = convertToXML(data);
    downloadFile(fileName, xmlData, "application/xml");
  };

  // Helper function to convert data to CSV format
  function convertToCSV(data) {
    const keys = Object.keys(data); // e.g., ['g03', 'g05']
    const dates = data[keys[0]].map((entry) => entry.date); // assuming all have the same dates

    // Create the header
    const header = ["date", ...keys].join(",");

    // Create each row: date + values from each key
    const rows = dates.map((date, index) => {
      const values = keys.map((key) => data[key][index].value);
      return [date, ...values].join(",");
    });

    return [header, ...rows].join("\n");
  }

  function convertToXML(data) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';

    let xmlData = "";

    // Iterate over each key (e.g., "g03", "g05")
    for (const [maturityKey, entries] of Object.entries(data)) {
      entries.forEach((entry) => {
        xmlData += `<entry>\n`;
        xmlData += `  <date>${entry.date}</date>\n`;
        xmlData += `  <maturity key="${maturityKey}">${entry.value}</maturity>\n`;
        xmlData += `</entry>\n`;
      });
    }

    return `${xmlHeader}<data>\n${xmlData}</data>`;
  }

  // Helper function to download a file
  const downloadFile = (filename, data, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    labelsX,
    allData,
    chartDataReady,
    colors,
    startDate,
    endDate,
    language,
    errorMsg,
    getLabels,
    fetchData,
    setDateRange,
    changeDates,
    handleDataLoad,
    downloadJSON,
    downloadCSV,
    downloadXML,
    getLanguageFromParam,
  };
});
