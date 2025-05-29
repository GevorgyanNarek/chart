import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Axios from "axios";
import { parse, format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import { hy } from "date-fns/locale";

export const useYieldStore = defineStore("yieldStore", () => {
  // State
  const chartDataReady = ref(false);
  const filter = ref(",");
  const newLineData = ref({});
  const removedLineIndex = ref(-1);
  const toggleKey = ref(0);
  const removeKey = ref(0);
  const toggleLineIndex = ref(-1);
  const lineColors = ref(["#F2B518"]);
  const language = ref("en");
  const errorMsg = ref("");

  let sliceStart = 0;
  let sliceEnd = 0;
  let colors = ["#0E4A2D", "#003299", "#b25b2e", "#971f8f", "#B9BEBE"];

  const labelsX = ref([]);
  const filteredLabelX = ref([]);
  const selectedCurve = ref("YIELD");
  const selectedDays = ref(new Set()); // Stores active chart lines
  const allData = ref([]); // Stores all data
  const filteredData = ref([]); // Stores filtered/manipulated data for rendering

  // Computed property to convert selectedDays to an array
  const getSelectedDays = computed(() => {
    return Array.from(selectedDays.value).map((date) => {
      let [year, month, day] = date.split("/");
      return `${day} ${getMonthName(year, month)} ${year}`; // Convert yyyy-mm-dd to yyyy/mm/dd
    });
  });

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
  const fetchData = async (dates = []) => {
    if (!Array.isArray(dates)) {
      return;
    }
    console.log(dates);

    const requestDates = [...dates];

    try {
      const response = await Axios.post(
        `${import.meta.env.VITE_API_URL}/api/yield-data/by-dates`,
        {
          curve: selectedCurve.value,
          dates: requestDates,
        }
      );

      if (!dates || dates.length === 0) {
        dates = response.data.map((el) => {
          return format(parseISO(el.date), "yyyy/MM/dd");
        });
      }
      console.log(dates);

      handleDataLoad(response.data, dates);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleDataLoad = (resData, dates) => {
    if (allData.value.length) {
      handleChangeCurve(resData);
    } else {
      selectedDays.value.add(dates[0]);
      labelsX.value = resData[0].margins;
      sliceEnd = labelsX.length;

      filteredLabelX.value =
        language.value == "arm"
          ? labelsX.value.map((el) => {
              return el
                .replace(/\bday\b/g, "օր")
                .replace(/\bmonth\b/g, "ամիս")
                .replace(/\byear\b/g, "տարի");
            })
          : labelsX.value;

      allData.value.push(resData[0].values);
      filteredData.value = [
        ...allData.value.map((line) => {
          return line.slice(sliceStart, sliceEnd);
        }),
      ];
    }
  };

  const handleChangeCurve = (data) => {
    labelsX.value = data[0].margins;
    allData.value = [
      ...data.map((el) => {
        return el.values;
      }),
    ];

    if (selectedCurve.value === "TBILL") {
      filteredLabelX.value =
        language.value == "arm"
          ? labelsX.value.map((el) => {
              return el
                .replace(/\bday\b/g, "օր")
                .replace(/\bmonth\b/g, "ամիս")
                .replace(/\byear\b/g, "տարի");
            })
          : labelsX.value;
      filteredData.value = allData.value;
    } else {
      const slicedLabelX = labelsX.value.slice(sliceStart, sliceEnd);
      filteredLabelX.value =
        language.value == "arm"
          ? slicedLabelX.map((el) => {
              return el
                .replace(/\bday\b/g, "օր")
                .replace(/\bmonth\b/g, "ամիս")
                .replace(/\byear\b/g, "տարի");
            })
          : slicedLabelX;
      filteredData.value = [
        ...allData.value.map((line) => {
          return line.slice(sliceStart, sliceEnd);
        }),
      ];
    }

    chartDataReady.value = true;
  };

  const setFilter = (text) => {
    let filterSpace = text.split(",");

    sliceStart = filterSpace[0]
      ? labelsX.value.indexOf(filterSpace[0] + " year")
      : 0;
    sliceEnd = filterSpace[1]
      ? labelsX.value.indexOf(filterSpace[1] + " year") + 1
      : labelsX.value.length;

    const slicedLabelX = labelsX.value.slice(sliceStart, sliceEnd);
    filteredLabelX.value =
      language.value == "arm"
        ? slicedLabelX.map((el) => {
            return el
              .replace(/\bday\b/g, "օր")
              .replace(/\bmonth\b/g, "ամիս")
              .replace(/\byear\b/g, "տարի");
          })
        : slicedLabelX;
    filteredData.value = [
      ...allData.value.map((line) => {
        return line.slice(sliceStart, sliceEnd);
      }),
    ];
    filter.value = text;
  };

  const getMonthName = (year, month) => {
    return format(new Date(year, month - 1), "MMM", {
      locale: language.value === "arm" ? hy : enUS,
    });
  };

  const formatDate = (date) => {
    const parsedDate = parse(date, "d LLL yyyy", new Date(), {
      locale: language.value === "arm" ? hy : enUS,
    });
    return format(parsedDate, "yyyy/MM/dd");
  };

  const changeSelectedYield = async (curveName) => {
    selectedCurve.value = curveName.split(" ")[0];
    chartDataReady.value = false;
    const dates = Array.from(selectedDays.value);
    await fetchData(dates);
  };

  const toggleDay = async (day, month, year) => {
    const currentDay = `${day < 10 ? "0" + day : day} ${month} ${year}`;
    console.log(currentDay);
    
    if (getSelectedDays.value.includes(currentDay)) {
      removeDay(currentDay);
    } else if (selectedDays.value.size < 5) {
      const formattedDate = formatDate(currentDay);
      fetchNewDate(formattedDate);
    }
  };

  const fetchNewDate = async (day) => {
    try {
      let response = await Axios.post(
        `${import.meta.env.VITE_API_URL}/api/yield-data/by-date`,
        {
          curve: selectedCurve.value,
          date: day,
        }
      );

      if (response.status === 200 && response.data.values[length]) {
        handleNewDate(response.data, day);
      } else {
        errorMsg.value = day;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleNewDate = (data, day) => {
    allData.value.push(data.values);
    selectedDays.value.add(day);

    const slicedData = data.values.slice(sliceStart, sliceEnd);
    const currentColor = colors.splice(0, 1)[0];

    filteredData.value.push(slicedData);
    lineColors.value.push(currentColor);

    newLineData.value = {
      label: day,
      data: slicedData,
      color: currentColor,
    };
  };

  const removeDay = (day) => {
    if (selectedDays.value.size > 1) {
      const index = getSelectedDays.value.indexOf(day);
      if (index !== -1) {
        const formattedDate = formatDate(day);

        selectedDays.value.delete(formattedDate);
        allData.value.splice(index, 1);
        filteredData.value.splice(index, 1);
        removeKey.value++;
        removedLineIndex.value = index;
        colors.push(lineColors.value.splice(index, 1));
      }
    }
  };

  const toggleLineInChart = (day) => {
    const index = getSelectedDays.value.indexOf(day);
    if (index !== -1) {
      toggleLineIndex.value = index;
      toggleKey.value++; // Force reactivity
    }
  };

  const downloadJSON = async (fileName, type) => {
    let data;
    switch (type) {
      case "filter":
        data = [];
        const selectedDaysArr = Array.from(selectedDays.value);
        allData.value.forEach((el, index) => {
          let obj = {
            date: selectedDaysArr[index],
          };
          labelsX.value.forEach((label, lIndex) => {
            obj[label] = el[lIndex];
          });
          data.push(obj);
        });
        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/current-year`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/all`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
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
      case "filter":
        data = [];
        const selectedDaysArr = Array.from(selectedDays.value);
        allData.value.forEach((el, index) => {
          let obj = {
            date: selectedDaysArr[index],
          };
          labelsX.value.forEach((label, lIndex) => {
            obj[label] = el[lIndex];
          });
          data.push(obj);
        });
        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/current-year`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/all`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
    }
    const csvData = convertToCSV(data, labelsX.value);
    downloadFile(fileName, csvData, "text/csv");
  };

  const downloadXML = async (fileName, type) => {
    let data;
    switch (type) {
      case "filter":
        data = [];
        const selectedDaysArr = Array.from(selectedDays.value);
        allData.value.forEach((el, index) => {
          let obj = {
            date: selectedDaysArr[index],
          };
          labelsX.value.forEach((label, lIndex) => {
            obj[label] = el[lIndex];
          });
          data.push(obj);
        });
        break;
      case "currentYear":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/current-year`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
          }
        } catch (err) {
          console.log(err);
        }
        break;
      case "all":
        try {
          let response = await Axios.post(
            `${import.meta.env.VITE_API_URL}/api/yield-data/all`,
            {
              curve: selectedCurve.value,
            }
          );

          if (response.status === 200) {
            data = response.data;
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
  const convertToCSV = (data, labelsOrder) => {
    if (!data || !data.length) return "";

    // Ensure "date" is the first field, then append ordered labels
    const headers = ["date", ...labelsOrder];
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(","));

    // Data rows
    data.forEach((row) => {
      const values = headers.map((field) => {
        const val = row[field] !== undefined ? row[field] : "";
        return `"${val}"`; // Wrap in quotes to escape commas, etc.
      });
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  };

  function convertToXML(data) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const xmlData = data
      .map((entry) => {
        // Start with the date element
        let entryXml = `<date>${entry.date}</date>\n`;
        // Loop through the remaining keys, using a generic tag (e.g., "maturity") and setting the original key as an attribute.
        Object.entries(entry).forEach(([key, value]) => {
          if (key === "date") return;
          // Create a maturity element with key attribute
          entryXml += `<maturity key="${key}">${value}</maturity>\n`;
        });
        return `<entry>\n${entryXml}</entry>`;
      })
      .join("\n");
    return `${xmlHeader}<data>\n${xmlData}\n</data>`;
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
    filter,
    filteredLabelX,
    filteredData,
    labelsX,
    selectedCurve,
    selectedDays,
    allData,
    chartDataReady,
    newLineData,
    removeKey,
    removedLineIndex,
    toggleKey,
    toggleLineIndex,
    getSelectedDays,
    lineColors,
    language,
    errorMsg,
    getLabels,
    fetchData,
    handleDataLoad,
    setFilter,
    changeSelectedYield,
    toggleDay,
    removeDay,
    toggleLineInChart,
    downloadJSON,
    downloadCSV,
    downloadXML,
    getLanguageFromParam,
  };
});
