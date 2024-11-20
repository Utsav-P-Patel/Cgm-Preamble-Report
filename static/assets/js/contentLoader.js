let start_date = "2024-04-23";
let end_date = "2024-04-27";
let start_date1 = "2024-04-22";
let end_date1 = "2024-04-28";

let fromDate;
let toDate;
let last_name;
let first_name;
let user_id;

// FIXME: Add this where needed.
// document.getElementById('generate-pdf').scrollIntoView({ behavior: 'smooth' });

$(document).ready(() => {
    loadPatientSelect();
    togglePDFBtn(true);
})

function toggleInputsAndButton(disable) {
    $('#patientSelect, #fromDate, #toDate').prop('disabled', disable);
    if (disable) {
        $('#submitBtn').removeClass('d-flex');
    } else {
        $('#submitBtn').addClass('d-flex');
    }
    $('#submitBtn').css('display', disable ? 'none' : 'flex');

}
function clearForm() {
    $('#patientSelect').val('');
    $('#fromDate').val('');
    $('#toDate').val('');
}
function togglePDFBtn(hide) {
    $('#pdfButtonContainer').toggle(!hide);
}

function loadContentFn() {
    $('.main-container').empty();
    togglePDFBtn(true);
    $('#alertContainer').html('');
    toggleInputsAndButton(true);
    $('#patientDetails').html('');

    // Refresh variables before new request.
    totalGlucoseData = [];
    totalGlucoseSpikes = 0;
    timeInRange = 0;

    totalCalories = 0;
    totalProtein = 0;
    totalCarbohydrates = 0;
    totalFats = 0;
    totalDays = 0;

    first_name = undefined;
    last_name = undefined;
    user_id = undefined;

    let fromDateInput = document.getElementById("fromDate");
    let toDateInput = document.getElementById("toDate");

    let startDate = fromDateInput.value;
    let endDate = toDateInput.value;
    let patientResourceId = $('#patientSelect').val();
    resourceId = patientResourceId;

    if(patientResourceId) {
        getPatientDetails(patientResourceId).then( data => {
            // console.log(data[0]);
            first_name = data[0].first_name;
            last_name = data[0].last_name;
            user_id = data[0].id;
            const email = data[0].email;
            // console.log({ first_name, last_name, email });
            const patientDetailsDiv = $('#patientDetails').empty();
            patientDetailsDiv.append(`<h3>${first_name} ${last_name}</h3><p>${email}</p>`);
        });
    } else {
        toggleInputsAndButton(false);
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Please select a patient.</div>');
        return;
    }

    let startDate1 = new Date(startDate);
    let endDate1 = new Date(endDate);

    if (startDate && endDate && startDate1 <= endDate1) {

        let daysDiff = (endDate1 - startDate1) / (1000 * 3600 * 24);

        if (daysDiff > 13) {
            toggleInputsAndButton(false);
            $('#patientDetails').html('');
            $('#alertContainer').html('<div class="alert alert-danger" role="alert">Duration is more than 14 days.</div>');
            return;
        }

        $('#alertContainer').html('');
        start_date = formatDate(startDate);
        fromDate = start_date;
        end_date = formatDate(endDate);
        toDate = end_date;

        start_date1 = calculateOffsetDate(start_date, -1);
        end_date1 = calculateOffsetDate(end_date, 1);

        loadContent(daysDiff);
    } else {
        toggleInputsAndButton(false);
        console.log("Please select both start and end dates.");
        $('#patientDetails').html('');
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Please select valid dates.</div>');
    }
}
function formatDate(dateString) {
    let date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function calculateOffsetDate(dateString, offset) {
    let date = new Date(dateString);
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
}


// FIXME: Dynamic upper and lower limit.
// let upperLimit = 110;
let upperLimit = 145;
let lowerLimit = 70;
// let lowerLimit = 90;


async function loadContent(daysDiff) {
    let mergedData = await fetchMergedData(start_date, end_date, daysDiff);

    let mainContainer = $('.main-container');
    mainContainer.empty();

    // mergedData.forEach( (data, index) => {
    //     addContent(data.glucoseData, data.mealData, data.min, data.max, data.date, index);
    // });

    await Promise.all(mergedData.map( (data, index) =>
        addContent(data.glucoseData, data.mealData, data.min, data.max, data.date, index)
    ));

    setTimeout(function(){
        loadStats();
    }, 1000);

    togglePDFBtn(false);
    toggleInputsAndButton(false);
    clearForm();
}

function loadStats() {
    const mean = totalGlucoseData.reduce((sum, data) => sum + data.glucose, 0) / totalGlucoseData.length;
    const squaredDifferences = totalGlucoseData.map(data => Math.pow(data.glucose - mean, 2));
    const meanOfSquaredDifferences = squaredDifferences.reduce((sum, value) => sum + value, 0) / totalGlucoseData.length;
    const standardDeviation = Math.sqrt(meanOfSquaredDifferences);

    const range = (timeInRange/totalGlucoseData.length) *100;
//    console.log(timeInRange);
//    console.log(totalGlucoseData.length);
//    console.log(range);
//    console.log(totalGlucoseSpikes);

    let htmlContent = `<div class="indexPage" id="indexPage" style="height: 210mm;">
                                <span class="title mb-4">CGM Analysis</span>
                                <div class="svgContainer">
                                    <img src="static/assets/images/Union.svg" alt="Analysis Icon">
                                </div>
                            </div>
                            <hr class="m-0" style="border-top: 6px double #000000FF;">
                            <hr class="m-0" style="border-top: 6px double #000000FF;">
                            
                            <div class="indexPage mb-5" style="background-image: none;" id="statsPage">
                                <div class=" mt-4 mx-4" style="width: 60%;">
                                    <h4 class="subTitle" style="display: inline">Comprehensive Glucose Profile</h4>
                                    <table class="table mt-3" style="width:100%">
                                        <tbody>
                                            <tr>
                                                <td class="table-stats1">Average Glucose Value:</td>
                                                <td class="table-stats2">${mean.toFixed(0)} mg/dL</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1">Average Glucose Variability:</td>
                                                <td class="table-stats2">${standardDeviation.toFixed(0)} mg/dL</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1"># of spikes over ${upperLimit} mg/dl:</td>
                                                <td class="table-stats2">${(totalGlucoseSpikes/totalDays).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1">Time in range:</td>
                                                <td class="table-stats2">${range.toFixed(0)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class=" mt-4 mx-4" style="width: 60%;">
                                    <h4 class="subTitle" style="display: inline">Nutritional Information</h4>
                                    <table class="table mt-3" style="width:100%">
                                        <thead></thead>
                                        <tbody>
                                            <tr>
                                                <td class="table-stats1">Calories consumed per day:</td>
                                                <td class="table-stats2">${(totalCalories/totalDays).toFixed(0)}</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1">Protein consumed per day:</td>
                                                <td class="table-stats2">${(totalProtein/totalDays).toFixed(0)} g</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1">Carbohydrates consumed per day:</td>
                                                <td class="table-stats2">${(totalCarbohydrates/totalDays).toFixed(0)} g</td>
                                            </tr>
                                            <tr>
                                                <td class="table-stats1">Fat consumed per day:</td>
                                                <td class="table-stats2">${(totalFats/totalDays).toFixed()} g</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="row footer my-3" style="width: 100%">
                                </div>
                            </div>
                            <hr class="m-0" style="border-top: 6px double #000000FF;">`;
    // <img src="assets/images/Union.svg" alt="Analysis Icon">
    let mainContainer = document.querySelector('.main-container');
    mainContainer.innerHTML = htmlContent + mainContainer.innerHTML;

    // setTimeout(function(){
    //     loadFooter();
    // }, 5000);

    // To add footer.
    waitForUserInfo();
}

function waitForUserInfo() {
    const intervalId = setInterval(function() {
        if (typeof first_name !== 'undefined' && first_name !== '' &&
            typeof last_name !== 'undefined' && last_name !== '' &&
            typeof user_id !== 'undefined' && user_id !== '') {
            clearInterval(intervalId);
            loadFooter();
        }
    }, 100); // Check every 100ms
}
function loadFooter() {
    // const timestamp = new Date().toLocaleString();
    const timestamp = new Date().toISOString();
    let index = 1;
    $(".footer").each(function() {
        $(this).html(`
            <div class="col-4 text-start">${timestamp}</div>
            <div class="col-4 text-center">${user_id} - ${last_name}, ${first_name}</div>
            <div class="col-4 text-end">Page ${index+1} of ${totalDays+2}</div>
        `);
        index++;
    });
    // $("#statsPage").each(function() {
    //     $(this).html(`
    //         <div class="col-4 text-start">${timestamp}</div>
    //         <div class="col-4 text-center">${user_id} - ${last_name}, ${first_name}</div>
    //         <div class="col-4 text-end">Page ${1} of ${totalDays+1}</div>
    //     `);
    //     index++;
    // });

    // const htmlContent = `
    //     <div class="col-4 text-start">${timestamp}</div>
    //     <div class="col-4 text-center">${user_id} - ${last_name}, ${first_name}</div>
    //     <div class="col-4 text-end">Page ${1} of ${totalDays+1}</div>
    // `;
    // $("#statsPage").append(htmlContent);
}


async function addContent(glucoseData, mealData, min, max, date, index) {
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    let pageContent =`<hr class="m-0" style="border-top: 6px double #000000FF;">
                            <div class="page-container mb-5 font" id="page${index}">
                                <div class="chart-container mt-2" id="chart${index}"></div>
                                <div class="table-container mt-4 mx-4" id="table${index}">
                                    <h4 style="display: inline">Nutritional Information</h4><span style="display: inline"> - ${formattedDate}</span>
                                    <table class="table" style="width:100%">
                                        <thead>
                                            <tr>
                                                <th style="width: 5%">Label</th>
                                                <th style="width: 10%">Time</th>
                                                <th style="width: 10%">Type</th>
                                                <th>Foods</th>
                                                <th style="width: 8%">Calories (kcal)</th>
                                                <th style="width: 6%">Protein (g)</th>
                                                <th style="width: 6%">Carbs (g)</th>
                                                <th style="width: 4%">Fat (g)</th>
                                            </tr>
                                        </thead>
                                        <tbody></tbody>
                                        <tfoot></tfoot>
                                    </table>
                                </div>
                                <div class="row footer my-3">
                                    <div class="col-4 text-start"></div>
                                    <div class="col-4 text-center"></div>
                                    <div class="col-4 text-end"></div>
                                </div>
                            </div>
                            <hr class="m-0 mt-1" style="border-top: 6px double #000000FF;">`;

    let mainContainer = $('.main-container');
    mainContainer.append(pageContent);

    await generateChart(glucoseData, mealData, min, max, formattedDate, index, upperLimit, lowerLimit);
}

// merge both data here.
async function fetchMergedData(start_date, end_date, daysDiff) {
    try {
        console.log("Fetching data - wait here");
        const [glucoseData, mealData] = await Promise.all([
            getMultipleGlucoseData(start_date, end_date, daysDiff),
            getMealData(start_date1, end_date1)
        ]);
        console.log("Fetched merged data:");

        glucoseData.forEach( (data)=> {
            data.mealData = mealData.get(data.date);
        });
        // console.log(glucoseData);
        // console.log(mealData);
        return glucoseData;
    } catch (error) {
        toggleInputsAndButton(false);
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error fetching data from the server.</div>');
        console.error('Error fetching data:', error);
    }
}

function loadPatientSelect() {
    getAllPatients().then(data => {
        const select = $('#patientSelect');
        select.empty();

        const defaultOption = $('<option></option>')
            .val('')
            .attr('disabled', true)
            .attr('selected', true)
            .text('Select a patient');
        select.append(defaultOption);
        try {
            data.forEach(patient => {
                const option = $('<option></option>')
                    .val(patient.resource_id)
                    .text(`${patient.first_name} ${patient.last_name} (${patient.email})`);
                select.append(option);
            });
        } catch (e) {
            $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error loading patient data.</div>');
        }

    }).catch(error => {
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error loading patient data.</div>');
        console.error('Failed to load patients:', error);
    });
}
