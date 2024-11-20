async function getMultipleGlucoseData(start_date, end_date, daysDiff) {

    // Newer version supporting dynamic range of days.
    let glucoseData = [];
    const fetchGlucoseData = async (start, end) => getGlucoseData(start, end);
    const fetchDataChunks = [];

    for (let i = 0; i <= Math.ceil(daysDiff / 5); i++) {
        const start_date_chunk = calculateOffsetDate(start_date, i * 5 - 1);
        const end_date_chunk = calculateOffsetDate(start_date, (i + 1) * 5 - (i === 0 ? 0 : 1));
        fetchDataChunks.push(fetchGlucoseData(start_date_chunk, end_date_chunk));
    }

    const glucoseDataChunks = await Promise.all(fetchDataChunks);
    glucoseData = glucoseDataChunks.flat();


    //
    // Earlier version supporting 7 days.
    // let glucoseData;
    // if(daysDiff >5) {
    //     const start_date1 = calculateOffsetDate(start_date, -1);
    //     const end_date1 = calculateOffsetDate(start_date, 3);
    //     const start_date2 = calculateOffsetDate(start_date, 4);
    //     const end_date2 = calculateOffsetDate(end_date, 1);
    //     const [glucoseData1, glucoseData2] = await Promise.all([
    //         getGlucoseData(start_date1, end_date1),
    //         getGlucoseData(start_date2, end_date2)
    //     ]);
    //     // console.log("in first");
    //     glucoseData = glucoseData1.concat(glucoseData2);
    // } else {
    //     const start_date2 = calculateOffsetDate(start_date, -1);
    //     const end_date2 = calculateOffsetDate(end_date, 1);
    //     [glucoseData] = await Promise.all([
    //         getGlucoseData(start_date2, end_date2)
    //     ]);
    //     // console.log("in second");
    // }

    // console.log(glucoseData);

    if(glucoseData.length>0) {
        const cleanData = cleanGlucoseData(glucoseData, start_date, end_date);
        if(cleanData) {
            // console.log("Cleaned Data to return:");
            // console.log(cleanData);
            return cleanData;
        } else {
            toggleInputsAndButton(false);
            $('#alertContainer').html(`<div class="alert alert-danger" role="alert">No data found for selected dates.</div>`);
        }
    } else {
        toggleInputsAndButton(false);
        $('#alertContainer').html(`<div class="alert alert-danger" role="alert">No data found for selected dates.</div>`);
    }

}


let resourceId = '';

/**
 * Fetches glucose data for the specified date range.
 *
 * @param {string} start_date - The start date in YYYY-MM-DD format.
 * @param {string} end_date - The end date in YYYY-MM-DD format.
 */
function getGlucoseData(start_date, end_date) {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = `/glucosedata?start_date=${start_date}&end_date=${end_date}&resource_id=${resourceId}&request_timezone=${userTimeZone}`
    // const url = `${baseUrl}/v2/timeseries/${resourceId}/glucose?provider=&start_date=${start_date}&end_date=${end_date}`;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.error('There was a problem with the AJAX request:', textStatus, errorThrown);
                reject(textStatus);
            }
        });
    });
}

/**
 * Fetches meal data for the specified date range.
 *
 * @param {string} start_date - The start date in YYYY-MM-DD format.
 * @param {string} end_date - The end date in YYYY-MM-DD format.
 */
function getMealData(start_date, end_date) {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = `/mealdata?start_date=${start_date}&end_date=${end_date}&resource_id=${resourceId}&request_timezone=${userTimeZone}`
    // const url = `${baseUrl}/v2/summary/meal/${resourceId}?&start_date=${start_date}&end_date=${end_date}`;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {

                data.meals.forEach(item => {
                    item.timestamp = item.created_at;
                });

                resolve(cleanMealData(data));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.error('There was a problem with the AJAX request:', textStatus, errorThrown);
                reject(textStatus);
            }
        });
    });
}

function cleanGlucoseData(data, start_date, end_date) {
    let ans = [];
    const format = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");

// Parse start_date
    const startParts = start_date.split("-");
    const startYear = parseInt(startParts[0]);
    const startMonth = parseInt(startParts[1]) - 1; // Month is 0-indexed in JavaScript
    const startDay = parseInt(startParts[2]);
    const startLocal = new Date(startYear, startMonth, startDay);
    startLocal.setHours(0);
    startLocal.setMinutes(0);
    startLocal.setSeconds(0);
    startLocal.setMilliseconds(0);

    // Parse end_date
    const endParts = end_date.split("-");
    const endYear = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]) - 1; // Month is 0-indexed in JavaScript
    const endDay = parseInt(endParts[2]);
    const endLocal = new Date(endYear, endMonth, endDay);
    endLocal.setHours(23);
    endLocal.setMinutes(59);
    endLocal.setSeconds(59);
    endLocal.setMilliseconds(999);

    let filteredData;
    try {
        filteredData = data.filter(item => {
            let itemTimestamp = new Date(item.timestamp);
            return itemTimestamp >= startLocal && itemTimestamp <= endLocal;
        });

        const groupedData = d3.group(filteredData, d => d3.timeDay(format(d.timestamp)));

        if(groupedData.size<1) {
            return false;
        }

        const sortedEntries = Array.from(groupedData.entries())
            .sort((a, b) => d3.ascending(a[0], b[0]));

        sortedEntries.forEach(data => {
            ans.push(getCleanDataForDate(data[1]));
        })
        // console.log(ans);
        return ans;

    } catch (e) {
        alert("No data");
        return false;
    }
    // console.log(filteredData);
}

function cleanMealData(data) {
    try {
        let ans = [];
        let meals = data.meals;

        const format = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");

        const groupedData = d3.group(meals, d => d3.timeDay(format(d.timestamp)));
        // console.log(groupedData);
        return groupedData;
    } catch (e) {}
}

function getCleanDataForDate(data) {
    try {
        const format = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");

        let maxGlucose = Number.NEGATIVE_INFINITY;
        let minGlucose = Number.POSITIVE_INFINITY;
        let maxGlucoseTime = undefined;
        let minGlucoseTime = undefined;

        data.forEach(d => {
            d.datetime = format(d.timestamp);
            d.glucose = +((d.value * 18).toFixed(0));

            if (d.glucose > maxGlucose) {
                maxGlucose = d.glucose;
                maxGlucoseTime = d.datetime;
            }
            if (d.glucose < minGlucose) {
                minGlucose = d.glucose;
                minGlucoseTime = d.datetime;
            }
        });
        const convertedData = data.map(reading => ({
            datetime: reading.datetime,
            glucose: reading.glucose
        }));

        convertedData.sort((a, b) => d3.ascending(a.datetime, b.datetime));

        const dateOnly = new Date(maxGlucoseTime.getFullYear(), maxGlucoseTime.getMonth(), maxGlucoseTime.getDate());

        return {
            "date": dateOnly,
            "glucoseData": convertedData,
            "max": {
                "maxGlucose": maxGlucose,
                "maxGlucoseTime": maxGlucoseTime
            },
            "min": {
                "minGlucose": minGlucose,
                "minGlucoseTime": minGlucoseTime
            }
        };
    } catch (e) {}
}

function getAllPatients() {
    const url = `/users`;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.error('There was a problem with the AJAX request:', textStatus, errorThrown);
                reject(textStatus);
            }
        });
    });
}

function getPatientDetails(resourceId) {
    const url = `/user_details?resource_id=${resourceId}`;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.error('There was a problem with the AJAX request:', textStatus, errorThrown);
                reject(textStatus);
            }
        });
    });
}
